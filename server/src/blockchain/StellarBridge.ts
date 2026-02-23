import { ChronicleEntry } from 'shared';
import crypto from 'crypto';

const ENABLE_BLOCKCHAIN = process.env.ENABLE_BLOCKCHAIN === 'true';

/**
 * StellarBridge serves as the interface between the game server and the 
 * Soroban 'adventure_vault' smart contract.
 * 
 * It manages the required on-chain transactions using the Oracle keypair.
 */
export class StellarBridge {

    /**
     * Hashes a ChronicleEntry for on-chain commitment.
     * Uses SHA-256 to create a 32-byte hash.
     */
    public hashChronicleEntry(entry: Omit<ChronicleEntry, 'id' | 'created_at' | 'on_chain_hash'>): string {
        const data = `${entry.session_id}:${entry.location_id}:${entry.quest_id}:${entry.event_type}:${entry.narrative}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Initializes a new adventure session on the blockchain.
     * Maps to: AdventureVault.init_adventure()
     */
    public async initAdventureOnChain(players: string[], merkleRoots: string[], oracleRoot: string, fee: number = 0): Promise<boolean> {
        if (!ENABLE_BLOCKCHAIN) {
            console.log(`[StellarBridge] (Mock) Initialized adventure with ${players.length} players. Fee: ${fee}`);
            return true;
        }

        try {
            // TODO: Import soroban-client and stellar-sdk, initialize contract, sign with Oracle KP
            // const contract = new Contract(process.env.ADVENTURE_VAULT_ADDRESS!);
            // const tx = await contract.invoke('init_adventure', [players, merkleRoots, oracleRoot, fee]);
            // await tx.signAndSend();
            console.log(`[StellarBridge] initAdventureOnChain not fully implemented yet.`);
            return true;
        } catch (error) {
            console.error('[StellarBridge] Failed to init adventure:', error);
            return false;
        }
    }

    /**
     * Submits an action or narrative event to the blockchain.
     * Maps to: AdventureVault.submit_action()
     * 
     * We use this to commit narrative branching decisions (Chronicles).
     */
    public async submitActionOnChain(sessionId: number, playerAddress: string, actionIndex: number, actionHash: string): Promise<boolean> {
        if (!ENABLE_BLOCKCHAIN) {
            console.log(`[StellarBridge] (Mock) Submitted action #${actionIndex} for session ${sessionId}. Hash: ${actionHash}`);
            return true;
        }

        try {
            // TODO: soroban invoke submit_action
            return true;
        } catch (error) {
            console.error('[StellarBridge] Failed to submit action:', error);
            return false;
        }
    }

    /**
     * Ends an adventure session, distributing rewards and minting relic NFTs.
     * Maps to: AdventureVault.end_adventure()
     */
    public async endAdventureOnChain(sessionId: number, success: boolean, dndReward: number): Promise<boolean> {
        if (!ENABLE_BLOCKCHAIN) {
            console.log(`[StellarBridge] (Mock) Ended session ${sessionId}. Success: ${success}, Reward: ${dndReward}`);
            return true;
        }

        try {
            // TODO: soroban invoke end_adventure
            return true;
        } catch (error) {
            console.error('[StellarBridge] Failed to end adventure:', error);
            return false;
        }
    }
}

export const stellarBridge = new StellarBridge();
