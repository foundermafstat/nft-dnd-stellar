use soroban_sdk::{contract, contractimpl, contractmeta, token, Address, Env, String, Vec};

use crate::marketplace;
use crate::nft;
use crate::storage::{
    read_admin, read_dnd_token, read_oracle, write_admin, write_dnd_token, write_oracle, Bid,
    Listing, RelicMetadata, INSTANCE_BUMP_AMOUNT, INSTANCE_LIFETIME_THRESHOLD,
};

contractmeta!(
    key = "Description",
    val = "Relic Registry - NFT items and decentralized marketplace for NFT-DND"
);

#[contract]
pub struct RelicRegistry;

#[contractimpl]
impl RelicRegistry {
    /// Initialize the Relic Registry.
    pub fn __constructor(e: Env, admin: Address, oracle: Address, dnd_token: Address) {
        write_admin(&e, &admin);
        write_oracle(&e, &oracle);
        write_dnd_token(&e, &dnd_token);
    }

    // ===================================================================
    // NFT Functions
    // ===================================================================

    /// Mint a new relic NFT. Only callable by the Oracle.
    /// Returns the new NFT ID.
    pub fn mint_relic(e: Env, winner: Address, metadata_cid: String) -> u64 {
        let oracle = read_oracle(&e);
        oracle.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        nft::mint(&e, &winner, metadata_cid)
    }

    /// Burn one NFT to repair (upgrade) another.
    /// The sacrifice NFT is destroyed, the target's repair_count increments.
    /// Returns `true` on success.
    pub fn burn_to_repair(e: Env, owner: Address, target_id: u64, sacrifice_id: u64) -> bool {
        owner.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // Validate ownership of both NFTs
        let target_owner = nft::owner_of(&e, target_id);
        let sacrifice_owner = nft::owner_of(&e, sacrifice_id);

        if target_owner != owner || sacrifice_owner != owner {
            panic!("must own both NFTs");
        }
        if target_id == sacrifice_id {
            panic!("cannot sacrifice the same NFT");
        }

        // Burn the sacrifice
        nft::burn(&e, sacrifice_id);

        // Increment repair count on target
        nft::increment_repair(&e, target_id);

        true
    }

    /// Get the owner of an NFT.
    pub fn owner_of(e: Env, nft_id: u64) -> Address {
        nft::owner_of(&e, nft_id)
    }

    /// Get the metadata of an NFT.
    pub fn metadata(e: Env, nft_id: u64) -> RelicMetadata {
        nft::metadata(&e, nft_id)
    }

    /// Transfer an NFT to another address.
    pub fn transfer_nft(e: Env, from: Address, to: Address, nft_id: u64) {
        from.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        let current_owner = nft::owner_of(&e, nft_id);
        if current_owner != from {
            panic!("not the owner");
        }

        nft::transfer(&e, nft_id, &to);
    }

    // ===================================================================
    // Marketplace Functions
    // ===================================================================

    /// Place a bid on any existing NFT.
    /// Locks DND tokens from the bidder into this contract (escrow).
    /// Returns the bid ID.
    pub fn place_bid(e: Env, bidder: Address, nft_id: u64, amount_dnd: i128) -> u64 {
        bidder.require_auth();

        if amount_dnd <= 0 {
            panic!("bid amount must be positive");
        }

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // Verify NFT exists
        let _ = nft::owner_of(&e, nft_id);

        // Transfer DND from bidder to this contract (escrow)
        let dnd_token = read_dnd_token(&e);
        let token_client = token::Client::new(&e, &dnd_token);
        token_client.transfer(&bidder, &e.current_contract_address(), &amount_dnd);

        // Store the bid
        marketplace::place_bid(&e, &bidder, nft_id, amount_dnd)
    }

    /// Cancel a bid and refund the bidder.
    pub fn cancel_bid(e: Env, bidder: Address, bid_id: u64) {
        bidder.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // Remove the bid and get its data for refund
        let bid = marketplace::cancel_bid(&e, &bidder, bid_id);

        // Refund DND from escrow back to bidder
        let dnd_token = read_dnd_token(&e);
        let token_client = token::Client::new(&e, &dnd_token);
        token_client.transfer(&e.current_contract_address(), &bidder, &bid.amount);
    }

    /// List an NFT for sale at a fixed price (Ask).
    pub fn list_item(e: Env, owner: Address, nft_id: u64, price_dnd: i128) {
        owner.require_auth();

        if price_dnd <= 0 {
            panic!("price must be positive");
        }

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // Verify ownership
        let current_owner = nft::owner_of(&e, nft_id);
        if current_owner != owner {
            panic!("not the owner");
        }

        marketplace::list_item(&e, nft_id, price_dnd);
    }

    /// Remove an NFT listing.
    pub fn delist_item(e: Env, owner: Address, nft_id: u64) {
        owner.require_auth();

        let current_owner = nft::owner_of(&e, nft_id);
        if current_owner != owner {
            panic!("not the owner");
        }

        marketplace::delist_item(&e, nft_id);
    }

    /// Accept a bid on an NFT you own.
    /// Transfers the NFT to the bidder and sends DND (minus fee) to the seller.
    pub fn accept_bid(e: Env, owner: Address, nft_id: u64, bid_id: u64) {
        owner.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // Verify ownership
        let current_owner = nft::owner_of(&e, nft_id);
        if current_owner != owner {
            panic!("not the owner");
        }

        // Get the bid
        let bid = marketplace::get_bid(&e, bid_id);
        if bid.nft_id != nft_id {
            panic!("bid is for a different NFT");
        }

        // Execute trade: DND is already in escrow (this contract)
        let dnd_token = read_dnd_token(&e);
        execute_trade(&e, &dnd_token, &owner, bid.amount, nft_id, &bid.bidder);

        // Remove the accepted bid
        marketplace::remove_bid(&e, bid_id, nft_id);

        // Remove listing if exists
        marketplace::delist_item(&e, nft_id);
    }

    /// Buy a listed NFT at the Ask price.
    pub fn buy_listed(e: Env, buyer: Address, nft_id: u64) {
        buyer.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        // Get the listing
        let listing = marketplace::get_listing(&e, nft_id)
            .expect("item is not listed");

        let owner = nft::owner_of(&e, nft_id);
        if owner == buyer {
            panic!("cannot buy your own item");
        }

        // Transfer DND from buyer to this contract first
        let dnd_token = read_dnd_token(&e);
        let token_client = token::Client::new(&e, &dnd_token);
        token_client.transfer(&buyer, &e.current_contract_address(), &listing.price);

        // Execute trade
        execute_trade(&e, &dnd_token, &owner, listing.price, nft_id, &buyer);

        // Remove listing
        marketplace::delist_item(&e, nft_id);
    }

    // ===================================================================
    // Read-only helpers
    // ===================================================================

    /// Get all bid IDs for an NFT.
    pub fn get_bids(e: Env, nft_id: u64) -> Vec<u64> {
        marketplace::get_nft_bids(&e, nft_id)
    }

    /// Get a bid by ID.
    pub fn get_bid(e: Env, bid_id: u64) -> Bid {
        marketplace::get_bid(&e, bid_id)
    }

    /// Get a listing for an NFT (if exists).
    pub fn get_listing(e: Env, nft_id: u64) -> Option<Listing> {
        marketplace::get_listing(&e, nft_id)
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
}

// ===========================================================================
// Internal trade execution
// ===========================================================================

/// Execute a trade: transfer DND (minus marketplace fee) to seller,
/// transfer NFT to buyer.
fn execute_trade(
    e: &Env,
    dnd_token: &Address,
    seller: &Address,
    total_amount: i128,
    nft_id: u64,
    buyer: &Address,
) {
    let token_client = token::Client::new(e, dnd_token);
    let contract_addr = e.current_contract_address();

    // Calculate and deduct marketplace fee
    // Call DND_Token.pay_marketplace_fee which burns part and sends part to treasury
    // The fee is deducted from the contract's escrowed DND.
    //
    // For simplicity, we compute fees here and do direct transfers.
    // In production, this would call pay_marketplace_fee on the DND_Token.
    //
    // Default: 2% burn (200 bps) + 1% treasury (100 bps) = 3% total fee
    let fee_bps: i128 = 300; // 3% total
    let fee_amount = (total_amount * fee_bps) / 10000;
    let seller_amount = total_amount - fee_amount;

    // Transfer seller's portion from escrow
    if seller_amount > 0 {
        token_client.transfer(&contract_addr, seller, &seller_amount);
    }

    // Burn the fee portion (simplified — transfer to a designated burn mechanism)
    if fee_amount > 0 {
        token_client.burn(&contract_addr, &fee_amount);
    }

    // Transfer NFT to buyer
    nft::transfer(e, nft_id, buyer);
}
