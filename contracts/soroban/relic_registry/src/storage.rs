use soroban_sdk::{contracttype, Address, Env, String};

pub(crate) const DAY_IN_LEDGERS: u32 = 17280;
pub(crate) const INSTANCE_BUMP_AMOUNT: u32 = 7 * DAY_IN_LEDGERS;
pub(crate) const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;
pub(crate) const PERSISTENT_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
pub(crate) const PERSISTENT_LIFETIME_THRESHOLD: u32 = PERSISTENT_BUMP_AMOUNT - DAY_IN_LEDGERS;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Oracle,
    DndToken,
    NftCounter,
    BidCounter,
    Nft(u64),
    NftOwner(u64),
    Bid(u64),
    NftBids(u64),
    Listing(u64),
}

/// NFT metadata stored on-chain.
#[derive(Clone, Debug)]
#[contracttype]
pub struct RelicMetadata {
    pub id: u64,
    pub metadata_cid: String,
    pub minted_at: u64,
    pub repair_count: u32,
}

/// A bid on an NFT.
#[derive(Clone, Debug)]
#[contracttype]
pub struct Bid {
    pub id: u64,
    pub bidder: Address,
    pub nft_id: u64,
    pub amount: i128,
    pub created_at: u64,
}

/// A listing (Ask) for an NFT.
#[derive(Clone, Debug)]
#[contracttype]
pub struct Listing {
    pub nft_id: u64,
    pub price: i128,
    pub listed_at: u64,
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

pub fn write_dnd_token(e: &Env, token: &Address) {
    e.storage().instance().set(&DataKey::DndToken, token);
}

/// Get and increment the NFT counter.
pub fn next_nft_id(e: &Env) -> u64 {
    let id: u64 = e
        .storage()
        .instance()
        .get(&DataKey::NftCounter)
        .unwrap_or(0);
    e.storage()
        .instance()
        .set(&DataKey::NftCounter, &(id + 1));
    id + 1
}

/// Get and increment the bid counter.
pub fn next_bid_id(e: &Env) -> u64 {
    let id: u64 = e
        .storage()
        .instance()
        .get(&DataKey::BidCounter)
        .unwrap_or(0);
    e.storage()
        .instance()
        .set(&DataKey::BidCounter, &(id + 1));
    id + 1
}
