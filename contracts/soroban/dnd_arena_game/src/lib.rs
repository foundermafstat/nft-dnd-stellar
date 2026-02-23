#![no_std]

//! # DnD Arena Game
//!
//! A game contract for the NFT-DND project where players interact with the Game Hub.
//! This contract is Game Hub-aware and ensures games are played through the 
//! Game Hub contract with points involvement.

use soroban_sdk::{
    Address, Bytes, BytesN, Env, IntoVal, contract, contractclient, contracterror, contractimpl,
    contracttype, vec
};

// ============================================================================
// RISC Zero Verifier Interface (Minimal)
// ============================================================================

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VerifierError {
    InvalidProof = 0,
    MalformedPublicInputs = 1,
    MalformedSeal = 2,
    InvalidSelector = 3,
    AlreadyInitialized = 4,
    SelectorRemoved = 5,
    SelectorInUse = 6,
    SelectorUnknown = 7,
}

#[contractclient(name = "RiscZeroVerifierRouterClient")]
pub trait RiscZeroVerifierRouterInterface {
    fn verify(
        env: Env,
        seal: Bytes,
        image_id: BytesN<32>,
        journal: BytesN<32>,
    ) -> Result<(), VerifierError>;
}

// ============================================================================
// Game Hub Interface
// ============================================================================

#[contractclient(name = "GameHubClient")]
pub trait GameHub {
    fn start_game(
        env: Env,
        game_id: Address,
        session_id: u32,
        player1: Address,
        player2: Address,
        player1_points: i128,
        player2_points: i128,
    );

    fn end_game(
        env: Env,
        session_id: u32,
        player1_won: bool
    );
}

// ============================================================================
// Errors
// ============================================================================

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    GameNotFound = 1,
    NotPlayer = 2,
    AlreadyCommitted = 3,
    BothPlayersNotCommitted = 4,
    GameAlreadyEnded = 5,
    ZkVerificationFailed = 6,
    BothPlayersZkNotVerified = 7,
}

// ============================================================================
// Data Types
// ============================================================================

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Game {
    pub player1: Address,
    pub player2: Address,
    pub player1_points: i128,
    pub player2_points: i128,
    pub player1_committed: bool,
    pub player2_committed: bool,
    pub player1_dice_verified: bool,
    pub player2_dice_verified: bool,
    pub player1_dice_val: u32,
    pub player2_dice_val: u32,
    pub winner: Option<Address>,
    pub loot_generated: bool,
    pub loot_amount_gold: u32,
    pub item_id: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Game(u32),
    GameHubAddress,
    ZkVerifierAddress,
    ZkImageId,
    Admin,
}

// ============================================================================
// Storage TTL Management
// ============================================================================

const GAME_TTL_LEDGERS: u32 = 518_400; // ~30 days

// ============================================================================
// Contract Definition
// ============================================================================

#[contract]
pub struct DndArenaGameContract;

#[contractimpl]
impl DndArenaGameContract {
    /// Initialize the contract with GameHub address and admin
    pub fn __constructor(env: Env, admin: Address, game_hub: Address, zk_verifier: Address, zk_image_id: BytesN<32>) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::GameHubAddress, &game_hub);
        env.storage()
            .instance()
            .set(&DataKey::ZkVerifierAddress, &zk_verifier);
        env.storage()
            .instance()
            .set(&DataKey::ZkImageId, &zk_image_id);
    }

    /// Start a new game between two players with points.
    /// This creates a session in the Game Hub and locks points before starting the game.
    pub fn start_game(
        env: Env,
        session_id: u32,
        player1: Address,
        player2: Address,
        player1_points: i128,
        player2_points: i128,
    ) -> Result<(), Error> {
        if player1 == player2 {
            panic!("Cannot play against yourself: Player 1 and Player 2 must be different addresses");
        }

        // Require authentication from both players
        player1.require_auth_for_args(vec![&env, session_id.into_val(&env), player1_points.into_val(&env)]);
        player2.require_auth_for_args(vec![&env, session_id.into_val(&env), player2_points.into_val(&env)]);

        // Get GameHub address
        let game_hub_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::GameHubAddress)
            .expect("GameHub address not set");

        // Create GameHub client
        let game_hub = GameHubClient::new(&env, &game_hub_addr);

        // Call the Game Hub to start the session and lock points
        game_hub.start_game(
            &env.current_contract_address(),
            &session_id,
            &player1,
            &player2,
            &player1_points,
            &player2_points,
        );

        let game = Game {
            player1: player1.clone(),
            player2: player2.clone(),
            player1_points,
            player2_points,
            player1_committed: false,
            player2_committed: false,
            player1_dice_verified: false,
            player2_dice_verified: false,
            player1_dice_val: 0,
            player2_dice_val: 0,
            winner: None,
            loot_generated: false,
            loot_amount_gold: 0,
            item_id: 0,
        };

        let game_key = DataKey::Game(session_id);
        env.storage().temporary().set(&game_key, &game);
        env.storage()
            .temporary()
            .extend_ttl(&game_key, GAME_TTL_LEDGERS, GAME_TTL_LEDGERS);

        Ok(())
    }

    /// Players commit to their action in the game.
    pub fn commit(env: Env, session_id: u32, player: Address) -> Result<(), Error> {
        player.require_auth();

        let key = DataKey::Game(session_id);
        let mut game: Game = env
            .storage()
            .temporary()
            .get(&key)
            .ok_or(Error::GameNotFound)?;

        if game.winner.is_some() {
            return Err(Error::GameAlreadyEnded);
        }

        if player == game.player1 {
            if game.player1_committed {
                return Err(Error::AlreadyCommitted);
            }
            game.player1_committed = true;
        } else if player == game.player2 {
            if game.player2_committed {
                return Err(Error::AlreadyCommitted);
            }
            game.player2_committed = true;
        } else {
            return Err(Error::NotPlayer);
        }

        env.storage().temporary().set(&key, &game);

        Ok(())
    }

    /// Verifies a ZK proof of a dice roll before a player can commit their action.
    /// The proof must be valid according to the configured RISC0 verifier.
    pub fn verify_dice_proof(env: Env, session_id: u32, player: Address, seal: Bytes, journal: BytesN<32>) -> Result<(), Error> {
        player.require_auth();

        let key = DataKey::Game(session_id);
        let mut game: Game = env
            .storage()
            .temporary()
            .get(&key)
            .ok_or(Error::GameNotFound)?;

        if game.winner.is_some() {
            return Err(Error::GameAlreadyEnded);
        }

        // 1. Get Verifier Info
        let zk_verifier_addr: Address = env.storage().instance().get(&DataKey::ZkVerifierAddress).unwrap();
        let zk_image_id: BytesN<32> = env.storage().instance().get(&DataKey::ZkImageId).unwrap();
        
        // 2. Call Verifier Router
        let verifier_client = RiscZeroVerifierRouterClient::new(&env, &zk_verifier_addr);
        
        // If verification fails, the cross-contract call will panic/revert.
        // If it succeeds, we know the journal is authentic.
        verifier_client.verify(&seal, &zk_image_id, &journal);

        // 3. Extract dice value from journal
        // Assuming the journal encodes a single u32 dice roll in the first 4 bytes (Big Endian)
        let journal_bytes = journal.to_array();
        let mut val_bytes = [0u8; 4];
        val_bytes.copy_from_slice(&journal_bytes[0..4]);
        let dice_val = u32::from_be_bytes(val_bytes);

        // 4. Update Game State
        if player == game.player1 {
            game.player1_dice_verified = true;
            game.player1_dice_val = dice_val;
        } else if player == game.player2 {
            game.player2_dice_verified = true;
            game.player2_dice_val = dice_val;
        } else {
            return Err(Error::NotPlayer);
        }

        env.storage().temporary().set(&key, &game);
        Ok(())
    }

    /// Resolve the game and notify the GameHub.
    /// Utilizes the ZK-verified dice rolls to determine the winner.
    /// Generates randomized loot for the winner if they haven't received it yet.
    pub fn resolve_game(env: Env, session_id: u32) -> Result<Address, Error> {
        let key = DataKey::Game(session_id);
        let mut game: Game = env
            .storage()
            .temporary()
            .get(&key)
            .ok_or(Error::GameNotFound)?;

        if let Some(winner) = &game.winner {
            return Ok(winner.clone());
        }

        if !game.player1_committed || !game.player2_committed {
            return Err(Error::BothPlayersNotCommitted);
        }

        // Ensure both players provided valid ZK proofs
        if !game.player1_dice_verified || !game.player2_dice_verified {
            return Err(Error::BothPlayersZkNotVerified);
        }

        // Determine winner based on verified dice rolls (Tie goes to Player 1)
        let winner = if game.player1_dice_val >= game.player2_dice_val {
            game.player1.clone()
        } else {
            game.player2.clone()
        };

        game.winner = Some(winner.clone());

        // Generate Loot if not already generated
        if !game.loot_generated {
            // Seed PRNG using session ID and ZK-verified values to ensure fairness
            let mut seed_bytes = Bytes::new(&env);
            seed_bytes.append(&Bytes::from_array(&env, &session_id.to_be_bytes()));
            seed_bytes.append(&Bytes::from_array(&env, &game.player1_dice_val.to_be_bytes()));
            seed_bytes.append(&Bytes::from_array(&env, &game.player2_dice_val.to_be_bytes()));
            
            let seed = env.crypto().keccak256(&seed_bytes);
            env.prng().seed(seed.into());
            
            // Random gold amount 10-100
            game.loot_amount_gold = env.prng().gen_range::<u64>(10..=100) as u32;
            
            // Random item drop ID (assumes item registry 1 to 500)
            game.item_id = env.prng().gen_range::<u64>(1..=500) as u32;
            
            game.loot_generated = true;
        }

        env.storage().temporary().set(&key, &game);

        let game_hub_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::GameHubAddress)
            .expect("GameHub address not set");

        let game_hub = GameHubClient::new(&env, &game_hub_addr);
        let player1_won = winner == game.player1;
        
        // Send outcome to Game Hub
        game_hub.end_game(&session_id, &player1_won);

        Ok(winner)
    }

    pub fn get_game(env: Env, session_id: u32) -> Result<Game, Error> {
        let key = DataKey::Game(session_id);
        env.storage()
            .temporary()
            .get(&key)
            .ok_or(Error::GameNotFound)
    }

    // ========================================================================
    // Admin Functions
    // ========================================================================

    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set")
    }

    pub fn set_admin(env: Env, new_admin: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &new_admin);
    }

    pub fn get_hub(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::GameHubAddress)
            .expect("GameHub address not set")
    }

    pub fn set_hub(env: Env, new_hub: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();
        env.storage()
            .instance()
            .set(&DataKey::GameHubAddress, &new_hub);
    }

    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }
}
