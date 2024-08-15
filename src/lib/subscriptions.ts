import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { UserBalances } from "./user-balances";
import { HOBBY_PLAN_FEE } from "../constants/pricing";
import { HANDI_CAT_WALLET_ADDRESS } from "../constants/handi-cat";
import { connection } from "../providers/solana";

export class Subscriptions {
    private userBalances: UserBalances
    private handiCatWallet: PublicKey;
    constructor() {
        this.userBalances = new UserBalances()
        this.handiCatWallet = new PublicKey(HANDI_CAT_WALLET_ADDRESS ?? '')
    }

    public async chargeSubscription(userWalletAddress: string, userPrivateKey: string) {
        const userPublicKey = new PublicKey(userWalletAddress)
        const balance = await this.userBalances.userPersonalSolBalance(userWalletAddress)

        if (balance === undefined) {
            console.log('USER_BALANCE_IS_UNDEFINED')
            return
        }

        if (balance >= HOBBY_PLAN_FEE) {
           try {
            const transaction = await this.createSubscriptionTransaction(userPublicKey);
            const userKeypair = await this.getKeypairFromPrivateKey(userPrivateKey);
            console.log('USER_PAIR', userKeypair)

            // Sign and send the transaction
            let signature = await connection.sendTransaction(transaction, [userKeypair]);
            console.log('Transaction signature:', signature);

            return signature
           } catch (error) {
            console.log('TRANSACTION_FAILED', error);
            return
           }
        }

        console.log('INSUFFICIENT_FUNDS');
        return
    }

    private async createSubscriptionTransaction(userPublicKey: PublicKey) {
        let transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: this.handiCatWallet,
                lamports: HOBBY_PLAN_FEE, // Amount in lamports (1 SOL = 1e9 lamports)
            })
        );
        return transaction;
    }

    private async getKeypairFromPrivateKey(base64PrivateKey: string) {
        const secretKey = Buffer.from(base64PrivateKey, 'base64');
        return Keypair.fromSecretKey(secretKey);
    }
}