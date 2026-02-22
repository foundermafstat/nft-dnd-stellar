use soroban_sdk::{contracttype, Env};

use crate::types::{VerificationKey, VkType};

pub(crate) const DAY_IN_LEDGERS: u32 = 17280;
pub(crate) const INSTANCE_BUMP_AMOUNT: u32 = 7 * DAY_IN_LEDGERS;
pub(crate) const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    DiceVk,
    FogVk,
}

pub fn read_admin(e: &Env) -> soroban_sdk::Address {
    e.storage().instance().get(&DataKey::Admin).unwrap()
}

pub fn write_admin(e: &Env, admin: &soroban_sdk::Address) {
    e.storage().instance().set(&DataKey::Admin, admin);
}

pub fn read_vk(e: &Env, vk_type: VkType) -> Option<VerificationKey> {
    let key = match vk_type {
        VkType::Dice => DataKey::DiceVk,
        VkType::FogOfWar => DataKey::FogVk,
    };
    e.storage().instance().get(&key)
}

pub fn write_vk(e: &Env, vk_type: VkType, vk: &VerificationKey) {
    let key = match vk_type {
        VkType::Dice => DataKey::DiceVk,
        VkType::FogOfWar => DataKey::FogVk,
    };
    e.storage().instance().set(&key, vk);
}
