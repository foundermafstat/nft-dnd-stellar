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
    contractId: "CB2RIG4PPLQNW4EBL6WRWU4VSHO4GCH722XT4BLXMJ7NJM34ZI2OC2RU",
  }
} as const

export type DataKey = {tag: "Admin", values: void} | {tag: "Treasury", values: void} | {tag: "FeeConfig", values: void} | {tag: "Allowance", values: readonly [AllowanceDataKey]} | {tag: "Balance", values: readonly [string]};


/**
 * Fee configuration in basis points (1 bps = 0.01%)
 */
export interface FeeConfig {
  burn_bps: u32;
  treasury_bps: u32;
}


export interface AllowanceValue {
  amount: i128;
  expiration_ledger: u32;
}


export interface AllowanceDataKey {
  from: string;
  spender: string;
}


export interface TokenMetadata {
  decimal: u32;
  name: string;
  symbol: string;
}

export interface Client {
  /**
   * Construct and simulate a burn transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  burn: ({from, amount}: {from: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a mint transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Mint tokens — only callable by admin (Adventure_Vault contract or deployer).
   */
  mint: ({to, amount}: {to: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a name transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  name: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a symbol transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  symbol: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a approve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  approve: ({from, spender, amount, expiration_ledger}: {from: string, spender: string, amount: i128, expiration_ledger: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  balance: ({id}: {id: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a decimals transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  decimals: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a transfer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer: ({from, to, amount}: {from: string, to: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a treasury transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the treasury address.
   */
  treasury: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a allowance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  allowance: ({from, spender}: {from: string, spender: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a burn_from transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  burn_from: ({spender, from, amount}: {spender: string, from: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set a new admin address.
   */
  set_admin: ({new_admin}: {new_admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a fee_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the current fee configuration.
   */
  fee_config: (options?: MethodOptions) => Promise<AssembledTransaction<FeeConfig>>

  /**
   * Construct and simulate a set_treasury transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set the treasury address for fee collection.
   */
  set_treasury: ({new_treasury}: {new_treasury: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a transfer_from transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer_from: ({spender, from, to, amount}: {spender: string, from: string, to: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_fee_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Update marketplace fee configuration (in basis points).
   * burn_bps + treasury_bps should not exceed 10000 (100%).
   */
  set_fee_config: ({burn_bps, treasury_bps}: {burn_bps: u32, treasury_bps: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a burn_for_penance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Burn tokens for penance — removes in-game debuffs (magic restoration).
   * The user authorizes and their tokens are permanently burned.
   * Returns the amount burned.
   */
  burn_for_penance: ({user, amount}: {user: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a pay_marketplace_fee transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Called by Relic_Registry during trades. Splits the fee into a burned
   * portion and a treasury portion.
   * Returns (burned_amount, treasury_amount).
   */
  pay_marketplace_fee: ({from, total_amount}: {from: string, total_amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<readonly [i128, i128]>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin, treasury}: {admin: string, treasury: string},
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
    return ContractClient.deploy({admin, treasury}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABQAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAIVHJlYXN1cnkAAAAAAAAAAAAAAAlGZWVDb25maWcAAAAAAAABAAAAAAAAAAlBbGxvd2FuY2UAAAAAAAABAAAH0AAAABBBbGxvd2FuY2VEYXRhS2V5AAAAAQAAAAAAAAAHQmFsYW5jZQAAAAABAAAAEw==",
        "AAAAAQAAADFGZWUgY29uZmlndXJhdGlvbiBpbiBiYXNpcyBwb2ludHMgKDEgYnBzID0gMC4wMSUpAAAAAAAAAAAAAAlGZWVDb25maWcAAAAAAAACAAAAAAAAAAhidXJuX2JwcwAAAAQAAAAAAAAADHRyZWFzdXJ5X2JwcwAAAAQ=",
        "AAAAAQAAAAAAAAAAAAAADkFsbG93YW5jZVZhbHVlAAAAAAACAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAEWV4cGlyYXRpb25fbGVkZ2VyAAAAAAAABA==",
        "AAAAAQAAAAAAAAAAAAAAEEFsbG93YW5jZURhdGFLZXkAAAACAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAHc3BlbmRlcgAAAAAT",
        "AAAAAAAAAAAAAAAEYnVybgAAAAIAAAAAAAAABGZyb20AAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAAE5NaW50IHRva2VucyDigJQgb25seSBjYWxsYWJsZSBieSBhZG1pbiAoQWR2ZW50dXJlX1ZhdWx0IGNvbnRyYWN0IG9yIGRlcGxveWVyKS4AAAAAAARtaW50AAAAAgAAAAAAAAACdG8AAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
        "AAAAAAAAAAAAAAAEbmFtZQAAAAAAAAABAAAAEA==",
        "AAAAAAAAAAAAAAAGc3ltYm9sAAAAAAAAAAAAAQAAABA=",
        "AAAAAAAAAAAAAAAHYXBwcm92ZQAAAAAEAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAHc3BlbmRlcgAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAEWV4cGlyYXRpb25fbGVkZ2VyAAAAAAAABAAAAAA=",
        "AAAAAAAAAAAAAAAHYmFsYW5jZQAAAAABAAAAAAAAAAJpZAAAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAAAAAAAIZGVjaW1hbHMAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAIdHJhbnNmZXIAAAADAAAAAAAAAARmcm9tAAAAEwAAAAAAAAACdG8AAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
        "AAAAAAAAABlHZXQgdGhlIHRyZWFzdXJ5IGFkZHJlc3MuAAAAAAAACHRyZWFzdXJ5AAAAAAAAAAEAAAAT",
        "AAAAAAAAAAAAAAAJYWxsb3dhbmNlAAAAAAAAAgAAAAAAAAAEZnJvbQAAABMAAAAAAAAAB3NwZW5kZXIAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAAAAAAAJYnVybl9mcm9tAAAAAAAAAwAAAAAAAAAHc3BlbmRlcgAAAAATAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAABhTZXQgYSBuZXcgYWRtaW4gYWRkcmVzcy4AAAAJc2V0X2FkbWluAAAAAAAAAQAAAAAAAAAJbmV3X2FkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAACJHZXQgdGhlIGN1cnJlbnQgZmVlIGNvbmZpZ3VyYXRpb24uAAAAAAAKZmVlX2NvbmZpZwAAAAAAAAAAAAEAAAfQAAAACUZlZUNvbmZpZwAAAA==",
        "AAAAAAAAACxTZXQgdGhlIHRyZWFzdXJ5IGFkZHJlc3MgZm9yIGZlZSBjb2xsZWN0aW9uLgAAAAxzZXRfdHJlYXN1cnkAAAABAAAAAAAAAAxuZXdfdHJlYXN1cnkAAAATAAAAAA==",
        "AAAAAAAAAAAAAAANdHJhbnNmZXJfZnJvbQAAAAAAAAQAAAAAAAAAB3NwZW5kZXIAAAAAEwAAAAAAAAAEZnJvbQAAABMAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAACJJbml0aWFsaXplIHRoZSBETkQgVG9rZW4gY29udHJhY3QuAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAIdHJlYXN1cnkAAAATAAAAAA==",
        "AAAAAAAAAG9VcGRhdGUgbWFya2V0cGxhY2UgZmVlIGNvbmZpZ3VyYXRpb24gKGluIGJhc2lzIHBvaW50cykuCmJ1cm5fYnBzICsgdHJlYXN1cnlfYnBzIHNob3VsZCBub3QgZXhjZWVkIDEwMDAwICgxMDAlKS4AAAAADnNldF9mZWVfY29uZmlnAAAAAAACAAAAAAAAAAhidXJuX2JwcwAAAAQAAAAAAAAADHRyZWFzdXJ5X2JwcwAAAAQAAAAA",
        "AAAAAAAAAKBCdXJuIHRva2VucyBmb3IgcGVuYW5jZSDigJQgcmVtb3ZlcyBpbi1nYW1lIGRlYnVmZnMgKG1hZ2ljIHJlc3RvcmF0aW9uKS4KVGhlIHVzZXIgYXV0aG9yaXplcyBhbmQgdGhlaXIgdG9rZW5zIGFyZSBwZXJtYW5lbnRseSBidXJuZWQuClJldHVybnMgdGhlIGFtb3VudCBidXJuZWQuAAAAEGJ1cm5fZm9yX3BlbmFuY2UAAAACAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAQAAAAs=",
        "AAAAAAAAAI5DYWxsZWQgYnkgUmVsaWNfUmVnaXN0cnkgZHVyaW5nIHRyYWRlcy4gU3BsaXRzIHRoZSBmZWUgaW50byBhIGJ1cm5lZApwb3J0aW9uIGFuZCBhIHRyZWFzdXJ5IHBvcnRpb24uClJldHVybnMgKGJ1cm5lZF9hbW91bnQsIHRyZWFzdXJ5X2Ftb3VudCkuAAAAAAATcGF5X21hcmtldHBsYWNlX2ZlZQAAAAACAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAMdG90YWxfYW1vdW50AAAACwAAAAEAAAPtAAAAAgAAAAsAAAAL",
        "AAAAAQAAAAAAAAAAAAAADVRva2VuTWV0YWRhdGEAAAAAAAADAAAAAAAAAAdkZWNpbWFsAAAAAAQAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAZzeW1ib2wAAAAAABA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    burn: this.txFromJSON<null>,
        mint: this.txFromJSON<null>,
        name: this.txFromJSON<string>,
        symbol: this.txFromJSON<string>,
        approve: this.txFromJSON<null>,
        balance: this.txFromJSON<i128>,
        decimals: this.txFromJSON<u32>,
        transfer: this.txFromJSON<null>,
        treasury: this.txFromJSON<string>,
        allowance: this.txFromJSON<i128>,
        burn_from: this.txFromJSON<null>,
        set_admin: this.txFromJSON<null>,
        fee_config: this.txFromJSON<FeeConfig>,
        set_treasury: this.txFromJSON<null>,
        transfer_from: this.txFromJSON<null>,
        set_fee_config: this.txFromJSON<null>,
        burn_for_penance: this.txFromJSON<i128>,
        pay_marketplace_fee: this.txFromJSON<readonly [i128, i128]>
  }
}