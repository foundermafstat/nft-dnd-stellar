#![cfg(test)]

use soroban_sdk::{testutils::Address as _, vec, Address, BytesN, Env, Vec};

use crate::contract::{FateVerifier, FateVerifierClient};
use crate::poseidon::{poseidon_hash_leaf, poseidon_hash_two};
use crate::types::DiceValues;

fn create_verifier<'a>(e: &Env, admin: &Address) -> FateVerifierClient<'a> {
    let contract_id = e.register(FateVerifier, (admin,));
    FateVerifierClient::new(e, &contract_id)
}



#[test]
fn test_poseidon_hash_consistency() {
    let e = Env::default();

    let salt = BytesN::from_array(&e, &[42u8; 32]);

    // Hash the same inputs twice — should get same result
    let hash1 = poseidon_hash_leaf(&e, 1, 3, 5, 7, 9, 11, 17, &salt);
    let hash2 = poseidon_hash_leaf(&e, 1, 3, 5, 7, 9, 11, 17, &salt);

    assert_eq!(hash1, hash2);

    // Different salt should produce different hash
    let salt2 = BytesN::from_array(&e, &[99u8; 32]);
    let hash3 = poseidon_hash_leaf(&e, 1, 3, 5, 7, 9, 11, 17, &salt2);
    assert_ne!(hash1, hash3);
}

#[test]
fn test_merkle_verify_valid_proof() {
    let e = Env::default();

    let salt = BytesN::from_array(&e, &[1u8; 32]);
    let zero = BytesN::from_array(&e, &[0u8; 32]);

    // Build a depth-9 tree with a single leaf at index 0
    let leaf = poseidon_hash_leaf(&e, 1, 1, 1, 1, 1, 1, 1, &salt);

    // Build proof: all siblings are zero hashes
    let mut proof = Vec::new(&e);
    let mut current = leaf.clone();
    for _ in 0..9u32 {
        proof.push_back(zero.clone());
        current = poseidon_hash_two(&e, &current, &zero);
    }
    let root = current;

    // Verify — should pass
    let result = crate::merkle::verify_merkle_proof(&e, &root, &leaf, &proof, 0);
    assert!(result, "Merkle proof for leaf 0 should be valid");
}

#[test]
fn test_merkle_verify_invalid_proof() {
    let e = Env::default();

    let salt = BytesN::from_array(&e, &[1u8; 32]);
    let zero = BytesN::from_array(&e, &[0u8; 32]);

    let leaf = poseidon_hash_leaf(&e, 1, 1, 1, 1, 1, 1, 1, &salt);
    let wrong_leaf = poseidon_hash_leaf(&e, 2, 2, 3, 4, 5, 6, 10, &salt);

    // Build valid proof for leaf at index 0
    let mut proof = Vec::new(&e);
    let mut current = leaf.clone();
    for _ in 0..9u32 {
        proof.push_back(zero.clone());
        current = poseidon_hash_two(&e, &current, &zero);
    }
    let root = current;

    // Verify wrong_leaf against the root built for leaf — should fail
    let result = crate::merkle::verify_merkle_proof(&e, &root, &wrong_leaf, &proof, 0);
    assert!(!result);
}

#[test]
fn test_verify_dice_roll_valid() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let client = create_verifier(&e, &admin);

    let salt = BytesN::from_array(&e, &[7u8; 32]);

    // Build dice values
    let dice = DiceValues {
        d4: 3,
        d6: 5,
        d8: 7,
        d10: 9,
        d12: 11,
        d20: 17,
    };

    // Create the leaf (index = 1)
    let leaf = poseidon_hash_leaf(&e, 1, 3, 5, 7, 9, 11, 17, &salt);

    // For a depth-9 tree, we need 9 siblings. Build a minimal tree
    // where only leaf at index 0 exists, rest are zeros.
    let zero = BytesN::from_array(&e, &[0u8; 32]);
    let mut merkle_proof = soroban_sdk::Vec::new(&e);

    // Build the tree bottom-up, computing root
    let mut current = leaf.clone();
    for _ in 0..9 {
        merkle_proof.push_back(zero.clone());
        // Since index 0 is always left child, sibling is always on the right
        current = poseidon_hash_two(&e, &current, &zero);
    }

    let root = current;

    // Verify the dice roll
    let result = client.verify_dice_roll(
        &root,
        &1, // 1-based index
        &dice,
        &salt,
        &merkle_proof,
    );

    assert!(result);
}

#[test]
fn test_verify_dice_roll_invalid_range() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let client = create_verifier(&e, &admin);

    let salt = BytesN::from_array(&e, &[7u8; 32]);
    let root = BytesN::from_array(&e, &[0u8; 32]);
    let merkle_proof = soroban_sdk::Vec::new(&e);

    // d4 = 5 is out of range (max 4)
    let bad_dice = DiceValues {
        d4: 5,
        d6: 1,
        d8: 1,
        d10: 1,
        d12: 1,
        d20: 1,
    };

    let result = client.verify_dice_roll(
        &root,
        &1,
        &bad_dice,
        &salt,
        &merkle_proof,
    );

    assert!(!result);
}

#[test]
fn test_verify_dice_roll_index_out_of_range() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let client = create_verifier(&e, &admin);

    let salt = BytesN::from_array(&e, &[7u8; 32]);
    let root = BytesN::from_array(&e, &[0u8; 32]);
    let merkle_proof = soroban_sdk::Vec::new(&e);

    let dice = DiceValues {
        d4: 1,
        d6: 1,
        d8: 1,
        d10: 1,
        d12: 1,
        d20: 1,
    };

    // Index 0 is invalid (must be 1-300)
    assert!(!client.verify_dice_roll(&root, &0, &dice, &salt, &merkle_proof));

    // Index 301 is invalid
    assert!(!client.verify_dice_roll(&root, &301, &dice, &salt, &merkle_proof));
}
