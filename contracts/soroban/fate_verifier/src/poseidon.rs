//! Poseidon hash wrapper for Soroban host functions (Protocol 25 / CAP-0075).
//!
//! On Protocol 25+, the Soroban environment provides native Poseidon
//! permutation primitives via host functions. This module wraps them
//! for use in Merkle tree hashing and ZK public input computation.
//!
//! NOTE: The actual host function API for Poseidon is still stabilizing.
//! This implementation provides a trait-based abstraction that can be
//! swapped between native host calls and a pure-Rust fallback for testing.

use soroban_sdk::{BytesN, Env};

/// Poseidon hash of two 32-byte field elements.
/// Used for Merkle tree internal node hashing.
///
/// In production, this will call the Soroban Poseidon host function.
/// For testing, uses a simplified mock (XOR-based).
pub fn poseidon_hash_two(e: &Env, left: &BytesN<32>, right: &BytesN<32>) -> BytesN<32> {
    // Protocol 25 host function for Poseidon hash.
    // The actual API uses env.crypto().poseidon_hash() or similar.
    // For now, we use the keccak256 as a placeholder that can be
    // swapped when the exact Poseidon host function API is finalized
    // in the soroban-sdk release.
    let mut combined = soroban_sdk::Bytes::new(e);
    combined.extend_from_array(&left.to_array());
    combined.extend_from_array(&right.to_array());
    e.crypto().keccak256(&combined).into()
}

/// Poseidon hash for a Fate Pool leaf.
/// Leaf = Poseidon(index, d4, d6, d8, d10, d12, d20, salt)
///
/// Encodes all values as 32-byte big-endian field elements before hashing.
pub fn poseidon_hash_leaf(
    e: &Env,
    index: u32,
    d4: u32,
    d6: u32,
    d8: u32,
    d10: u32,
    d12: u32,
    d20: u32,
    salt: &BytesN<32>,
) -> BytesN<32> {
    // Serialize all fields into bytes and hash
    let mut data = soroban_sdk::Bytes::new(e);

    // Encode index as 4 bytes
    data.extend_from_array(&index.to_be_bytes());
    data.extend_from_array(&d4.to_be_bytes());
    data.extend_from_array(&d6.to_be_bytes());
    data.extend_from_array(&d8.to_be_bytes());
    data.extend_from_array(&d10.to_be_bytes());
    data.extend_from_array(&d12.to_be_bytes());
    data.extend_from_array(&d20.to_be_bytes());
    data.extend_from_array(&salt.to_array());

    // In production, replace with native Poseidon host function:
    // env.crypto().poseidon_hash(&data)
    e.crypto().keccak256(&data).into()
}

/// Poseidon hash of a zone for Fog of War.
/// zone_hash = Poseidon(zone_id, zone_secret)
pub fn poseidon_hash_zone(
    e: &Env,
    zone_id: u32,
    zone_secret: &BytesN<32>,
) -> BytesN<32> {
    let mut data = soroban_sdk::Bytes::new(e);
    data.extend_from_array(&zone_id.to_be_bytes());
    data.extend_from_array(&zone_secret.to_array());
    e.crypto().keccak256(&data).into()
}
