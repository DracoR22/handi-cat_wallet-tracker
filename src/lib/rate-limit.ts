import { PublicKey } from "@solana/web3.js";
import { connection } from "../providers/solana";
import { SubscriptionPlan } from "@prisma/client";
import { MAX_FREE_DAILY_MESSAGES } from "../constants/pricing";

export class RateLimit {
    constructor() {}

    public async last5MinutesTxs(walletAddress: string) {
        const currentTime = Date.now();

        // Calculate the time 5 minutes ago
        const fiveMinutesAgo = currentTime - (5 * 60 * 1000);
      
        // Fetch recent transaction signatures for the given wallet
        const signatures = await connection.getSignaturesForAddress(new PublicKey(walletAddress), { limit: 55 });
      
        // Filter the transactions that occurred in the last 5 minutes
        const recentTransactions = signatures.filter(signatureInfo => {
            const transactionTime = signatureInfo.blockTime! * 1000; // Convert seconds to milliseconds
            return transactionTime >= fiveMinutesAgo;
        });
      
        // Return the number of transactions in the last 5 minutes
        return recentTransactions.length;
    }

    public async dailyMessageLimit(messagesToday: number, userPlan: SubscriptionPlan) {
      if (userPlan === 'FREE' && messagesToday >= MAX_FREE_DAILY_MESSAGES) {
        return { dailyLimitReached: true }
      }
    }
}