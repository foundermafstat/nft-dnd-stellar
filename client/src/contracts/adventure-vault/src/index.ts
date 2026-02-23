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
    contractId: "CCIIZ2MFPGV3SIRM3K2ZJFVPG6LMDCROTYUDTKI2GB6OHWZLRSSTGQ6J",
  }
} as const

export type DataKey = {tag: "Admin", values: void} | {tag: "Oracle", values: void} | {tag: "DndToken", values: void} | {tag: "FateVerifier", values: void} | {tag: "RelicRegistry", values: void} | {tag: "GameHub", values: void} | {tag: "SessionCounter", values: void} | {tag: "Session", values: readonly [u64]};


/**
 * A game session.
 */
export interface Session {
  action_count: u32;
  created_at: u64;
  fee_per_player: i128;
  id: u64;
  loot_rolls: Map<string, u32>;
  oracle_root: Buffer;
  pending_loot_cid: Option<string>;
  player_roots: Array<Buffer>;
  players: Array<string>;
  status: SessionStatus;
}


/**
 * Loot entry for end_adventure.
 */
export interface LootEntry {
  metadata_cid: string;
  winner: string;
}

/**
 * Session status.
 */
export type SessionStatus = {tag: "Active", values: void} | {tag: "LootRolling", values: void} | {tag: "Completed", values: void} | {tag: "Failed", values: void};

export interface Client {
  /**
   * Construct and simulate a set_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set a new admin address.
   */
  set_admin: ({new_admin}: {new_admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_oracle transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set a new oracle address.
   */
  set_oracle: ({new_oracle}: {new_oracle: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_session transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get a session by ID.
   */
  get_session: ({session_id}: {session_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Session>>

  /**
   * Construct and simulate a end_adventure transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * End an adventure session.
   * 
   * This is the CRITICAL LOCK function. It:
   * 1. Verifies the final state proof (ZK proof of honest completion).
   * 2. Distributes DND rewards to players.
   * 3. If there is a loot drop, transitions the session to LootRolling phase.
   * 4. If no loot, calls end_game() on Game Hub.
   * 
   * Only callable by the Oracle.
   */
  end_adventure: ({session_id, success, loot_cid, dnd_reward_per_player}: {session_id: u64, success: boolean, loot_cid: Option<string>, dnd_reward_per_player: i128}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a set_contracts transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Update linked contract addresses.
   */
  set_contracts: ({dnd_token, fate_verifier, relic_registry}: {dnd_token: string, fate_verifier: string, relic_registry: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a submit_action transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Submit an action during a session.
   * 
   * The Oracle validates the action off-chain, then submits
   * the dice roll proof on-chain for verification.
   * 
   * In the full implementation, this calls Fate_Verifier.verify_dice_roll().
   * Returns `true` if the action is valid.
   */
  submit_action: ({session_id, player, index, dice_root}: {session_id: u64, player: string, index: u32, dice_root: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a init_adventure transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize a new adventure session.
   * 
   * 1. Deducts DND fee from each player.
   * 2. Commits Merkle roots for all players + Oracle.
   * 3. Calls start_game() on Game Hub.
   * 
   * Returns the session ID.
   */
  init_adventure: ({players, roots, oracle_root, fee}: {players: Array<string>, roots: Array<Buffer>, oracle_root: Buffer, fee: i128}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a submit_loot_roll transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Submit a roll for the final loot drop (Need/Greed).
   * Called by each player during the LootRolling phase.
   */
  submit_loot_roll: ({session_id, player, d20_value, dice_root}: {session_id: u64, player: string, d20_value: u32, dice_root: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_session_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total number of sessions created.
   */
  get_session_count: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a resolve_loot_roll transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Resolve the loot rolling phase once everyone has rolled (or timed out).
   * Finds the highest roll, mints the NFT to them, and ends the session.
   */
  resolve_loot_roll: ({session_id}: {session_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin, oracle, dnd_token, fate_verifier, relic_registry, game_hub}: {admin: string, oracle: string, dnd_token: string, fate_verifier: string, relic_registry: string, game_hub: string},
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
    return ContractClient.deploy({admin, oracle, dnd_token, fate_verifier, relic_registry, game_hub}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAACAAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAGT3JhY2xlAAAAAAAAAAAAAAAAAAhEbmRUb2tlbgAAAAAAAAAAAAAADEZhdGVWZXJpZmllcgAAAAAAAAAAAAAADVJlbGljUmVnaXN0cnkAAAAAAAAAAAAAAAAAAAdHYW1lSHViAAAAAAAAAAAAAAAADlNlc3Npb25Db3VudGVyAAAAAAABAAAAAAAAAAdTZXNzaW9uAAAAAAEAAAAG",
        "AAAAAQAAAA9BIGdhbWUgc2Vzc2lvbi4AAAAAAAAAAAdTZXNzaW9uAAAAAAoAAAAAAAAADGFjdGlvbl9jb3VudAAAAAQAAAAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAAAAAAADmZlZV9wZXJfcGxheWVyAAAAAAALAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAKbG9vdF9yb2xscwAAAAAD7AAAABMAAAAEAAAAAAAAAAtvcmFjbGVfcm9vdAAAAAPuAAAAIAAAAAAAAAAQcGVuZGluZ19sb290X2NpZAAAA+gAAAAQAAAAAAAAAAxwbGF5ZXJfcm9vdHMAAAPqAAAD7gAAACAAAAAAAAAAB3BsYXllcnMAAAAD6gAAABMAAAAAAAAABnN0YXR1cwAAAAAH0AAAAA1TZXNzaW9uU3RhdHVzAAAA",
        "AAAAAQAAAB1Mb290IGVudHJ5IGZvciBlbmRfYWR2ZW50dXJlLgAAAAAAAAAAAAAJTG9vdEVudHJ5AAAAAAAAAgAAAAAAAAAMbWV0YWRhdGFfY2lkAAAAEAAAAAAAAAAGd2lubmVyAAAAAAAT",
        "AAAAAgAAAA9TZXNzaW9uIHN0YXR1cy4AAAAAAAAAAA1TZXNzaW9uU3RhdHVzAAAAAAAABAAAAAAAAAAAAAAABkFjdGl2ZQAAAAAAAAAAAAAAAAALTG9vdFJvbGxpbmcAAAAAAAAAAAAAAAAJQ29tcGxldGVkAAAAAAAAAAAAAAAAAAAGRmFpbGVkAAA=",
        "AAAAAAAAABhTZXQgYSBuZXcgYWRtaW4gYWRkcmVzcy4AAAAJc2V0X2FkbWluAAAAAAAAAQAAAAAAAAAJbmV3X2FkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAABlTZXQgYSBuZXcgb3JhY2xlIGFkZHJlc3MuAAAAAAAACnNldF9vcmFjbGUAAAAAAAEAAAAAAAAACm5ld19vcmFjbGUAAAAAABMAAAAA",
        "AAAAAAAAABRHZXQgYSBzZXNzaW9uIGJ5IElELgAAAAtnZXRfc2Vzc2lvbgAAAAABAAAAAAAAAApzZXNzaW9uX2lkAAAAAAAGAAAAAQAAB9AAAAAHU2Vzc2lvbgA=",
        "AAAAAAAAAUFFbmQgYW4gYWR2ZW50dXJlIHNlc3Npb24uCgpUaGlzIGlzIHRoZSBDUklUSUNBTCBMT0NLIGZ1bmN0aW9uLiBJdDoKMS4gVmVyaWZpZXMgdGhlIGZpbmFsIHN0YXRlIHByb29mIChaSyBwcm9vZiBvZiBob25lc3QgY29tcGxldGlvbikuCjIuIERpc3RyaWJ1dGVzIERORCByZXdhcmRzIHRvIHBsYXllcnMuCjMuIElmIHRoZXJlIGlzIGEgbG9vdCBkcm9wLCB0cmFuc2l0aW9ucyB0aGUgc2Vzc2lvbiB0byBMb290Um9sbGluZyBwaGFzZS4KNC4gSWYgbm8gbG9vdCwgY2FsbHMgZW5kX2dhbWUoKSBvbiBHYW1lIEh1Yi4KCk9ubHkgY2FsbGFibGUgYnkgdGhlIE9yYWNsZS4AAAAAAAANZW5kX2FkdmVudHVyZQAAAAAAAAQAAAAAAAAACnNlc3Npb25faWQAAAAAAAYAAAAAAAAAB3N1Y2Nlc3MAAAAAAQAAAAAAAAAIbG9vdF9jaWQAAAPoAAAAEAAAAAAAAAAVZG5kX3Jld2FyZF9wZXJfcGxheWVyAAAAAAAACwAAAAEAAAAB",
        "AAAAAAAAACFVcGRhdGUgbGlua2VkIGNvbnRyYWN0IGFkZHJlc3Nlcy4AAAAAAAANc2V0X2NvbnRyYWN0cwAAAAAAAAMAAAAAAAAACWRuZF90b2tlbgAAAAAAABMAAAAAAAAADWZhdGVfdmVyaWZpZXIAAAAAAAATAAAAAAAAAA5yZWxpY19yZWdpc3RyeQAAAAAAEwAAAAA=",
        "AAAAAAAAAPtTdWJtaXQgYW4gYWN0aW9uIGR1cmluZyBhIHNlc3Npb24uCgpUaGUgT3JhY2xlIHZhbGlkYXRlcyB0aGUgYWN0aW9uIG9mZi1jaGFpbiwgdGhlbiBzdWJtaXRzCnRoZSBkaWNlIHJvbGwgcHJvb2Ygb24tY2hhaW4gZm9yIHZlcmlmaWNhdGlvbi4KCkluIHRoZSBmdWxsIGltcGxlbWVudGF0aW9uLCB0aGlzIGNhbGxzIEZhdGVfVmVyaWZpZXIudmVyaWZ5X2RpY2Vfcm9sbCgpLgpSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYWN0aW9uIGlzIHZhbGlkLgAAAAANc3VibWl0X2FjdGlvbgAAAAAAAAQAAAAAAAAACnNlc3Npb25faWQAAAAAAAYAAAAAAAAABnBsYXllcgAAAAAAEwAAAAAAAAAFaW5kZXgAAAAAAAAEAAAAAAAAAAlkaWNlX3Jvb3QAAAAAAAPuAAAAIAAAAAEAAAAB",
        "AAAAAAAAAEJJbml0aWFsaXplIHRoZSBBZHZlbnR1cmUgVmF1bHQgd2l0aCBhbGwgbGlua2VkIGNvbnRyYWN0IGFkZHJlc3Nlcy4AAAAAAA1fX2NvbnN0cnVjdG9yAAAAAAAABgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAZvcmFjbGUAAAAAABMAAAAAAAAACWRuZF90b2tlbgAAAAAAABMAAAAAAAAADWZhdGVfdmVyaWZpZXIAAAAAAAATAAAAAAAAAA5yZWxpY19yZWdpc3RyeQAAAAAAEwAAAAAAAAAIZ2FtZV9odWIAAAATAAAAAA==",
        "AAAAAAAAALdJbml0aWFsaXplIGEgbmV3IGFkdmVudHVyZSBzZXNzaW9uLgoKMS4gRGVkdWN0cyBETkQgZmVlIGZyb20gZWFjaCBwbGF5ZXIuCjIuIENvbW1pdHMgTWVya2xlIHJvb3RzIGZvciBhbGwgcGxheWVycyArIE9yYWNsZS4KMy4gQ2FsbHMgc3RhcnRfZ2FtZSgpIG9uIEdhbWUgSHViLgoKUmV0dXJucyB0aGUgc2Vzc2lvbiBJRC4AAAAADmluaXRfYWR2ZW50dXJlAAAAAAAEAAAAAAAAAAdwbGF5ZXJzAAAAA+oAAAATAAAAAAAAAAVyb290cwAAAAAAA+oAAAPuAAAAIAAAAAAAAAALb3JhY2xlX3Jvb3QAAAAD7gAAACAAAAAAAAAAA2ZlZQAAAAALAAAAAQAAAAY=",
        "AAAAAAAAAGdTdWJtaXQgYSByb2xsIGZvciB0aGUgZmluYWwgbG9vdCBkcm9wIChOZWVkL0dyZWVkKS4KQ2FsbGVkIGJ5IGVhY2ggcGxheWVyIGR1cmluZyB0aGUgTG9vdFJvbGxpbmcgcGhhc2UuAAAAABBzdWJtaXRfbG9vdF9yb2xsAAAABAAAAAAAAAAKc2Vzc2lvbl9pZAAAAAAABgAAAAAAAAAGcGxheWVyAAAAAAATAAAAAAAAAAlkMjBfdmFsdWUAAAAAAAAEAAAAAAAAAAlkaWNlX3Jvb3QAAAAAAAPuAAAAIAAAAAEAAAAB",
        "AAAAAAAAACVHZXQgdG90YWwgbnVtYmVyIG9mIHNlc3Npb25zIGNyZWF0ZWQuAAAAAAAAEWdldF9zZXNzaW9uX2NvdW50AAAAAAAAAAAAAAEAAAAG",
        "AAAAAAAAAIxSZXNvbHZlIHRoZSBsb290IHJvbGxpbmcgcGhhc2Ugb25jZSBldmVyeW9uZSBoYXMgcm9sbGVkIChvciB0aW1lZCBvdXQpLgpGaW5kcyB0aGUgaGlnaGVzdCByb2xsLCBtaW50cyB0aGUgTkZUIHRvIHRoZW0sIGFuZCBlbmRzIHRoZSBzZXNzaW9uLgAAABFyZXNvbHZlX2xvb3Rfcm9sbAAAAAAAAAEAAAAAAAAACnNlc3Npb25faWQAAAAAAAYAAAAA" ]),
      options
    )
  }
  public readonly fromJSON = {
    set_admin: this.txFromJSON<null>,
        set_oracle: this.txFromJSON<null>,
        get_session: this.txFromJSON<Session>,
        end_adventure: this.txFromJSON<boolean>,
        set_contracts: this.txFromJSON<null>,
        submit_action: this.txFromJSON<boolean>,
        init_adventure: this.txFromJSON<u64>,
        submit_loot_roll: this.txFromJSON<boolean>,
        get_session_count: this.txFromJSON<u64>,
        resolve_loot_roll: this.txFromJSON<null>
  }
}