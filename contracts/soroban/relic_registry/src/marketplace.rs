//! Marketplace logic: Bid/Ask model with DND token escrow.

use soroban_sdk::{Address, Env, Vec};

use crate::storage::{
    Bid, DataKey, Listing, PERSISTENT_BUMP_AMOUNT, PERSISTENT_LIFETIME_THRESHOLD,
};

// ===========================================================================
// Bid Functions
// ===========================================================================

/// Place a bid on an NFT. Returns the bid ID.
pub fn place_bid(e: &Env, bidder: &Address, nft_id: u64, amount: i128) -> u64 {
    let bid_id = crate::storage::next_bid_id(e);

    let bid = Bid {
        id: bid_id,
        bidder: bidder.clone(),
        nft_id,
        amount,
        created_at: e.ledger().sequence() as u64,
    };

    // Store bid
    let bid_key = DataKey::Bid(bid_id);
    e.storage().persistent().set(&bid_key, &bid);
    e.storage()
        .persistent()
        .extend_ttl(&bid_key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);

    // Add bid_id to NFT's bid list
    let bids_key = DataKey::NftBids(nft_id);
    let mut bid_ids: Vec<u64> = e
        .storage()
        .persistent()
        .get(&bids_key)
        .unwrap_or(Vec::new(e));
    bid_ids.push_back(bid_id);
    e.storage().persistent().set(&bids_key, &bid_ids);

    bid_id
}

/// Cancel a bid. Returns the bid for refund processing.
pub fn cancel_bid(e: &Env, bidder: &Address, bid_id: u64) -> Bid {
    let bid_key = DataKey::Bid(bid_id);
    let bid: Bid = e
        .storage()
        .persistent()
        .get(&bid_key)
        .expect("bid does not exist");

    if bid.bidder != *bidder {
        panic!("only bidder can cancel");
    }

    // Remove bid from storage
    e.storage().persistent().remove(&bid_key);

    // Remove bid_id from NFT's bid list
    remove_bid_from_nft_list(e, bid.nft_id, bid_id);

    bid
}

/// Get a bid by ID.
pub fn get_bid(e: &Env, bid_id: u64) -> Bid {
    let bid_key = DataKey::Bid(bid_id);
    e.storage()
        .persistent()
        .get(&bid_key)
        .expect("bid does not exist")
}

/// Remove a bid after it's been accepted (internal).
pub fn remove_bid(e: &Env, bid_id: u64, nft_id: u64) {
    let bid_key = DataKey::Bid(bid_id);
    e.storage().persistent().remove(&bid_key);
    remove_bid_from_nft_list(e, nft_id, bid_id);
}

/// Get all bid IDs for an NFT.
pub fn get_nft_bids(e: &Env, nft_id: u64) -> Vec<u64> {
    let bids_key = DataKey::NftBids(nft_id);
    e.storage()
        .persistent()
        .get(&bids_key)
        .unwrap_or(Vec::new(e))
}

fn remove_bid_from_nft_list(e: &Env, nft_id: u64, bid_id: u64) {
    let bids_key = DataKey::NftBids(nft_id);
    if let Some(bid_ids) = e.storage().persistent().get::<_, Vec<u64>>(&bids_key) {
        let mut new_ids = Vec::new(e);
        for id in bid_ids.iter() {
            if id != bid_id {
                new_ids.push_back(id);
            }
        }
        e.storage().persistent().set(&bids_key, &new_ids);
    }
}

// ===========================================================================
// Listing Functions
// ===========================================================================

/// List an NFT for sale at a fixed price (Ask).
pub fn list_item(e: &Env, nft_id: u64, price: i128) {
    let listing = Listing {
        nft_id,
        price,
        listed_at: e.ledger().sequence() as u64,
    };

    let key = DataKey::Listing(nft_id);
    e.storage().persistent().set(&key, &listing);
    e.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
}

/// Remove a listing.
pub fn delist_item(e: &Env, nft_id: u64) {
    let key = DataKey::Listing(nft_id);
    e.storage().persistent().remove(&key);
}

/// Get a listing for an NFT.
pub fn get_listing(e: &Env, nft_id: u64) -> Option<Listing> {
    let key = DataKey::Listing(nft_id);
    e.storage().persistent().get(&key)
}
