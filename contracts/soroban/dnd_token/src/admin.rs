use soroban_sdk::{Address, Env};

use crate::storage::DataKey;

#[allow(dead_code)]
pub fn has_administrator(e: &Env) -> bool {
    e.storage().instance().has(&DataKey::Admin)
}

pub fn read_administrator(e: &Env) -> Address {
    e.storage().instance().get(&DataKey::Admin).unwrap()
}

pub fn write_administrator(e: &Env, admin: &Address) {
    e.storage().instance().set(&DataKey::Admin, admin);
}
