//! Session lifecycle helpers.

use soroban_sdk::{Address, BytesN, Env, Map, String, Vec};

use crate::storage::{next_session_id, write_session, Session, SessionStatus};

/// Create a new game session.
pub fn create_session(
    e: &Env,
    players: Vec<Address>,
    player_roots: Vec<BytesN<32>>,
    oracle_root: BytesN<32>,
    fee_per_player: i128,
) -> Session {
    if players.len() == 0 {
        panic!("at least one player required");
    }
    if players.len() != player_roots.len() {
        panic!("players and roots length mismatch");
    }
    if players.len() > 5 {
        panic!("max 5 players per party");
    }

    let id = next_session_id(e);

    let session = Session {
        id,
        players,
        player_roots,
        oracle_root,
        status: SessionStatus::Active,
        action_count: 0,
        created_at: e.ledger().sequence() as u64,
        fee_per_player,
        pending_loot_cid: None,
        loot_rolls: Map::new(e),
    };

    write_session(e, &session);
    session
}

/// Increment action count for a session.
pub fn increment_actions(e: &Env, session: &mut Session) {
    session.action_count += 1;
    write_session(e, session);
}

/// Mark session as completed or failed.
pub fn finish_session(e: &Env, session: &mut Session, status: SessionStatus) {
    if session.status != SessionStatus::Active && session.status != SessionStatus::LootRolling {
        panic!("session is not in a finalizable state");
    }
    session.status = status;
    write_session(e, session);
}
