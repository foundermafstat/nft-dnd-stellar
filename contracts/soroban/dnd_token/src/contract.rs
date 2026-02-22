use crate::admin::{read_administrator, write_administrator};
use crate::allowance::{read_allowance, spend_allowance, write_allowance};
use crate::balance::{read_balance, receive_balance, spend_balance};
use crate::metadata::{read_decimal, read_name, read_symbol, write_metadata};
use crate::storage::{DataKey, FeeConfig, INSTANCE_BUMP_AMOUNT, INSTANCE_LIFETIME_THRESHOLD};

use soroban_sdk::{
    contract, contractimpl, contractmeta, token::TokenInterface, Address, Env, String,
};
use soroban_token_sdk::metadata::TokenMetadata;
use soroban_token_sdk::TokenUtils;

contractmeta!(key = "Description", val = "DND Token - SEP-41 game currency for NFT-DND");

fn check_nonnegative_amount(amount: i128) {
    if amount < 0 {
        panic!("negative amount is not allowed: {}", amount)
    }
}

#[contract]
pub struct DndToken;

#[contractimpl]
impl DndToken {
    /// Initialize the DND Token contract.
    pub fn __constructor(e: Env, admin: Address, treasury: Address) {
        let decimal: u32 = 7;
        let name = String::from_str(&e, "DND Token");
        let symbol = String::from_str(&e, "DND");

        write_administrator(&e, &admin);
        write_metadata(
            &e,
            &TokenMetadata {
                decimal,
                name,
                symbol,
            },
        );

        // Store treasury address
        e.storage().instance().set(&DataKey::Treasury, &treasury);

        // Store default fee config (2% burn, 1% treasury)
        let fee_config = FeeConfig::default(&e);
        e.storage().instance().set(&DataKey::FeeConfig, &fee_config);
    }

    // ===================================================================
    // Admin Functions
    // ===================================================================

    /// Mint tokens — only callable by admin (Adventure_Vault contract or deployer).
    pub fn mint(e: Env, to: Address, amount: i128) {
        check_nonnegative_amount(amount);
        let admin = read_administrator(&e);
        admin.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        receive_balance(&e, to.clone(), amount);
        TokenUtils::new(&e).events().mint(admin, to, amount);
    }

    /// Set a new admin address.
    pub fn set_admin(e: Env, new_admin: Address) {
        let admin = read_administrator(&e);
        admin.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        write_administrator(&e, &new_admin);
    }

    /// Set the treasury address for fee collection.
    pub fn set_treasury(e: Env, new_treasury: Address) {
        let admin = read_administrator(&e);
        admin.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        e.storage()
            .instance()
            .set(&DataKey::Treasury, &new_treasury);
    }

    /// Update marketplace fee configuration (in basis points).
    /// burn_bps + treasury_bps should not exceed 10000 (100%).
    pub fn set_fee_config(e: Env, burn_bps: u32, treasury_bps: u32) {
        let admin = read_administrator(&e);
        admin.require_auth();

        if burn_bps + treasury_bps > 10000 {
            panic!("total fee exceeds 100%");
        }

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        let config = FeeConfig {
            burn_bps,
            treasury_bps,
        };
        e.storage().instance().set(&DataKey::FeeConfig, &config);
    }

    // ===================================================================
    // Game-Specific Functions
    // ===================================================================

    /// Burn tokens for penance — removes in-game debuffs (magic restoration).
    /// The user authorizes and their tokens are permanently burned.
    /// Returns the amount burned.
    pub fn burn_for_penance(e: Env, user: Address, amount: i128) -> i128 {
        check_nonnegative_amount(amount);
        user.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        spend_balance(&e, user.clone(), amount);
        TokenUtils::new(&e).events().burn(user, amount);
        amount
    }

    /// Called by Relic_Registry during trades. Splits the fee into a burned
    /// portion and a treasury portion.
    /// Returns (burned_amount, treasury_amount).
    pub fn pay_marketplace_fee(e: Env, from: Address, total_amount: i128) -> (i128, i128) {
        check_nonnegative_amount(total_amount);

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        let config: FeeConfig = e
            .storage()
            .instance()
            .get(&DataKey::FeeConfig)
            .unwrap_or(FeeConfig::default(&e));

        let treasury: Address = e
            .storage()
            .instance()
            .get(&DataKey::Treasury)
            .unwrap();

        // Calculate fee amounts
        let burn_amount = (total_amount * config.burn_bps as i128) / 10000;
        let treasury_amount = (total_amount * config.treasury_bps as i128) / 10000;

        // Burn portion
        if burn_amount > 0 {
            spend_balance(&e, from.clone(), burn_amount);
            TokenUtils::new(&e).events().burn(from.clone(), burn_amount);
        }

        // Treasury portion
        if treasury_amount > 0 {
            spend_balance(&e, from.clone(), treasury_amount);
            receive_balance(&e, treasury.clone(), treasury_amount);
            TokenUtils::new(&e)
                .events()
                .transfer(from, treasury, treasury_amount);
        }

        (burn_amount, treasury_amount)
    }

    // ===================================================================
    // Read-only helpers
    // ===================================================================

    /// Get the treasury address.
    pub fn treasury(e: Env) -> Address {
        e.storage()
            .instance()
            .get(&DataKey::Treasury)
            .unwrap()
    }

    /// Get the current fee configuration.
    pub fn fee_config(e: Env) -> FeeConfig {
        e.storage()
            .instance()
            .get(&DataKey::FeeConfig)
            .unwrap_or(FeeConfig::default(&e))
    }
}

// ===========================================================================
// SEP-41 Token Interface Implementation
// ===========================================================================

#[contractimpl]
impl TokenInterface for DndToken {
    fn allowance(e: Env, from: Address, spender: Address) -> i128 {
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        read_allowance(&e, from, spender).amount
    }

    fn approve(e: Env, from: Address, spender: Address, amount: i128, expiration_ledger: u32) {
        from.require_auth();
        check_nonnegative_amount(amount);

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        write_allowance(&e, from.clone(), spender.clone(), amount, expiration_ledger);
        TokenUtils::new(&e)
            .events()
            .approve(from, spender, amount, expiration_ledger);
    }

    fn balance(e: Env, id: Address) -> i128 {
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        read_balance(&e, id)
    }

    fn transfer(e: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        check_nonnegative_amount(amount);

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        spend_balance(&e, from.clone(), amount);
        receive_balance(&e, to.clone(), amount);
        TokenUtils::new(&e).events().transfer(from, to, amount);
    }

    fn transfer_from(e: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();
        check_nonnegative_amount(amount);

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        spend_allowance(&e, from.clone(), spender, amount);
        spend_balance(&e, from.clone(), amount);
        receive_balance(&e, to.clone(), amount);
        TokenUtils::new(&e).events().transfer(from, to, amount);
    }

    fn burn(e: Env, from: Address, amount: i128) {
        from.require_auth();
        check_nonnegative_amount(amount);

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        spend_balance(&e, from.clone(), amount);
        TokenUtils::new(&e).events().burn(from, amount);
    }

    fn burn_from(e: Env, spender: Address, from: Address, amount: i128) {
        spender.require_auth();
        check_nonnegative_amount(amount);

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        spend_allowance(&e, from.clone(), spender, amount);
        spend_balance(&e, from.clone(), amount);
        TokenUtils::new(&e).events().burn(from, amount);
    }

    fn decimals(e: Env) -> u32 {
        read_decimal(&e)
    }

    fn name(e: Env) -> String {
        read_name(&e)
    }

    fn symbol(e: Env) -> String {
        read_symbol(&e)
    }
}
