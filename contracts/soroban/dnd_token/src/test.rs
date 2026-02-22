#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::contract::{DndToken, DndTokenClient};

fn create_token<'a>(e: &Env, admin: &Address, treasury: &Address) -> DndTokenClient<'a> {
    let contract_id = e.register(DndToken, (admin, treasury));
    DndTokenClient::new(e, &contract_id)
}

#[test]
fn test_mint_and_balance() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let treasury = Address::generate(&e);
    let user = Address::generate(&e);

    let client = create_token(&e, &admin, &treasury);

    client.mint(&user, &1_000_000_0000000);
    assert_eq!(client.balance(&user), 1_000_000_0000000);
}

#[test]
fn test_transfer() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let treasury = Address::generate(&e);
    let user1 = Address::generate(&e);
    let user2 = Address::generate(&e);

    let client = create_token(&e, &admin, &treasury);

    client.mint(&user1, &1000);
    client.transfer(&user1, &user2, &400);

    assert_eq!(client.balance(&user1), 600);
    assert_eq!(client.balance(&user2), 400);
}

#[test]
fn test_burn_for_penance() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let treasury = Address::generate(&e);
    let user = Address::generate(&e);

    let client = create_token(&e, &admin, &treasury);

    client.mint(&user, &1000);
    let burned = client.burn_for_penance(&user, &300);

    assert_eq!(burned, 300);
    assert_eq!(client.balance(&user), 700);
}

#[test]
fn test_marketplace_fee_split() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let treasury = Address::generate(&e);
    let seller = Address::generate(&e);

    let client = create_token(&e, &admin, &treasury);

    // Mint 10000 to seller (simulating a trade amount)
    client.mint(&seller, &10000);

    // pay_marketplace_fee with default config: 2% burn, 1% treasury
    let (burned, treasury_received) = client.pay_marketplace_fee(&seller, &10000);

    // 2% of 10000 = 200 burned
    assert_eq!(burned, 200);
    // 1% of 10000 = 100 to treasury
    assert_eq!(treasury_received, 100);
    // Seller should have 10000 - 200 - 100 = 9700
    assert_eq!(client.balance(&seller), 9700);
    // Treasury should have 100
    assert_eq!(client.balance(&treasury), 100);
}

#[test]
fn test_set_fee_config() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let treasury = Address::generate(&e);
    let user = Address::generate(&e);

    let client = create_token(&e, &admin, &treasury);

    // Change fee to 5% burn, 2% treasury
    client.set_fee_config(&500, &200);

    client.mint(&user, &10000);
    let (burned, treasury_received) = client.pay_marketplace_fee(&user, &10000);

    assert_eq!(burned, 500);
    assert_eq!(treasury_received, 200);
    assert_eq!(client.balance(&user), 9300);
}

#[test]
fn test_token_metadata() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let treasury = Address::generate(&e);

    let client = create_token(&e, &admin, &treasury);

    assert_eq!(client.decimals(), 7);
    assert_eq!(client.symbol(), soroban_sdk::String::from_str(&e, "DND"));
    assert_eq!(client.name(), soroban_sdk::String::from_str(&e, "DND Token"));
}

#[test]
#[should_panic(expected = "insufficient balance")]
fn test_transfer_insufficient_balance() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let treasury = Address::generate(&e);
    let user1 = Address::generate(&e);
    let user2 = Address::generate(&e);

    let client = create_token(&e, &admin, &treasury);

    client.mint(&user1, &100);
    client.transfer(&user1, &user2, &200); // Should panic
}

#[test]
fn test_approve_and_transfer_from() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let treasury = Address::generate(&e);
    let owner = Address::generate(&e);
    let spender = Address::generate(&e);
    let recipient = Address::generate(&e);

    let client = create_token(&e, &admin, &treasury);

    client.mint(&owner, &1000);
    client.approve(&owner, &spender, &500, &1000);

    assert_eq!(client.allowance(&owner, &spender), 500);

    client.transfer_from(&spender, &owner, &recipient, &300);

    assert_eq!(client.balance(&owner), 700);
    assert_eq!(client.balance(&recipient), 300);
    assert_eq!(client.allowance(&owner, &spender), 200);
}
