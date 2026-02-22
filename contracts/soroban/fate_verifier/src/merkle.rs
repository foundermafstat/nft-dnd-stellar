//! Poseidon-based Merkle tree verification.
//!
//! Depth: 9 (512 leaves, 300 used + 212 padded with zeros).
//! Each leaf = Poseidon(index, d4, d6, d8, d10, d12, d20, salt).

use soroban_sdk::{BytesN, Env, Vec};

use crate::poseidon::poseidon_hash_two;

/// Maximum tree depth (2^9 = 512 leaves).
pub const TREE_DEPTH: u32 = 9;

/// Maximum number of actual leaves (Fate Pool size).
pub const FATE_POOL_SIZE: u32 = 300;

/// Verify a Merkle proof for a given leaf against an expected root.
///
/// # Arguments
/// * `root` - Expected Merkle root.
/// * `leaf` - The leaf hash to verify.
/// * `proof` - Vector of sibling hashes along the path (length = TREE_DEPTH).
/// * `index` - Leaf index (0-based within the padded tree, 0..511).
///
/// # Returns
/// `true` if the proof is valid, `false` otherwise.
pub fn verify_merkle_proof(
    e: &Env,
    root: &BytesN<32>,
    leaf: &BytesN<32>,
    proof: &Vec<BytesN<32>>,
    index: u32,
) -> bool {
    if proof.len() != TREE_DEPTH {
        return false;
    }
    if index >= (1 << TREE_DEPTH) {
        return false;
    }

    let mut computed = leaf.clone();
    let mut idx = index;

    for i in 0..TREE_DEPTH {
        let sibling = proof.get(i).unwrap();
        if idx % 2 == 0 {
            // Current node is left child
            computed = poseidon_hash_two(e, &computed, &sibling);
        } else {
            // Current node is right child
            computed = poseidon_hash_two(e, &sibling, &computed);
        }
        idx /= 2;
    }

    computed == *root
}
