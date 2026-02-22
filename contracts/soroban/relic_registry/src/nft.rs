//! NFT (Relic) CRUD operations.

use soroban_sdk::{Address, Env, String};

use crate::storage::{
    DataKey, RelicMetadata, PERSISTENT_BUMP_AMOUNT, PERSISTENT_LIFETIME_THRESHOLD,
};

/// Mint a new relic NFT. Returns the new NFT ID.
pub fn mint(e: &Env, owner: &Address, metadata_cid: String) -> u64 {
    let id = crate::storage::next_nft_id(e);

    let metadata = RelicMetadata {
        id,
        metadata_cid,
        minted_at: e.ledger().sequence() as u64,
        repair_count: 0,
    };

    let nft_key = DataKey::Nft(id);
    let owner_key = DataKey::NftOwner(id);

    e.storage().persistent().set(&nft_key, &metadata);
    e.storage().persistent().set(&owner_key, owner);

    e.storage()
        .persistent()
        .extend_ttl(&nft_key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
    e.storage()
        .persistent()
        .extend_ttl(&owner_key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);

    id
}

/// Get the owner of an NFT.
pub fn owner_of(e: &Env, nft_id: u64) -> Address {
    let key = DataKey::NftOwner(nft_id);
    e.storage()
        .persistent()
        .get(&key)
        .expect("NFT does not exist")
}

/// Get the metadata of an NFT.
pub fn metadata(e: &Env, nft_id: u64) -> RelicMetadata {
    let key = DataKey::Nft(nft_id);
    e.storage()
        .persistent()
        .get(&key)
        .expect("NFT does not exist")
}

/// Transfer NFT ownership.
pub fn transfer(e: &Env, nft_id: u64, new_owner: &Address) {
    let key = DataKey::NftOwner(nft_id);
    if !e.storage().persistent().has(&key) {
        panic!("NFT does not exist");
    }
    e.storage().persistent().set(&key, new_owner);
    e.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
}

/// Destroy an NFT (burn). Returns true if successful.
pub fn burn(e: &Env, nft_id: u64) -> bool {
    let nft_key = DataKey::Nft(nft_id);
    let owner_key = DataKey::NftOwner(nft_id);

    if !e.storage().persistent().has(&nft_key) {
        return false;
    }

    e.storage().persistent().remove(&nft_key);
    e.storage().persistent().remove(&owner_key);
    true
}

/// Increment the repair count of an NFT.
pub fn increment_repair(e: &Env, nft_id: u64) {
    let key = DataKey::Nft(nft_id);
    let mut meta: RelicMetadata = e
        .storage()
        .persistent()
        .get(&key)
        .expect("NFT does not exist");

    meta.repair_count += 1;

    e.storage().persistent().set(&key, &meta);
    e.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
}
