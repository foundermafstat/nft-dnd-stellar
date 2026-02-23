import { signTransaction } from '@stellar/freighter-api';
import {
    Address,
    Contract,
    TransactionBuilder,
    xdr,
    Networks,
    Memo,
    rpc
} from '@stellar/stellar-sdk';
import { SERVER_URL } from './config';

const GAME_HUB_CONTRACT = 'CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG';

// Initialize Soroban RPC Server
const rpcServer = new rpc.Server("https://soroban-testnet.stellar.org");

export async function startGame(playerAddress: string): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
        const sourceAccount = await rpcServer.getAccount(playerAddress);
        const contract = new Contract(GAME_HUB_CONTRACT);

        // Typical start_game invocation. Note: If the contract requires a fee or token transfer, 
        // the arguments might need to include a token address or an amount.
        // We will assume a simple start_game(player: Address) for the hackathon MVP.
        const tx = new TransactionBuilder(sourceAccount, {
            fee: "1000",
            networkPassphrase: Networks.TESTNET,
        })
            .addOperation(contract.call('start_game', new Address(playerAddress).toScVal()))
            .addMemo(Memo.text('NFT-DND: Start Quest'))
            .setTimeout(30)
            .build();

        const preparedTx = await rpcServer.prepareTransaction(tx);
        const signedXdr = await signTransaction(preparedTx.toXDR(), { networkPassphrase: Networks.TESTNET });

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
            return { success: true, hash: sendResponse.hash };
        } else {
            return { success: false, error: 'Transaction failed on-chain.' };
        }

    } catch (error: any) {
        console.error('Error starting game:', error);
        return { success: false, error: error.message || 'Failed to start game' };
    }
}

export async function endGame(playerAddress: string, score: number, zkProofHash: string): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
        const sourceAccount = await rpcServer.getAccount(playerAddress);
        const contract = new Contract(GAME_HUB_CONTRACT);

        // Assume end_game(player: Address, score: u32, zk_proof: String)
        const tx = new TransactionBuilder(sourceAccount, {
            fee: "1000",
            networkPassphrase: Networks.TESTNET,
        })
            .addOperation(contract.call(
                'end_game',
                new Address(playerAddress).toScVal(),
                xdr.ScVal.scvU32(score),
                xdr.ScVal.scvString(zkProofHash)
            ))
            .addMemo(Memo.text('NFT-DND: End Quest'))
            .setTimeout(30)
            .build();

        const preparedTx = await rpcServer.prepareTransaction(tx);
        const signedXdr = await signTransaction(preparedTx.toXDR(), { networkPassphrase: Networks.TESTNET });

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
