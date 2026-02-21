"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToIPFS = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
// Parse Filebase IPFS API Key (format usually KEY:SECRET:BUCKET or just KEY:SECRET)
const ipfsApiKey = process.env.IPFS_API_KEY || '';
const decodedKey = Buffer.from(ipfsApiKey, 'base64').toString('ascii');
const [accessKeyId, secretAccessKey, defaultBucket = 'nft-dnd-assets'] = decodedKey.split(':');
const s3Client = new client_s3_1.S3Client({
    endpoint: 'https://s3.filebase.com',
    region: 'us-east-1',
    credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || ''
    }
});
const uploadToIPFS = async (fileBuffer, fileName, contentType) => {
    try {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: defaultBucket,
            Key: fileName,
            Body: fileBuffer,
            ContentType: contentType,
        });
        await s3Client.send(command);
        // Filebase specific: you can fetch the IPFS CID from the object headers or use the gateway
        const gatewayUrl = `https://ipfs.filebase.io/ipfs/`; // You usually need the CID to form the full URL
        // However, Filebase automatically pins the object. To get the CID, you can HEAD the object, 
        // or just return the standard S3 URL for now, or expect Filebase to return it in the ETag.
        return {
            success: true,
            fileName,
            message: 'Successfully uploaded to IPFS via Filebase S3'
        };
    }
    catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw error;
    }
};
exports.uploadToIPFS = uploadToIPFS;
