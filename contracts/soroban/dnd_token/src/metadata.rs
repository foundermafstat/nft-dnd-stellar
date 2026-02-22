use soroban_sdk::Env;
use soroban_token_sdk::metadata::TokenMetadata;
use soroban_token_sdk::TokenUtils;

pub fn read_decimal(e: &Env) -> u32 {
    TokenUtils::new(e).metadata().get_metadata().decimal
}

pub fn read_name(e: &Env) -> soroban_sdk::String {
    TokenUtils::new(e).metadata().get_metadata().name
}

pub fn read_symbol(e: &Env) -> soroban_sdk::String {
    TokenUtils::new(e).metadata().get_metadata().symbol
}

pub fn write_metadata(e: &Env, metadata: &TokenMetadata) {
    TokenUtils::new(e).metadata().set_metadata(metadata);
}
