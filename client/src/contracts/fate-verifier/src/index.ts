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
    contractId: "CCIGFXIXSFUCYWRJVCXFOBAC2KRS4C4AQZRFGSM6A7H3KRXV552CGMCW",
  }
} as const

/**
 * Type of verification key (dice or fog of war).
 */
export type VkType = {tag: "Dice", values: void} | {tag: "FogOfWar", values: void};


/**
 * A point on the G1 curve (BN254).
 * Encoded as 64 bytes (32 bytes x, 32 bytes y).
 */
export interface G1Point {
  x: Buffer;
  y: Buffer;
}


/**
 * A point on the G2 curve (BN254).
 * Encoded as 128 bytes (2 × 32 bytes for each coordinate).
 */
export interface G2Point {
  x_imag: Buffer;
  x_real: Buffer;
  y_imag: Buffer;
  y_real: Buffer;
}


/**
 * Dice values for a single roll batch.
 * Each field represents the result of a specific die type.
 */
export interface DiceValues {
  d10: u32;
  d12: u32;
  d20: u32;
  d4: u32;
  d6: u32;
  d8: u32;
}


/**
 * Groth16 proof (A, B, C points).
 */
export interface Groth16Proof {
  a: G1Point;
  b: G2Point;
  c: G1Point;
}


/**
 * Groth16 verification key.
 */
export interface VerificationKey {
  alpha: G1Point;
  beta: G2Point;
  delta: G2Point;
  gamma: G2Point;
  ic: Array<G1Point>;
}

export type DataKey = {tag: "Admin", values: void} | {tag: "DiceVk", values: void} | {tag: "FogVk", values: void};

export interface Client {
  /**
   * Construct and simulate a has_vk transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check if a verification key is configured.
   */
  has_vk: ({vk_type}: {vk_type: VkType}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a set_vk transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set or update a verification key (dice or fog-of-war).
   */
  set_vk: ({vk_type, vk}: {vk_type: VkType, vk: VerificationKey}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Update the admin address.
   */
  set_admin: ({new_admin}: {new_admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a verify_dice_roll transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Verify a dice roll against a committed Merkle root.
   * 
   * The prover (player or oracle) commits to a Merkle tree of 300 dice
   * batches at session start. During gameplay, they reveal individual
   * leaves and provide Merkle proofs.
   * 
   * This function verifies:
   * 1. The Merkle proof is valid (leaf belongs to the committed root).
   * 2. Optionally, the ZK proof that the leaf was generated correctly
   * (commented out until Groth16 VK is deployed).
   * 
   * # Arguments
   * * `expected_root` - Merkle root committed at session start.
   * * `index` - Leaf index (1..300, converted to 0-based internally).
   * * `revealed_values` - The dice values being revealed.
   * * `salt` - Per-leaf salt used during tree generation.
   * * `merkle_proof` - Sibling hashes along the path.
   * 
   * # Returns
   * `true` if the dice roll is verified as authentic.
   */
  verify_dice_roll: ({expected_root, index, revealed_values, salt, merkle_proof}: {expected_root: Buffer, index: u32, revealed_values: DiceValues, salt: Buffer, merkle_proof: Array<Buffer>}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a verify_fog_of_war transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Verify a fog-of-war proof.
   * 
   * The player proves they have the right to see a room/zone without
   * revealing their exact position. The ZK circuit uses Poseidon to
   * hash coordinates and visibility radius, proving collision (distance
   * within visibility range) without revealing exact X, Y.
   * 
   * # Arguments
   * * `proof` - Groth16 proof.
   * * `zone_hash` - Poseidon(zone_id, zone_secret) — public commitment.
   * 
   * # Returns
   * `true` if the player has proven visibility rights.
   */
  verify_fog_of_war: ({proof, zone_hash}: {proof: Groth16Proof, zone_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a verify_dice_roll_zk transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Verify a dice roll with a ZK proof (full Groth16 verification).
   * 
   * This version additionally verifies a Groth16 proof that the dice
   * values were generated correctly according to the game rules.
   */
  verify_dice_roll_zk: ({proof, expected_root, index, revealed_values}: {proof: Groth16Proof, expected_root: Buffer, index: u32, revealed_values: DiceValues}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin}: {admin: string},
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
    return ContractClient.deploy({admin}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAC5UeXBlIG9mIHZlcmlmaWNhdGlvbiBrZXkgKGRpY2Ugb3IgZm9nIG9mIHdhcikuAAAAAAAAAAAABlZrVHlwZQAAAAAAAgAAAAAAAAAAAAAABERpY2UAAAAAAAAAAAAAAAhGb2dPZldhcg==",
        "AAAAAQAAAE5BIHBvaW50IG9uIHRoZSBHMSBjdXJ2ZSAoQk4yNTQpLgpFbmNvZGVkIGFzIDY0IGJ5dGVzICgzMiBieXRlcyB4LCAzMiBieXRlcyB5KS4AAAAAAAAAAAAHRzFQb2ludAAAAAACAAAAAAAAAAF4AAAAAAAD7gAAACAAAAAAAAAAAXkAAAAAAAPuAAAAIA==",
        "AAAAAQAAAFpBIHBvaW50IG9uIHRoZSBHMiBjdXJ2ZSAoQk4yNTQpLgpFbmNvZGVkIGFzIDEyOCBieXRlcyAoMiDDlyAzMiBieXRlcyBmb3IgZWFjaCBjb29yZGluYXRlKS4AAAAAAAAAAAAHRzJQb2ludAAAAAAEAAAAAAAAAAZ4X2ltYWcAAAAAA+4AAAAgAAAAAAAAAAZ4X3JlYWwAAAAAA+4AAAAgAAAAAAAAAAZ5X2ltYWcAAAAAA+4AAAAgAAAAAAAAAAZ5X3JlYWwAAAAAA+4AAAAg",
        "AAAAAQAAAF1EaWNlIHZhbHVlcyBmb3IgYSBzaW5nbGUgcm9sbCBiYXRjaC4KRWFjaCBmaWVsZCByZXByZXNlbnRzIHRoZSByZXN1bHQgb2YgYSBzcGVjaWZpYyBkaWUgdHlwZS4AAAAAAAAAAAAACkRpY2VWYWx1ZXMAAAAAAAYAAAAAAAAAA2QxMAAAAAAEAAAAAAAAAANkMTIAAAAABAAAAAAAAAADZDIwAAAAAAQAAAAAAAAAAmQ0AAAAAAAEAAAAAAAAAAJkNgAAAAAABAAAAAAAAAACZDgAAAAAAAQ=",
        "AAAAAQAAAB9Hcm90aDE2IHByb29mIChBLCBCLCBDIHBvaW50cykuAAAAAAAAAAAMR3JvdGgxNlByb29mAAAAAwAAAAAAAAABYQAAAAAAB9AAAAAHRzFQb2ludAAAAAAAAAAAAWIAAAAAAAfQAAAAB0cyUG9pbnQAAAAAAAAAAAFjAAAAAAAH0AAAAAdHMVBvaW50AA==",
        "AAAAAQAAABlHcm90aDE2IHZlcmlmaWNhdGlvbiBrZXkuAAAAAAAAAAAAAA9WZXJpZmljYXRpb25LZXkAAAAABQAAAAAAAAAFYWxwaGEAAAAAAAfQAAAAB0cxUG9pbnQAAAAAAAAAAARiZXRhAAAH0AAAAAdHMlBvaW50AAAAAAAAAAAFZGVsdGEAAAAAAAfQAAAAB0cyUG9pbnQAAAAAAAAAAAVnYW1tYQAAAAAAB9AAAAAHRzJQb2ludAAAAAAAAAAAAmljAAAAAAPqAAAH0AAAAAdHMVBvaW50AA==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAGRGljZVZrAAAAAAAAAAAAAAAAAAVGb2dWawAAAA==",
        "AAAAAAAAACpDaGVjayBpZiBhIHZlcmlmaWNhdGlvbiBrZXkgaXMgY29uZmlndXJlZC4AAAAAAAZoYXNfdmsAAAAAAAEAAAAAAAAAB3ZrX3R5cGUAAAAH0AAAAAZWa1R5cGUAAAAAAAEAAAAB",
        "AAAAAAAAADZTZXQgb3IgdXBkYXRlIGEgdmVyaWZpY2F0aW9uIGtleSAoZGljZSBvciBmb2ctb2Ytd2FyKS4AAAAAAAZzZXRfdmsAAAAAAAIAAAAAAAAAB3ZrX3R5cGUAAAAH0AAAAAZWa1R5cGUAAAAAAAAAAAACdmsAAAAAB9AAAAAPVmVyaWZpY2F0aW9uS2V5AAAAAAA=",
        "AAAAAAAAABlVcGRhdGUgdGhlIGFkbWluIGFkZHJlc3MuAAAAAAAACXNldF9hZG1pbgAAAAAAAAEAAAAAAAAACW5ld19hZG1pbgAAAAAAABMAAAAA",
        "AAAAAAAAAEdJbml0aWFsaXplIHRoZSBGYXRlIFZlcmlmaWVyIHdpdGggYWRtaW4gYW5kIG9wdGlvbmFsIHZlcmlmaWNhdGlvbiBrZXlzLgAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAw1WZXJpZnkgYSBkaWNlIHJvbGwgYWdhaW5zdCBhIGNvbW1pdHRlZCBNZXJrbGUgcm9vdC4KClRoZSBwcm92ZXIgKHBsYXllciBvciBvcmFjbGUpIGNvbW1pdHMgdG8gYSBNZXJrbGUgdHJlZSBvZiAzMDAgZGljZQpiYXRjaGVzIGF0IHNlc3Npb24gc3RhcnQuIER1cmluZyBnYW1lcGxheSwgdGhleSByZXZlYWwgaW5kaXZpZHVhbApsZWF2ZXMgYW5kIHByb3ZpZGUgTWVya2xlIHByb29mcy4KClRoaXMgZnVuY3Rpb24gdmVyaWZpZXM6CjEuIFRoZSBNZXJrbGUgcHJvb2YgaXMgdmFsaWQgKGxlYWYgYmVsb25ncyB0byB0aGUgY29tbWl0dGVkIHJvb3QpLgoyLiBPcHRpb25hbGx5LCB0aGUgWksgcHJvb2YgdGhhdCB0aGUgbGVhZiB3YXMgZ2VuZXJhdGVkIGNvcnJlY3RseQooY29tbWVudGVkIG91dCB1bnRpbCBHcm90aDE2IFZLIGlzIGRlcGxveWVkKS4KCiMgQXJndW1lbnRzCiogYGV4cGVjdGVkX3Jvb3RgIC0gTWVya2xlIHJvb3QgY29tbWl0dGVkIGF0IHNlc3Npb24gc3RhcnQuCiogYGluZGV4YCAtIExlYWYgaW5kZXggKDEuLjMwMCwgY29udmVydGVkIHRvIDAtYmFzZWQgaW50ZXJuYWxseSkuCiogYHJldmVhbGVkX3ZhbHVlc2AgLSBUaGUgZGljZSB2YWx1ZXMgYmVpbmcgcmV2ZWFsZWQuCiogYHNhbHRgIC0gUGVyLWxlYWYgc2FsdCB1c2VkIGR1cmluZyB0cmVlIGdlbmVyYXRpb24uCiogYG1lcmtsZV9wcm9vZmAgLSBTaWJsaW5nIGhhc2hlcyBhbG9uZyB0aGUgcGF0aC4KCiMgUmV0dXJucwpgdHJ1ZWAgaWYgdGhlIGRpY2Ugcm9sbCBpcyB2ZXJpZmllZCBhcyBhdXRoZW50aWMuAAAAAAAAEHZlcmlmeV9kaWNlX3JvbGwAAAAFAAAAAAAAAA1leHBlY3RlZF9yb290AAAAAAAD7gAAACAAAAAAAAAABWluZGV4AAAAAAAABAAAAAAAAAAPcmV2ZWFsZWRfdmFsdWVzAAAAB9AAAAAKRGljZVZhbHVlcwAAAAAAAAAAAARzYWx0AAAD7gAAACAAAAAAAAAADG1lcmtsZV9wcm9vZgAAA+oAAAPuAAAAIAAAAAEAAAAB",
        "AAAAAAAAAcNWZXJpZnkgYSBmb2ctb2Ytd2FyIHByb29mLgoKVGhlIHBsYXllciBwcm92ZXMgdGhleSBoYXZlIHRoZSByaWdodCB0byBzZWUgYSByb29tL3pvbmUgd2l0aG91dApyZXZlYWxpbmcgdGhlaXIgZXhhY3QgcG9zaXRpb24uIFRoZSBaSyBjaXJjdWl0IHVzZXMgUG9zZWlkb24gdG8KaGFzaCBjb29yZGluYXRlcyBhbmQgdmlzaWJpbGl0eSByYWRpdXMsIHByb3ZpbmcgY29sbGlzaW9uIChkaXN0YW5jZQp3aXRoaW4gdmlzaWJpbGl0eSByYW5nZSkgd2l0aG91dCByZXZlYWxpbmcgZXhhY3QgWCwgWS4KCiMgQXJndW1lbnRzCiogYHByb29mYCAtIEdyb3RoMTYgcHJvb2YuCiogYHpvbmVfaGFzaGAgLSBQb3NlaWRvbih6b25lX2lkLCB6b25lX3NlY3JldCkg4oCUIHB1YmxpYyBjb21taXRtZW50LgoKIyBSZXR1cm5zCmB0cnVlYCBpZiB0aGUgcGxheWVyIGhhcyBwcm92ZW4gdmlzaWJpbGl0eSByaWdodHMuAAAAABF2ZXJpZnlfZm9nX29mX3dhcgAAAAAAAAIAAAAAAAAABXByb29mAAAAAAAH0AAAAAxHcm90aDE2UHJvb2YAAAAAAAAACXpvbmVfaGFzaAAAAAAAA+4AAAAgAAAAAQAAAAE=",
        "AAAAAAAAAL5WZXJpZnkgYSBkaWNlIHJvbGwgd2l0aCBhIFpLIHByb29mIChmdWxsIEdyb3RoMTYgdmVyaWZpY2F0aW9uKS4KClRoaXMgdmVyc2lvbiBhZGRpdGlvbmFsbHkgdmVyaWZpZXMgYSBHcm90aDE2IHByb29mIHRoYXQgdGhlIGRpY2UKdmFsdWVzIHdlcmUgZ2VuZXJhdGVkIGNvcnJlY3RseSBhY2NvcmRpbmcgdG8gdGhlIGdhbWUgcnVsZXMuAAAAAAATdmVyaWZ5X2RpY2Vfcm9sbF96awAAAAAEAAAAAAAAAAVwcm9vZgAAAAAAB9AAAAAMR3JvdGgxNlByb29mAAAAAAAAAA1leHBlY3RlZF9yb290AAAAAAAD7gAAACAAAAAAAAAABWluZGV4AAAAAAAABAAAAAAAAAAPcmV2ZWFsZWRfdmFsdWVzAAAAB9AAAAAKRGljZVZhbHVlcwAAAAAAAQAAAAE=" ]),
      options
    )
  }
  public readonly fromJSON = {
    has_vk: this.txFromJSON<boolean>,
        set_vk: this.txFromJSON<null>,
        set_admin: this.txFromJSON<null>,
        verify_dice_roll: this.txFromJSON<boolean>,
        verify_fog_of_war: this.txFromJSON<boolean>,
        verify_dice_roll_zk: this.txFromJSON<boolean>
  }
}