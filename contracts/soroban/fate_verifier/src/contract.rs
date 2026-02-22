use soroban_sdk::{contract, contractimpl, contractmeta, Address, BytesN, Env, Vec};

use crate::groth16::verify_groth16;
use crate::merkle::verify_merkle_proof;
use crate::poseidon::poseidon_hash_leaf;
use crate::storage::{
    read_admin, read_vk, write_admin, write_vk, INSTANCE_BUMP_AMOUNT, INSTANCE_LIFETIME_THRESHOLD,
};
use crate::types::{DiceValues, Groth16Proof, VerificationKey, VkType};

contractmeta!(
    key = "Description",
    val = "Fate Verifier - ZK Core for NFT-DND dice rolls and fog-of-war"
);

#[contract]
pub struct FateVerifier;

#[contractimpl]
impl FateVerifier {
    /// Initialize the Fate Verifier with admin and optional verification keys.
    pub fn __constructor(e: Env, admin: Address) {
        write_admin(&e, &admin);
    }

    // ===================================================================
    // Admin Functions
    // ===================================================================

    /// Set or update a verification key (dice or fog-of-war).
    pub fn set_vk(e: Env, vk_type: VkType, vk: VerificationKey) {
        let admin = read_admin(&e);
        admin.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        write_vk(&e, vk_type, &vk);
    }

    /// Update the admin address.
    pub fn set_admin(e: Env, new_admin: Address) {
        let admin = read_admin(&e);
        admin.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        write_admin(&e, &new_admin);
    }

    // ===================================================================
    // Verification Functions
    // ===================================================================

    /// Verify a dice roll against a committed Merkle root.
    ///
    /// The prover (player or oracle) commits to a Merkle tree of 300 dice
    /// batches at session start. During gameplay, they reveal individual
    /// leaves and provide Merkle proofs.
    ///
    /// This function verifies:
    /// 1. The Merkle proof is valid (leaf belongs to the committed root).
    /// 2. Optionally, the ZK proof that the leaf was generated correctly
    ///    (commented out until Groth16 VK is deployed).
    ///
    /// # Arguments
    /// * `expected_root` - Merkle root committed at session start.
    /// * `index` - Leaf index (1..300, converted to 0-based internally).
    /// * `revealed_values` - The dice values being revealed.
    /// * `salt` - Per-leaf salt used during tree generation.
    /// * `merkle_proof` - Sibling hashes along the path.
    ///
    /// # Returns
    /// `true` if the dice roll is verified as authentic.
    pub fn verify_dice_roll(
        e: Env,
        expected_root: BytesN<32>,
        index: u32,
        revealed_values: DiceValues,
        salt: BytesN<32>,
        merkle_proof: Vec<BytesN<32>>,
    ) -> bool {
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // Validate index range (1-based → 0-based)
        if index == 0 || index > 300 {
            return false;
        }
        let zero_based_index = index - 1;

        // Validate dice value ranges
        if !validate_dice_ranges(&revealed_values) {
            return false;
        }

        // Reconstruct the leaf hash
        let leaf = poseidon_hash_leaf(
            &e,
            index,
            revealed_values.d4,
            revealed_values.d6,
            revealed_values.d8,
            revealed_values.d10,
            revealed_values.d12,
            revealed_values.d20,
            &salt,
        );

        // Verify Merkle proof
        verify_merkle_proof(&e, &expected_root, &leaf, &merkle_proof, zero_based_index)
    }

    /// Verify a dice roll with a ZK proof (full Groth16 verification).
    ///
    /// This version additionally verifies a Groth16 proof that the dice
    /// values were generated correctly according to the game rules.
    pub fn verify_dice_roll_zk(
        e: Env,
        proof: Groth16Proof,
        expected_root: BytesN<32>,
        index: u32,
        revealed_values: DiceValues,
    ) -> bool {
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // Validate index range
        if index == 0 || index > 300 {
            return false;
        }

        // Get the dice verification key
        let vk = match read_vk(&e, VkType::Dice) {
            Some(vk) => vk,
            None => return false, // VK not set yet
        };

        // Construct public inputs for the Groth16 verifier
        // Public inputs: [expected_root, index_as_field, d4, d6, d8, d10, d12, d20]
        let mut public_inputs: Vec<BytesN<32>> = Vec::new(&e);
        public_inputs.push_back(expected_root.clone());
        public_inputs.push_back(u32_to_field(&e, index));
        public_inputs.push_back(u32_to_field(&e, revealed_values.d4));
        public_inputs.push_back(u32_to_field(&e, revealed_values.d6));
        public_inputs.push_back(u32_to_field(&e, revealed_values.d8));
        public_inputs.push_back(u32_to_field(&e, revealed_values.d10));
        public_inputs.push_back(u32_to_field(&e, revealed_values.d12));
        public_inputs.push_back(u32_to_field(&e, revealed_values.d20));

        verify_groth16(&e, &vk, &proof, &public_inputs)
    }

    /// Verify a fog-of-war proof.
    ///
    /// The player proves they have the right to see a room/zone without
    /// revealing their exact position. The ZK circuit uses Poseidon to
    /// hash coordinates and visibility radius, proving collision (distance
    /// within visibility range) without revealing exact X, Y.
    ///
    /// # Arguments
    /// * `proof` - Groth16 proof.
    /// * `zone_hash` - Poseidon(zone_id, zone_secret) — public commitment.
    ///
    /// # Returns
    /// `true` if the player has proven visibility rights.
    pub fn verify_fog_of_war(
        e: Env,
        proof: Groth16Proof,
        zone_hash: BytesN<32>,
    ) -> bool {
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // Get the fog-of-war verification key
        let vk = match read_vk(&e, VkType::FogOfWar) {
            Some(vk) => vk,
            None => return false,
        };

        // Public inputs: [zone_hash]
        let mut public_inputs: Vec<BytesN<32>> = Vec::new(&e);
        public_inputs.push_back(zone_hash);

        verify_groth16(&e, &vk, &proof, &public_inputs)
    }

    // ===================================================================
    // Read-only
    // ===================================================================

    /// Check if a verification key is configured.
    pub fn has_vk(e: Env, vk_type: VkType) -> bool {
        read_vk(&e, vk_type).is_some()
    }
}

// ===========================================================================
// Helpers
// ===========================================================================

/// Validate that dice values are within their valid ranges.
fn validate_dice_ranges(values: &DiceValues) -> bool {
    values.d4 >= 1
        && values.d4 <= 4
        && values.d6 >= 1
        && values.d6 <= 6
        && values.d8 >= 1
        && values.d8 <= 8
        && values.d10 >= 1
        && values.d10 <= 10
        && values.d12 >= 1
        && values.d12 <= 12
        && values.d20 >= 1
        && values.d20 <= 20
}

/// Convert a u32 to a 32-byte field element (big-endian, zero-padded).
fn u32_to_field(e: &Env, val: u32) -> BytesN<32> {
    let mut bytes = [0u8; 32];
    let val_bytes = val.to_be_bytes();
    bytes[28] = val_bytes[0];
    bytes[29] = val_bytes[1];
    bytes[30] = val_bytes[2];
    bytes[31] = val_bytes[3];
    BytesN::from_array(e, &bytes)
}
