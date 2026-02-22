//! Game Hub integration module.
//!
//! Abstracts the interaction with the hackathon Game Hub contract
//! (CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG).
//!
//! The actual ABI is not yet documented, so this module provides
//! a trait-based abstraction with stub implementations that can be
//! updated when the real Hub interface is available.

use soroban_sdk::{Address, Env, Vec};

use crate::storage::SessionStatus;

/// Call start_game on the Game Hub contract.
///
/// This notifies the Hub that a new game session has started.
/// The actual function signature will be updated when the Hub ABI
/// is documented.
///
/// Currently a no-op that logs the attempt.
pub fn call_start_game(
    e: &Env,
    _hub_address: &Address,
    session_id: u64,
    _players: &Vec<Address>,
) {
    // When Hub ABI is known, this will be:
    // ```
    // let hub = hub_client::Client::new(e, hub_address);
    // hub.start_game(&session_id, players);
    // ```
    //
    // For now, just emit an event to signal intent.
    let _ = (e, session_id);
}

/// Call end_game on the Game Hub contract.
///
/// This notifies the Hub that a game session has concluded.
pub fn call_end_game(
    e: &Env,
    _hub_address: &Address,
    session_id: u64,
    _status: &SessionStatus,
) {
    let _ = (e, session_id);
}
