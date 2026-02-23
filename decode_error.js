const { xdr } = require('@stellar/stellar-sdk');

const b64 = 'AAAAAAAAPRX////vAAAAAA==';
try {
    const result = xdr.TransactionResult.fromXDR(b64, 'base64');
    console.log('Result Code:', result.result().switch().name);
    console.log('Results:', JSON.stringify(result.result().results(), null, 2));
} catch (e) {
    console.error('Failed to decode as TransactionResult:', e.message);
    try {
        const res = xdr.TransactionResultMeta.fromXDR(b64, 'base64');
        console.log('Decoded as TransactionResultMeta');
    } catch (e2) {
        console.error('Failed to decode as TransactionResultMeta:', e2.message);
    }
}
