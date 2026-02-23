import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CAOXCTX57AJJA6D2QN5UXDF3OHDZBDBS2J6SKSHI7TOFTMKGKD5Y5H2X",
  }
} as const


/**
 * A bid on an NFT.
 */
export interface Bid {
  amount: i128;
  bidder: string;
  created_at: u64;
  id: u64;
  nft_id: u64;
}

export type DataKey = {tag: "Admin", values: void} | {tag: "Oracle", values: void} | {tag: "DndToken", values: void} | {tag: "NftCounter", values: void} | {tag: "BidCounter", values: void} | {tag: "Nft", values: readonly [u64]} | {tag: "NftOwner", values: readonly [u64]} | {tag: "Bid", values: readonly [u64]} | {tag: "NftBids", values: readonly [u64]} | {tag: "Listing", values: readonly [u64]};


/**
 * A listing (Ask) for an NFT.
 */
export interface Listing {
  listed_at: u64;
  nft_id: u64;
  price: i128;
}


/**
 * NFT metadata stored on-chain.
 */
export interface RelicMetadata {
  id: u64;
  metadata_cid: string;
  minted_at: u64;
  repair_count: u32;
}

export interface Client {
  /**
   * Construct and simulate a get_bid transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get a bid by ID.
   */
  get_bid: ({bid_id}: {bid_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Bid>>

  /**
   * Construct and simulate a get_bids transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get all bid IDs for an NFT.
   */
  get_bids: ({nft_id}: {nft_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Array<u64>>>

  /**
   * Construct and simulate a metadata transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the metadata of an NFT.
   */
  metadata: ({nft_id}: {nft_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<RelicMetadata>>

  /**
   * Construct and simulate a owner_of transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the owner of an NFT.
   */
  owner_of: ({nft_id}: {nft_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a list_item transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * List an NFT for sale at a fixed price (Ask).
   */
  list_item: ({owner, nft_id, price_dnd}: {owner: string, nft_id: u64, price_dnd: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a place_bid transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Place a bid on any existing NFT.
   * Locks DND tokens from the bidder into this contract (escrow).
   * Returns the bid ID.
   */
  place_bid: ({bidder, nft_id, amount_dnd}: {bidder: string, nft_id: u64, amount_dnd: i128}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a set_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set a new admin address.
   */
  set_admin: ({new_admin}: {new_admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a accept_bid transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Accept a bid on an NFT you own.
   * Transfers the NFT to the bidder and sends DND (minus fee) to the seller.
   */
  accept_bid: ({owner, nft_id, bid_id}: {owner: string, nft_id: u64, bid_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a buy_listed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Buy a listed NFT at the Ask price.
   */
  buy_listed: ({buyer, nft_id}: {buyer: string, nft_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a cancel_bid transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cancel a bid and refund the bidder.
   */
  cancel_bid: ({bidder, bid_id}: {bidder: string, bid_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a mint_relic transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Mint a new relic NFT. Only callable by the Oracle.
   * Returns the new NFT ID.
   */
  mint_relic: ({winner, metadata_cid}: {winner: string, metadata_cid: string}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a set_oracle transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set a new oracle address.
   */
  set_oracle: ({new_oracle}: {new_oracle: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a delist_item transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Remove an NFT listing.
   */
  delist_item: ({owner, nft_id}: {owner: string, nft_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_listing transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get a listing for an NFT (if exists).
   */
  get_listing: ({nft_id}: {nft_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Option<Listing>>>

  /**
   * Construct and simulate a transfer_nft transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Transfer an NFT to another address.
   */
  transfer_nft: ({from, to, nft_id}: {from: string, to: string, nft_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a burn_to_repair transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Burn one NFT to repair (upgrade) another.
   * The sacrifice NFT is destroyed, the target's repair_count increments.
   * Returns `true` on success.
   */
  burn_to_repair: ({owner, target_id, sacrifice_id}: {owner: string, target_id: u64, sacrifice_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin, oracle, dnd_token}: {admin: string, oracle: string, dnd_token: string},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({admin, oracle, dnd_token}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAABBBIGJpZCBvbiBhbiBORlQuAAAAAAAAAANCaWQAAAAABQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAZiaWRkZXIAAAAAABMAAAAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAZuZnRfaWQAAAAAAAY=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAACgAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAGT3JhY2xlAAAAAAAAAAAAAAAAAAhEbmRUb2tlbgAAAAAAAAAAAAAACk5mdENvdW50ZXIAAAAAAAAAAAAAAAAACkJpZENvdW50ZXIAAAAAAAEAAAAAAAAAA05mdAAAAAABAAAABgAAAAEAAAAAAAAACE5mdE93bmVyAAAAAQAAAAYAAAABAAAAAAAAAANCaWQAAAAAAQAAAAYAAAABAAAAAAAAAAdOZnRCaWRzAAAAAAEAAAAGAAAAAQAAAAAAAAAHTGlzdGluZwAAAAABAAAABg==",
        "AAAAAQAAABtBIGxpc3RpbmcgKEFzaykgZm9yIGFuIE5GVC4AAAAAAAAAAAdMaXN0aW5nAAAAAAMAAAAAAAAACWxpc3RlZF9hdAAAAAAAAAYAAAAAAAAABm5mdF9pZAAAAAAABgAAAAAAAAAFcHJpY2UAAAAAAAAL",
        "AAAAAQAAAB1ORlQgbWV0YWRhdGEgc3RvcmVkIG9uLWNoYWluLgAAAAAAAAAAAAANUmVsaWNNZXRhZGF0YQAAAAAAAAQAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAxtZXRhZGF0YV9jaWQAAAAQAAAAAAAAAAltaW50ZWRfYXQAAAAAAAAGAAAAAAAAAAxyZXBhaXJfY291bnQAAAAE",
        "AAAAAAAAABBHZXQgYSBiaWQgYnkgSUQuAAAAB2dldF9iaWQAAAAAAQAAAAAAAAAGYmlkX2lkAAAAAAAGAAAAAQAAB9AAAAADQmlkAA==",
        "AAAAAAAAABtHZXQgYWxsIGJpZCBJRHMgZm9yIGFuIE5GVC4AAAAACGdldF9iaWRzAAAAAQAAAAAAAAAGbmZ0X2lkAAAAAAAGAAAAAQAAA+oAAAAG",
        "AAAAAAAAABtHZXQgdGhlIG1ldGFkYXRhIG9mIGFuIE5GVC4AAAAACG1ldGFkYXRhAAAAAQAAAAAAAAAGbmZ0X2lkAAAAAAAGAAAAAQAAB9AAAAANUmVsaWNNZXRhZGF0YQAAAA==",
        "AAAAAAAAABhHZXQgdGhlIG93bmVyIG9mIGFuIE5GVC4AAAAIb3duZXJfb2YAAAABAAAAAAAAAAZuZnRfaWQAAAAAAAYAAAABAAAAEw==",
        "AAAAAAAAACxMaXN0IGFuIE5GVCBmb3Igc2FsZSBhdCBhIGZpeGVkIHByaWNlIChBc2spLgAAAAlsaXN0X2l0ZW0AAAAAAAADAAAAAAAAAAVvd25lcgAAAAAAABMAAAAAAAAABm5mdF9pZAAAAAAABgAAAAAAAAAJcHJpY2VfZG5kAAAAAAAACwAAAAA=",
        "AAAAAAAAAHJQbGFjZSBhIGJpZCBvbiBhbnkgZXhpc3RpbmcgTkZULgpMb2NrcyBETkQgdG9rZW5zIGZyb20gdGhlIGJpZGRlciBpbnRvIHRoaXMgY29udHJhY3QgKGVzY3JvdykuClJldHVybnMgdGhlIGJpZCBJRC4AAAAAAAlwbGFjZV9iaWQAAAAAAAADAAAAAAAAAAZiaWRkZXIAAAAAABMAAAAAAAAABm5mdF9pZAAAAAAABgAAAAAAAAAKYW1vdW50X2RuZAAAAAAACwAAAAEAAAAG",
        "AAAAAAAAABhTZXQgYSBuZXcgYWRtaW4gYWRkcmVzcy4AAAAJc2V0X2FkbWluAAAAAAAAAQAAAAAAAAAJbmV3X2FkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAGhBY2NlcHQgYSBiaWQgb24gYW4gTkZUIHlvdSBvd24uClRyYW5zZmVycyB0aGUgTkZUIHRvIHRoZSBiaWRkZXIgYW5kIHNlbmRzIERORCAobWludXMgZmVlKSB0byB0aGUgc2VsbGVyLgAAAAphY2NlcHRfYmlkAAAAAAADAAAAAAAAAAVvd25lcgAAAAAAABMAAAAAAAAABm5mdF9pZAAAAAAABgAAAAAAAAAGYmlkX2lkAAAAAAAGAAAAAA==",
        "AAAAAAAAACJCdXkgYSBsaXN0ZWQgTkZUIGF0IHRoZSBBc2sgcHJpY2UuAAAAAAAKYnV5X2xpc3RlZAAAAAAAAgAAAAAAAAAFYnV5ZXIAAAAAAAATAAAAAAAAAAZuZnRfaWQAAAAAAAYAAAAA",
        "AAAAAAAAACNDYW5jZWwgYSBiaWQgYW5kIHJlZnVuZCB0aGUgYmlkZGVyLgAAAAAKY2FuY2VsX2JpZAAAAAAAAgAAAAAAAAAGYmlkZGVyAAAAAAATAAAAAAAAAAZiaWRfaWQAAAAAAAYAAAAA",
        "AAAAAAAAAEpNaW50IGEgbmV3IHJlbGljIE5GVC4gT25seSBjYWxsYWJsZSBieSB0aGUgT3JhY2xlLgpSZXR1cm5zIHRoZSBuZXcgTkZUIElELgAAAAAACm1pbnRfcmVsaWMAAAAAAAIAAAAAAAAABndpbm5lcgAAAAAAEwAAAAAAAAAMbWV0YWRhdGFfY2lkAAAAEAAAAAEAAAAG",
        "AAAAAAAAABlTZXQgYSBuZXcgb3JhY2xlIGFkZHJlc3MuAAAAAAAACnNldF9vcmFjbGUAAAAAAAEAAAAAAAAACm5ld19vcmFjbGUAAAAAABMAAAAA",
        "AAAAAAAAABZSZW1vdmUgYW4gTkZUIGxpc3RpbmcuAAAAAAALZGVsaXN0X2l0ZW0AAAAAAgAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAZuZnRfaWQAAAAAAAYAAAAA",
        "AAAAAAAAACVHZXQgYSBsaXN0aW5nIGZvciBhbiBORlQgKGlmIGV4aXN0cykuAAAAAAAAC2dldF9saXN0aW5nAAAAAAEAAAAAAAAABm5mdF9pZAAAAAAABgAAAAEAAAPoAAAH0AAAAAdMaXN0aW5nAA==",
        "AAAAAAAAACNUcmFuc2ZlciBhbiBORlQgdG8gYW5vdGhlciBhZGRyZXNzLgAAAAAMdHJhbnNmZXJfbmZ0AAAAAwAAAAAAAAAEZnJvbQAAABMAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAZuZnRfaWQAAAAAAAYAAAAA",
        "AAAAAAAAAB5Jbml0aWFsaXplIHRoZSBSZWxpYyBSZWdpc3RyeS4AAAAAAA1fX2NvbnN0cnVjdG9yAAAAAAAAAwAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAZvcmFjbGUAAAAAABMAAAAAAAAACWRuZF90b2tlbgAAAAAAABMAAAAA",
        "AAAAAAAAAIpCdXJuIG9uZSBORlQgdG8gcmVwYWlyICh1cGdyYWRlKSBhbm90aGVyLgpUaGUgc2FjcmlmaWNlIE5GVCBpcyBkZXN0cm95ZWQsIHRoZSB0YXJnZXQncyByZXBhaXJfY291bnQgaW5jcmVtZW50cy4KUmV0dXJucyBgdHJ1ZWAgb24gc3VjY2Vzcy4AAAAAAA5idXJuX3RvX3JlcGFpcgAAAAAAAwAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAl0YXJnZXRfaWQAAAAAAAAGAAAAAAAAAAxzYWNyaWZpY2VfaWQAAAAGAAAAAQAAAAE=" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_bid: this.txFromJSON<Bid>,
        get_bids: this.txFromJSON<Array<u64>>,
        metadata: this.txFromJSON<RelicMetadata>,
        owner_of: this.txFromJSON<string>,
        list_item: this.txFromJSON<null>,
        place_bid: this.txFromJSON<u64>,
        set_admin: this.txFromJSON<null>,
        accept_bid: this.txFromJSON<null>,
        buy_listed: this.txFromJSON<null>,
        cancel_bid: this.txFromJSON<null>,
        mint_relic: this.txFromJSON<u64>,
        set_oracle: this.txFromJSON<null>,
        delist_item: this.txFromJSON<null>,
        get_listing: this.txFromJSON<Option<Listing>>,
        transfer_nft: this.txFromJSON<null>,
        burn_to_repair: this.txFromJSON<boolean>
  }
}