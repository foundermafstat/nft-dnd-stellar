#![cfg(test)]

use soroban_sdk::{testutils::Address as _, vec, Address, BytesN, Env, String, Vec};

use soroban_sdk::token::{StellarAssetClient, TokenClient};

use crate::contract::{AdventureVault, AdventureVaultClient};
use crate::storage::SessionStatus;

fn create_test_token(e: &Env, admin: &Address) -> Address {
    e.register_stellar_asset_contract_v2(admin.clone())
        .address()
        .clone()
}

fn create_vault<'a>(
    e: &Env,
    admin: &Address,
    oracle: &Address,
    dnd_token: &Address,
) -> AdventureVaultClient<'a> {
    let fate_verifier = Address::generate(e);
    let relic_registry = Address::generate(e);
    let game_hub = Address::generate(e);

    let contract_id = e.register(
        AdventureVault,
        (admin, oracle, dnd_token, &fate_verifier, &relic_registry, &game_hub),
    );
    AdventureVaultClient::new(e, &contract_id)
}

fn dummy_root(e: &Env) -> BytesN<32> {
    BytesN::from_array(e, &[1u8; 32])
}

#[test]
fn test_init_adventure() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let oracle = Address::generate(&e);

    let dnd_token = create_test_token(&e, &admin);
    let dnd_admin = StellarAssetClient::new(&e, &dnd_token);
    let dnd = TokenClient::new(&e, &dnd_token);

    let client = create_vault(&e, &admin, &oracle, &dnd_token);

    let player1 = Address::generate(&e);
    let player2 = Address::generate(&e);

    // Give players DND
    dnd_admin.mint(&player1, &1000);
    dnd_admin.mint(&player2, &1000);

    let players = vec![&e, player1.clone(), player2.clone()];
    let roots = vec![&e, dummy_root(&e), dummy_root(&e)];
    let oracle_root = dummy_root(&e);

    let session_id = client.init_adventure(&players, &roots, &oracle_root, &100);

    // Session should exist
    assert_eq!(session_id, 1);

    let session = client.get_session(&session_id);
    assert_eq!(session.players.len(), 2);
    assert_eq!(session.status, SessionStatus::Active);
    assert_eq!(session.fee_per_player, 100);

    // DND should be deducted
    assert_eq!(dnd.balance(&player1), 900);
    assert_eq!(dnd.balance(&player2), 900);

    // Vault should hold the fees
    assert_eq!(dnd.balance(&client.address), 200);
}

#[test]
fn test_submit_action() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let oracle = Address::generate(&e);
    let dnd_token = create_test_token(&e, &admin);

    let client = create_vault(&e, &admin, &oracle, &dnd_token);

    let player = Address::generate(&e);
    let players = vec![&e, player.clone()];
    let roots = vec![&e, dummy_root(&e)];

    let session_id = client.init_adventure(&players, &roots, &dummy_root(&e), &0);

    // Submit an action
    let result = client.submit_action(&session_id, &player, &1, &dummy_root(&e));
    assert!(result);

    // Check action count incremented
    let session = client.get_session(&session_id);
    assert_eq!(session.action_count, 1);
}

#[test]
#[should_panic(expected = "player not in session")]
fn test_submit_action_wrong_player() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let oracle = Address::generate(&e);
    let dnd_token = create_test_token(&e, &admin);

    let client = create_vault(&e, &admin, &oracle, &dnd_token);

    let player = Address::generate(&e);
    let outsider = Address::generate(&e);
    let players = vec![&e, player.clone()];
    let roots = vec![&e, dummy_root(&e)];

    let session_id = client.init_adventure(&players, &roots, &dummy_root(&e), &0);

    // Outsider should not be able to submit
    client.submit_action(&session_id, &outsider, &1, &dummy_root(&e));
}

#[test]
fn test_end_adventure_success() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let oracle = Address::generate(&e);

    let dnd_token = create_test_token(&e, &admin);
    let dnd_admin = StellarAssetClient::new(&e, &dnd_token);
    let dnd = TokenClient::new(&e, &dnd_token);

    let client = create_vault(&e, &admin, &oracle, &dnd_token);

    let player = Address::generate(&e);
    dnd_admin.mint(&player, &500);

    let players = vec![&e, player.clone()];
    let roots = vec![&e, dummy_root(&e)];

    let session_id = client.init_adventure(&players, &roots, &dummy_root(&e), &200);

    // Vault has 200 DND
    assert_eq!(dnd.balance(&client.address), 200);

    // End adventure successfully, reward 150 per player
    let loot_cid: Option<String> = None;
    let result = client.end_adventure(&session_id, &true, &loot_cid, &150);
    assert!(result);

    // Session should be completed
    let session = client.get_session(&session_id);
    assert_eq!(session.status, SessionStatus::Completed);

    // Player should receive 150 DND back (from vault's pool)
    // Started with 500, paid 200, received 150 back = 450
    assert_eq!(dnd.balance(&player), 450);
    assert_eq!(dnd.balance(&client.address), 50); // 200 - 150 = 50 remaining
}

#[test]
fn test_end_adventure_failure() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let oracle = Address::generate(&e);
    let dnd_token = create_test_token(&e, &admin);

    let client = create_vault(&e, &admin, &oracle, &dnd_token);

    let player = Address::generate(&e);
    let players = vec![&e, player.clone()];
    let roots = vec![&e, dummy_root(&e)];

    let session_id = client.init_adventure(&players, &roots, &dummy_root(&e), &0);

    // End as failure — no rewards
    let loot_cid: Option<String> = None;
    client.end_adventure(&session_id, &false, &loot_cid, &0);

    let session = client.get_session(&session_id);
    assert_eq!(session.status, SessionStatus::Failed);
}

#[test]
#[should_panic(expected = "session is not active")]
fn test_cannot_end_twice() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let oracle = Address::generate(&e);
    let dnd_token = create_test_token(&e, &admin);

    let client = create_vault(&e, &admin, &oracle, &dnd_token);

    let player = Address::generate(&e);
    let players = vec![&e, player.clone()];
    let roots = vec![&e, dummy_root(&e)];

    let session_id = client.init_adventure(&players, &roots, &dummy_root(&e), &0);

    let loot_cid: Option<String> = None;
    client.end_adventure(&session_id, &true, &loot_cid, &0);
    client.end_adventure(&session_id, &true, &loot_cid, &0); // Should panic
}

#[test]
fn test_loot_rolling_flow() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let oracle = Address::generate(&e);
    let dnd_token = create_test_token(&e, &admin);

    let client = create_vault(&e, &admin, &oracle, &dnd_token);

    let player1 = Address::generate(&e);
    let player2 = Address::generate(&e);
    let players = vec![&e, player1.clone(), player2.clone()];
    let roots = vec![&e, dummy_root(&e), dummy_root(&e)];

    let session_id = client.init_adventure(&players, &roots, &dummy_root(&e), &0);

    // End adventure successfully with a loot dropped
    let loot_cid = Some(String::from_str(&e, "ipfs://QmLoot123"));
    client.end_adventure(&session_id, &true, &loot_cid, &0);

    // Status should be LootRolling
    let session = client.get_session(&session_id);
    assert_eq!(session.status, SessionStatus::LootRolling);

    // Players submit rolls
    client.submit_loot_roll(&session_id, &player1, &15, &dummy_root(&e));
    client.submit_loot_roll(&session_id, &player2, &20, &dummy_root(&e));

    // Oracle resolves it
    client.resolve_loot_roll(&session_id);

    // Final status -> Completed
    let final_session = client.get_session(&session_id);
    assert_eq!(final_session.status, SessionStatus::Completed);
}

#[test]
fn test_session_count() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::generate(&e);
    let oracle = Address::generate(&e);
    let dnd_token = create_test_token(&e, &admin);

    let client = create_vault(&e, &admin, &oracle, &dnd_token);

    assert_eq!(client.get_session_count(), 0);

    let player = Address::generate(&e);
    let players = vec![&e, player.clone()];
    let roots = vec![&e, dummy_root(&e)];

    client.init_adventure(&players, &roots, &dummy_root(&e), &0);
    assert_eq!(client.get_session_count(), 1);

    client.init_adventure(&players, &roots, &dummy_root(&e), &0);
    assert_eq!(client.get_session_count(), 2);
}
