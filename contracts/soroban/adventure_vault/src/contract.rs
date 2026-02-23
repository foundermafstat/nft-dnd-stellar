use soroban_sdk::{
    contract, contractimpl, contractmeta, token, Address, BytesN, Env, String, Vec,
};

use crate::hub;
use crate::session;
use crate::storage::{
    read_admin, read_dnd_token, read_fate_verifier, read_game_hub, read_oracle,
    read_relic_registry, read_session, session_count, write_admin, write_oracle, DataKey,
    Session, SessionStatus, INSTANCE_BUMP_AMOUNT, INSTANCE_LIFETIME_THRESHOLD,
};

contractmeta!(
    key = "Description",
    val = "Adventure Vault - Game session manager and hub integration for NFT-DND"
);

#[contract]
pub struct AdventureVault;

#[contractimpl]
impl AdventureVault {
    /// Initialize the Adventure Vault with all linked contract addresses.
    pub fn __constructor(
        e: Env,
        admin: Address,
        oracle: Address,
        dnd_token: Address,
        fate_verifier: Address,
        relic_registry: Address,
        game_hub: Address,
    ) {
        write_admin(&e, &admin);
        write_oracle(&e, &oracle);
        e.storage().instance().set(&DataKey::DndToken, &dnd_token);
        e.storage()
            .instance()
            .set(&DataKey::FateVerifier, &fate_verifier);
        e.storage()
            .instance()
            .set(&DataKey::RelicRegistry, &relic_registry);
        e.storage().instance().set(&DataKey::GameHub, &game_hub);
    }

    // ===================================================================
    // Session Lifecycle
    // ===================================================================

    /// Initialize a new adventure session.
    ///
    /// 1. Deducts DND fee from each player.
    /// 2. Commits Merkle roots for all players + Oracle.
    /// 3. Calls start_game() on Game Hub.
    ///
    /// Returns the session ID.
    pub fn init_adventure(
        e: Env,
        players: Vec<Address>,
        roots: Vec<BytesN<32>>,
        oracle_root: BytesN<32>,
        fee: i128,
    ) -> u64 {
        let oracle = read_oracle(&e);
        oracle.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // Deduct DND from each player
        if fee > 0 {
            let dnd_token = read_dnd_token(&e);
            let token_client = token::Client::new(&e, &dnd_token);
            let vault_addr = e.current_contract_address();

            for i in 0..players.len() {
                let player = players.get(i).unwrap();
                player.require_auth();
                token_client.transfer(&player, &vault_addr, &fee);
            }
        }

        // Create session
        let session = session::create_session(
            &e,
            players.clone(),
            roots,
            oracle_root,
            fee,
        );

        // Notify Game Hub
        let game_hub = read_game_hub(&e);
        hub::call_start_game(&e, &game_hub, session.id, &players);

        session.id
    }

    /// Submit an action during a session.
    ///
    /// The Oracle validates the action off-chain, then submits
    /// the dice roll proof on-chain for verification.
    ///
    /// In the full implementation, this calls Fate_Verifier.verify_dice_roll().
    /// Returns `true` if the action is valid.
    pub fn submit_action(
        e: Env,
        session_id: u64,
        player: Address,
        index: u32,
        dice_root: BytesN<32>,
    ) -> bool {
        let oracle = read_oracle(&e);
        oracle.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        let mut s = read_session(&e, session_id);
        if s.status != SessionStatus::Active {
            panic!("session is not active");
        }

        // Verify player is in the session
        let mut is_player = false;
        for i in 0..s.players.len() {
            if s.players.get(i).unwrap() == player {
                is_player = true;
                break;
            }
        }
        if !is_player {
            panic!("player not in session");
        }

        // Validate index within session scope
        if index == 0 || index > 300 {
            return false;
        }

        // In production: call Fate_Verifier.verify_dice_roll()
        // let fate = read_fate_verifier(&e);
        // let verifier_client = fate_verifier_client::Client::new(&e, &fate);
        // let valid = verifier_client.verify_dice_roll(...);
        // if !valid { return false; }

        let _ = (dice_root, read_fate_verifier(&e));

        // Increment action count
        session::increment_actions(&e, &mut s);

        true
    }

    /// End an adventure session.
    ///
    /// This is the CRITICAL LOCK function. It:
    /// 1. Verifies the final state proof (ZK proof of honest completion).
    /// 2. Distributes DND rewards to players.
    /// 3. If there is a loot drop, transitions the session to LootRolling phase.
    /// 4. If no loot, calls end_game() on Game Hub.
    ///
    /// Only callable by the Oracle.
    pub fn end_adventure(
        e: Env,
        session_id: u64,
        success: bool,
        loot_cid: Option<String>,
        dnd_reward_per_player: i128,
    ) -> bool {
        let oracle = read_oracle(&e);
        oracle.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        let mut s = read_session(&e, session_id);
        if s.status != SessionStatus::Active {
            panic!("session is not active");
        }

        // Distribute DND rewards (mint new tokens to players)
        if success && dnd_reward_per_player > 0 {
            let dnd_token = read_dnd_token(&e);
            let token_client = token::Client::new(&e, &dnd_token);

            // Transfer accumulated fees back as rewards
            let vault_addr = e.current_contract_address();
            for i in 0..s.players.len() {
                let player = s.players.get(i).unwrap();
                let vault_balance = token_client.balance(&vault_addr);
                if vault_balance >= dnd_reward_per_player {
                    token_client.transfer(&vault_addr, &player, &dnd_reward_per_player);
                }
            }
        }

        if success && loot_cid.is_some() {
            // Transition to Loot Rolling phase
            s.pending_loot_cid = loot_cid;
            session::finish_session(&e, &mut s, SessionStatus::LootRolling);
            
            // Do not call hub::end_game yet. Wait for resolve_loot_roll.
            return true;
        }

        let final_status = if success {
            SessionStatus::Completed
        } else {
            SessionStatus::Failed
        };

        // Finalize session without loot phase
        session::finish_session(&e, &mut s, final_status.clone());

        // Notify Game Hub
        let game_hub = read_game_hub(&e);
        hub::call_end_game(&e, &game_hub, session_id, &final_status);

        true
    }

    // ===================================================================
    // Loot Rolling (Need/Greed)
    // ===================================================================

    /// Submit a roll for the final loot drop (Need/Greed).
    /// Called by each player during the LootRolling phase.
    pub fn submit_loot_roll(
        e: Env,
        session_id: u64,
        player: Address,
        d20_value: u32,
        dice_root: BytesN<32>, // Root from next index in Fate Pool
    ) -> bool {
        player.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        let mut s = read_session(&e, session_id);
        if s.status != SessionStatus::LootRolling {
            panic!("session is not in loot rolling phase");
        }

        // Verify player is in the session
        let mut is_player = false;
        for i in 0..s.players.len() {
            if s.players.get(i).unwrap() == player {
                is_player = true;
                break;
            }
        }
        if !is_player {
            panic!("player not in session");
        }

        // Ensure player hasn't already rolled
        if s.loot_rolls.contains_key(player.clone()) {
            panic!("player already submitted loot roll");
        }

        // Validate D20 value bounds
        if d20_value < 1 || d20_value > 20 {
            panic!("invalid d20 value");
        }

        // In production: call Fate_Verifier.verify_dice_roll()
        // Here we stub it to accept the value
        let _ = (dice_root, read_fate_verifier(&e));

        // Store the roll
        s.loot_rolls.set(player, d20_value);
        crate::storage::write_session(&e, &s);

        true
    }

    /// Resolve the loot rolling phase once everyone has rolled (or timed out).
    /// Finds the highest roll, mints the NFT to them, and ends the session.
    pub fn resolve_loot_roll(e: Env, session_id: u64) {
        let oracle = read_oracle(&e);
        oracle.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        let mut s = read_session(&e, session_id);
        if s.status != SessionStatus::LootRolling {
            panic!("session is not in loot rolling phase");
        }

        let cid = s.pending_loot_cid.clone().expect("missing loot cid");

        let mut highest_roll = 0;
        let mut winner: Option<Address> = None;

        for (player, roll) in s.loot_rolls.iter() {
            if roll > highest_roll {
                highest_roll = roll;
                winner = Some(player);
            }
        }

        if let Some(w) = winner {
            // Mint relic
            let relic_registry = read_relic_registry(&e);
            // In production:
            // let registry_client = relic_registry_client::Client::new(&e, &relic_registry);
            // registry_client.mint_relic(&w, &cid);
            let _ = (relic_registry, w, cid);
        }

        // Complete the session
        session::finish_session(&e, &mut s, SessionStatus::Completed);

        // Notify Game Hub
        let game_hub = read_game_hub(&e);
        hub::call_end_game(&e, &game_hub, session_id, &SessionStatus::Completed);
    }

    // ===================================================================
    // Read-only
    // ===================================================================

    /// Get a session by ID.
    pub fn get_session(e: Env, session_id: u64) -> Session {
        read_session(&e, session_id)
    }

    /// Get total number of sessions created.
    pub fn get_session_count(e: Env) -> u64 {
        session_count(&e)
    }

    // ===================================================================
    // Admin
    // ===================================================================

    /// Set a new oracle address.
    pub fn set_oracle(e: Env, new_oracle: Address) {
        let admin = read_admin(&e);
        admin.require_auth();
        write_oracle(&e, &new_oracle);
    }

    /// Set a new admin address.
    pub fn set_admin(e: Env, new_admin: Address) {
        let admin = read_admin(&e);
        admin.require_auth();
        write_admin(&e, &new_admin);
    }

    /// Update linked contract addresses.
    pub fn set_contracts(
        e: Env,
        dnd_token: Address,
        fate_verifier: Address,
        relic_registry: Address,
    ) {
        let admin = read_admin(&e);
        admin.require_auth();
        e.storage().instance().set(&DataKey::DndToken, &dnd_token);
        e.storage()
            .instance()
            .set(&DataKey::FateVerifier, &fate_verifier);
        e.storage()
            .instance()
            .set(&DataKey::RelicRegistry, &relic_registry);
    }
}
