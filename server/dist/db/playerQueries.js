"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertPlayerByWallet = upsertPlayerByWallet;
const supabase_1 = require("../db/supabase");
async function upsertPlayerByWallet(walletAddress) {
    const { data, error } = await supabase_1.supabase
        .from('players')
        .upsert({
        wallet_address: walletAddress,
        last_login: new Date().toISOString()
    }, { onConflict: 'wallet_address' })
        .select()
        .single();
    if (error) {
        console.error('Error upserting player:', error);
        throw error;
    }
    return data;
}
