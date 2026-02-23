import { signTransaction } from '@stellar/freighter-api';
import {
    Address,
    Contract,
    TransactionBuilder,
    xdr,
    Networks,
    Memo,
    rpc,
    Keypair
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

        const dummyPlayer2 = Keypair.random().publicKey();

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
                xdr.ScVal.scvI128(new xdr.Int128Parts({ hi: xdr.Int64.fromString("0"), lo: xdr.Uint64.fromString("0") })),
                xdr.ScVal.scvI128(new xdr.Int128Parts({ hi: xdr.Int64.fromString("0"), lo: xdr.Uint64.fromString("0") })),
            ))
            .addMemo(Memo.text('NFT-DND: Start Quest'))
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

        // Wait for confirmation
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
