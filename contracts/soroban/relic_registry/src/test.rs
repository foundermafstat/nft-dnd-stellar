#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env, String};

use crate::contract::{RelicRegistry, RelicRegistryClient};

// For marketplace tests we use the built-in Stellar Asset Contract as mock DND token.
use soroban_sdk::token::{StellarAssetClient, TokenClient};

fn create_test_token(e: &Env, admin: &Address) -> Address {
    let token_address = e.register_stellar_asset_contract_v2(admin.clone()).address().clone();
    token_address
}

fn create_registry<'a>(
    e: &Env,
    admin: &Address,
    oracle: &Address,
    dnd_token: &Address,
) -> RelicRegistryClient<'a> {
    let contract_id = e.register(RelicRegistry, (admin, oracle, dnd_token));
    RelicRegistryClient::new(e, &contract_id)
}

// ===================================================================
// NFT Tests
// ===================================================================

#[test]
fn test_mint_relic() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let oracle = Address::generate(&e);
    let dnd_token = Address::generate(&e);
    let winner = Address::generate(&e);

    let client = create_registry(&e, &admin, &oracle, &dnd_token);

    let cid = String::from_str(&e, "QmTestCID12345");
    let nft_id = client.mint_relic(&winner, &cid);

    assert_eq!(nft_id, 1);
    assert_eq!(client.owner_of(&nft_id), winner);

    let meta = client.metadata(&nft_id);
    assert_eq!(meta.id, 1);
    assert_eq!(meta.repair_count, 0);
}

#[test]
fn test_transfer_nft() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let oracle = Address::generate(&e);
    let dnd_token = Address::generate(&e);
    let user1 = Address::generate(&e);
    let user2 = Address::generate(&e);

    let client = create_registry(&e, &admin, &oracle, &dnd_token);

    let cid = String::from_str(&e, "QmTestCID");
    let nft_id = client.mint_relic(&user1, &cid);

    client.transfer_nft(&user1, &user2, &nft_id);
    assert_eq!(client.owner_of(&nft_id), user2);
}

#[test]
fn test_burn_to_repair() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let oracle = Address::generate(&e);
    let dnd_token = Address::generate(&e);
    let owner = Address::generate(&e);

    let client = create_registry(&e, &admin, &oracle, &dnd_token);

    let target_id = client.mint_relic(&owner, &String::from_str(&e, "QmTarget"));
    let sacrifice_id = client.mint_relic(&owner, &String::from_str(&e, "QmSacrifice"));

    client.burn_to_repair(&owner, &target_id, &sacrifice_id);

    let meta = client.metadata(&target_id);
    assert_eq!(meta.repair_count, 1);
}

#[test]
#[should_panic(expected = "must own both NFTs")]
fn test_burn_to_repair_not_owner() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let oracle = Address::generate(&e);
    let dnd_token = Address::generate(&e);
    let owner1 = Address::generate(&e);
    let owner2 = Address::generate(&e);

    let client = create_registry(&e, &admin, &oracle, &dnd_token);

    let target_id = client.mint_relic(&owner1, &String::from_str(&e, "QmTarget"));
    let sacrifice_id = client.mint_relic(&owner2, &String::from_str(&e, "QmSacrifice"));

    // owner1 doesn't own sacrifice_id
    client.burn_to_repair(&owner1, &target_id, &sacrifice_id);
}

#[test]
fn test_multiple_mints_increment_id() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let oracle = Address::generate(&e);
    let dnd_token = Address::generate(&e);
    let user = Address::generate(&e);

    let client = create_registry(&e, &admin, &oracle, &dnd_token);

    let id1 = client.mint_relic(&user, &String::from_str(&e, "QmCID1"));
    let id2 = client.mint_relic(&user, &String::from_str(&e, "QmCID2"));
    let id3 = client.mint_relic(&user, &String::from_str(&e, "QmCID3"));

    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
    assert_eq!(id3, 3);
}

// ===================================================================
// Marketplace Tests (using Stellar Asset test token)
// ===================================================================

#[test]
fn test_list_and_delist() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let oracle = Address::generate(&e);
    let dnd_token = Address::generate(&e);
    let owner = Address::generate(&e);

    let client = create_registry(&e, &admin, &oracle, &dnd_token);

    let nft_id = client.mint_relic(&owner, &String::from_str(&e, "QmCID"));

    // List item
    client.list_item(&owner, &nft_id, &1000);
    let listing = client.get_listing(&nft_id);
    assert!(listing.is_some());
    assert_eq!(listing.unwrap().price, 1000);

    // Delist item
    client.delist_item(&owner, &nft_id);
    let listing = client.get_listing(&nft_id);
    assert!(listing.is_none());
}

#[test]
fn test_place_bid_with_escrow() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let oracle = Address::generate(&e);
    let owner = Address::generate(&e);
    let bidder = Address::generate(&e);

    // Create a real test token for DND
    let dnd_token = create_test_token(&e, &admin);
    let dnd_admin = StellarAssetClient::new(&e, &dnd_token);
    let dnd = TokenClient::new(&e, &dnd_token);

    let client = create_registry(&e, &admin, &oracle, &dnd_token);

    // Mint NFT
    let nft_id = client.mint_relic(&owner, &String::from_str(&e, "QmCID"));

    // Give bidder some DND
    dnd_admin.mint(&bidder, &5000);
    assert_eq!(dnd.balance(&bidder), 5000);

    // Place bid
    let bid_id = client.place_bid(&bidder, &nft_id, &3000);

    // Bidder's DND should decrease (escrowed)
    assert_eq!(dnd.balance(&bidder), 2000);

    // Contract should hold the escrowed DND
    assert_eq!(dnd.balance(&client.address), 3000);

    // Verify bid exists
    let bids = client.get_bids(&nft_id);
    assert_eq!(bids.len(), 1);
    assert_eq!(bids.get(0).unwrap(), bid_id);
}

#[test]
fn test_cancel_bid_refund() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let oracle = Address::generate(&e);
    let owner = Address::generate(&e);
    let bidder = Address::generate(&e);

    let dnd_token = create_test_token(&e, &admin);
    let dnd_admin = StellarAssetClient::new(&e, &dnd_token);
    let dnd = TokenClient::new(&e, &dnd_token);

    let client = create_registry(&e, &admin, &oracle, &dnd_token);
    let nft_id = client.mint_relic(&owner, &String::from_str(&e, "QmCID"));

    dnd_admin.mint(&bidder, &5000);
    let bid_id = client.place_bid(&bidder, &nft_id, &3000);

    // Cancel bid
    client.cancel_bid(&bidder, &bid_id);

    // DND should be refunded
    assert_eq!(dnd.balance(&bidder), 5000);
    assert_eq!(dnd.balance(&client.address), 0);
}

#[test]
fn test_accept_bid_trade() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let oracle = Address::generate(&e);
    let owner = Address::generate(&e);
    let bidder = Address::generate(&e);

    let dnd_token = create_test_token(&e, &admin);
    let dnd_admin = StellarAssetClient::new(&e, &dnd_token);
    let dnd = TokenClient::new(&e, &dnd_token);

    let client = create_registry(&e, &admin, &oracle, &dnd_token);
    let nft_id = client.mint_relic(&owner, &String::from_str(&e, "QmCID"));

    dnd_admin.mint(&bidder, &10000);
    let bid_id = client.place_bid(&bidder, &nft_id, &10000);

    // Owner accepts the bid
    client.accept_bid(&owner, &nft_id, &bid_id);

    // NFT should transfer to bidder
    assert_eq!(client.owner_of(&nft_id), bidder);

    // Seller should receive DND minus 3% fee
    // 10000 - 300 (3% fee) = 9700
    assert_eq!(dnd.balance(&owner), 9700);
}
