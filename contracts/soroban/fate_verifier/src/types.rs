use soroban_sdk::{contracttype, BytesN, Vec};

/// Dice values for a single roll batch.
/// Each field represents the result of a specific die type.
#[derive(Clone, Debug)]
#[contracttype]
pub struct DiceValues {
    pub d4: u32,
    pub d6: u32,
    pub d8: u32,
    pub d10: u32,
    pub d12: u32,
    pub d20: u32,
}

/// A point on the G1 curve (BN254).
/// Encoded as 64 bytes (32 bytes x, 32 bytes y).
#[derive(Clone, Debug)]
#[contracttype]
pub struct G1Point {
    pub x: BytesN<32>,
    pub y: BytesN<32>,
}

/// A point on the G2 curve (BN254).
/// Encoded as 128 bytes (2 × 32 bytes for each coordinate).
#[derive(Clone, Debug)]
#[contracttype]
pub struct G2Point {
    pub x_real: BytesN<32>,
    pub x_imag: BytesN<32>,
    pub y_real: BytesN<32>,
    pub y_imag: BytesN<32>,
}

/// Groth16 proof (A, B, C points).
#[derive(Clone, Debug)]
#[contracttype]
pub struct Groth16Proof {
    pub a: G1Point,
    pub b: G2Point,
    pub c: G1Point,
}

/// Groth16 verification key.
#[derive(Clone, Debug)]
#[contracttype]
pub struct VerificationKey {
    pub alpha: G1Point,
    pub beta: G2Point,
    pub gamma: G2Point,
    pub delta: G2Point,
    pub ic: Vec<G1Point>,
}

/// Type of verification key (dice or fog of war).
#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub enum VkType {
    Dice,
    FogOfWar,
}
