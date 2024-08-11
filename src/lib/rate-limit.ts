import { PublicKey } from "@solana/web3.js";
import { connection } from "../providers/solana";

export class RateLimit {
    constructor() {}

    public async last5MinutesTxs(walletAddress: string) {
        const currentTime = Date.now();

        // Calculate the time 5 minutes ago
        const fiveMinutesAgo = currentTime - (5 * 60 * 1000);
      
        // Fetch recent transaction signatures for the given wallet
        const signatures = await connection.getSignaturesForAddress(new PublicKey(walletAddress));
      
        // Filter the transactions that occurred in the last 5 minutes
        const recentTransactions = signatures.filter(signatureInfo => {
            const transactionTime = signatureInfo.blockTime! * 1000; // Convert seconds to milliseconds
            return transactionTime >= fiveMinutesAgo;
        });
      
        // Return the number of transactions in the last 5 minutes
        return recentTransactions.length;
    }
}