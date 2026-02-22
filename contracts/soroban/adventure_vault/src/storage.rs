use soroban_sdk::{contracttype, Address, BytesN, Env, String, Vec};

pub(crate) const DAY_IN_LEDGERS: u32 = 17280;
pub(crate) const INSTANCE_BUMP_AMOUNT: u32 = 7 * DAY_IN_LEDGERS;
pub(crate) const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;
pub(crate) const SESSION_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
pub(crate) const SESSION_LIFETIME_THRESHOLD: u32 = SESSION_BUMP_AMOUNT - DAY_IN_LEDGERS;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Oracle,
    DndToken,
    FateVerifier,
    RelicRegistry,
    GameHub,
    SessionCounter,
    Session(u64),
}

/// Session status.
#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub enum SessionStatus {
    Active,
    Completed,
    Failed,
}

/// A game session.
#[derive(Clone, Debug)]
#[contracttype]
pub struct Session {
    pub id: u64,
    pub players: Vec<Address>,
    pub player_roots: Vec<BytesN<32>>,
    pub oracle_root: BytesN<32>,
    pub status: SessionStatus,
    pub action_count: u32,
    pub created_at: u64,
    pub fee_per_player: i128,
}

/// Loot entry for end_adventure.
#[derive(Clone, Debug)]
#[contracttype]
pub struct LootEntry {
    pub winner: Address,
    pub metadata_cid: String,
}

// ===========================================================================
// Storage helpers
// ===========================================================================

pub fn read_admin(e: &Env) -> Address {
    e.storage().instance().get(&DataKey::Admin).unwrap()
}

pub fn write_admin(e: &Env, admin: &Address) {
    e.storage().instance().set(&DataKey::Admin, admin);
}

pub fn read_oracle(e: &Env) -> Address {
    e.storage().instance().get(&DataKey::Oracle).unwrap()
}

pub fn write_oracle(e: &Env, oracle: &Address) {
    e.storage().instance().set(&DataKey::Oracle, oracle);
}

pub fn read_dnd_token(e: &Env) -> Address {
    e.storage().instance().get(&DataKey::DndToken).unwrap()
}

pub fn read_fate_verifier(e: &Env) -> Address {
    e.storage().instance().get(&DataKey::FateVerifier).unwrap()
}

pub fn read_relic_registry(e: &Env) -> Address {
    e.storage().instance().get(&DataKey::RelicRegistry).unwrap()
}

pub fn read_game_hub(e: &Env) -> Address {
    e.storage().instance().get(&DataKey::GameHub).unwrap()
}

/// Get and increment the session counter.
pub fn next_session_id(e: &Env) -> u64 {
    let id: u64 = e
        .storage()
        .instance()
        .get(&DataKey::SessionCounter)
        .unwrap_or(0);
    e.storage()
        .instance()
        .set(&DataKey::SessionCounter, &(id + 1));
    id + 1
}

/// Get the total session count.
pub fn session_count(e: &Env) -> u64 {
    e.storage()
        .instance()
        .get(&DataKey::SessionCounter)
        .unwrap_or(0)
}

/// Read a session from persistent storage.
pub fn read_session(e: &Env, session_id: u64) -> Session {
    let key = DataKey::Session(session_id);
    e.storage()
        .persistent()
        .get(&key)
        .expect("session does not exist")
}

/// Write a session to persistent storage.
pub fn write_session(e: &Env, session: &Session) {
    let key = DataKey::Session(session.id);
    e.storage().persistent().set(&key, session);
    e.storage()
        .persistent()
        .extend_ttl(&key, SESSION_LIFETIME_THRESHOLD, SESSION_BUMP_AMOUNT);
}
