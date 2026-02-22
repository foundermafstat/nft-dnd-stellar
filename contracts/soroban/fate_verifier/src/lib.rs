#![no_std]

mod contract;
mod groth16;
mod merkle;
mod poseidon;
mod storage;
mod types;

#[cfg(test)]
mod test;

pub use contract::FateVerifier;
pub use types::*;
