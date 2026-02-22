use soroban_sdk::{contracttype, Env};

pub(crate) const DAY_IN_LEDGERS: u32 = 17280;
pub(crate) const INSTANCE_BUMP_AMOUNT: u32 = 7 * DAY_IN_LEDGERS;
pub(crate) const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;
pub(crate) const BALANCE_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
pub(crate) const BALANCE_LIFETIME_THRESHOLD: u32 = BALANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Treasury,
    FeeConfig,
    Allowance(AllowanceDataKey),
    Balance(soroban_sdk::Address),
}

#[derive(Clone)]
#[contracttype]
pub struct AllowanceDataKey {
    pub from: soroban_sdk::Address,
    pub spender: soroban_sdk::Address,
}

#[derive(Clone)]
#[contracttype]
pub struct AllowanceValue {
    pub amount: i128,
    pub expiration_ledger: u32,
}

/// Fee configuration in basis points (1 bps = 0.01%)
#[derive(Clone)]
#[contracttype]
pub struct FeeConfig {
    pub burn_bps: u32,
    pub treasury_bps: u32,
}

impl FeeConfig {
    pub fn default(e: &Env) -> Self {
        let _ = e;
        FeeConfig {
            burn_bps: 200,    // 2%
            treasury_bps: 100, // 1%
        }
    }
}
