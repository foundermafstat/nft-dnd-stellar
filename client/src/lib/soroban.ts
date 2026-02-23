import { signTransaction } from '@stellar/freighter-api';
import {
    Address,
    Contract,
    TransactionBuilder,
    xdr,
    Networks,
    Memo,
    rpc,
    Keypair,
    nativeToScVal
} from '@stellar/stellar-sdk';
import { SERVER_URL } from './config';

const GAME_HUB_CONTRACT = 'CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG';
const ADVENTURE_VAULT_CONTRACT = "CCIIZ2MFPGV3SIRM3K2ZJFVPG6LMDCROTYUDTKI2GB6OHWZLRSSTGQ6J";

// Initialize Soroban RPC Server
const rpcServer = new rpc.Server("https://soroban-testnet.stellar.org");

export async function startGame(playerAddress: string): Promise<{ success: boolean; hash?: string; sessionId?: number; error?: string }> {
    try {
        const sourceAccount = await rpcServer.getAccount(playerAddress);
        const contract = new Contract(GAME_HUB_CONTRACT);
        const sessionId = Math.floor(Math.random() * 1000000);

        console.log("[startGame] Initializing Game Hub Contract:", GAME_HUB_CONTRACT);
        const dummyPlayer2 = Keypair.random().publicKey();
        console.log("[startGame] Session ID:", sessionId, "Player 1:", playerAddress, "Player 2 (dummy):", dummyPlayer2);

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "1000",
            networkPassphrase: Networks.TESTNET,
        })
            .addOperation(contract.call(
                'start_game',
                new Address(ADVENTURE_VAULT_CONTRACT).toScVal(), // game_id (our deployed contract)
                xdr.ScVal.scvU32(sessionId), // session_id
                new Address(playerAddress).toScVal(), // player1
                new Address(dummyPlayer2).toScVal(), // player2 (solo test)
                nativeToScVal(0, { type: 'i128' }), // player1_points mock (i128)
                nativeToScVal(0, { type: 'i128' }), // player2_points mock (i128)
            ))
            .addMemo(Memo.text('NFT-DND: Start Quest'))
            .setTimeout(30)
            .build();

        console.log("[startGame] Preparing transaction (Simulation)...");
        const preparedTx = await rpcServer.prepareTransaction(tx);
        console.log("[startGame] Prepared Tx XDR:", preparedTx.toXDR());

        console.log("[startGame] Sending to Freighter for signature...");
        const signResult: any = await signTransaction(preparedTx.toXDR(), { networkPassphrase: Networks.TESTNET });
        console.log("[startGame] Freighter Sign Result:", signResult);

        if (signResult.error) throw new Error(signResult.error);
        const signedXdr = typeof signResult === 'string' ? signResult : signResult.signedTxXdr;

        const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);

        console.log("[startGame] Submitting transaction to Soroban RPC...");
        const sendResponse = await rpcServer.sendTransaction(signedTx);
        console.log("[startGame] Send Response:", JSON.stringify(sendResponse, null, 2));

        if (sendResponse.status === 'ERROR') {
            console.error("[startGame] Detailed Send Error:", sendResponse);
            throw new Error(sendResponse.errorResult?.toXDR('base64') || JSON.stringify(sendResponse));
        }

        console.log("[startGame] Waiting for network confirmation, Hash:", sendResponse.hash);
        let txResponse = await rpcServer.getTransaction(sendResponse.hash);
        let retries = 0;
        while (txResponse.status === 'NOT_FOUND' && retries < 10) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            txResponse = await rpcServer.getTransaction(sendResponse.hash);
            retries++;
        }

        if (txResponse.status === 'SUCCESS') {
            return { success: true, hash: sendResponse.hash, sessionId };
        } else {
            return { success: false, error: 'Transaction failed on-chain.' };
        }

    } catch (error: any) {
        console.error('Error starting game:', error);
        return { success: false, error: error.message || 'Failed to start game' };
    }
}

export async function endGame(playerAddress: string, sessionId: number): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
        const sourceAccount = await rpcServer.getAccount(playerAddress);
        const contract = new Contract(GAME_HUB_CONTRACT);

        // Match ABI: end_game(session_id: u32, player1_won: bool)
        const tx = new TransactionBuilder(sourceAccount, {
            fee: "1000",
            networkPassphrase: Networks.TESTNET,
        })
            .addOperation(contract.call(
                'end_game',
                xdr.ScVal.scvU32(sessionId),
                xdr.ScVal.scvBool(true)
            ))
            .addMemo(Memo.text('NFT-DND: End Quest'))
            .setTimeout(30)
            .build();

        const preparedTx = await rpcServer.prepareTransaction(tx);
        const signResult: any = await signTransaction(preparedTx.toXDR(), { networkPassphrase: Networks.TESTNET });

        if (signResult.error) throw new Error(signResult.error);
        const signedXdr = typeof signResult === 'string' ? signResult : signResult.signedTxXdr;

        const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
        const sendResponse = await rpcServer.sendTransaction(signedTx);

        if (sendResponse.status === 'ERROR') {
            throw new Error(sendResponse.errorResult?.toXDR('base64') || 'Transaction failed');
        }

        let txResponse = await rpcServer.getTransaction(sendResponse.hash);
        let retries = 0;
        while (txResponse.status === 'NOT_FOUND' && retries < 10) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            txResponse = await rpcServer.getTransaction(sendResponse.hash);
            retries++;
        }

        if (txResponse.status === 'SUCCESS') {
            return { success: true, hash: sendResponse.hash };
        } else {
            return { success: false, error: 'Transaction failed on-chain.' };
        }

    } catch (error: any) {
        console.error('Error ending game:', error);
        return { success: false, error: error.message || 'Failed to end game' };
    }
}
