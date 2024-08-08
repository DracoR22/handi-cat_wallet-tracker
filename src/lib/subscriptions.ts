import { Keypair, PublicKey } from "@solana/web3.js";
import { UserBalances } from "./user-balances";
import { HOBBY_PLAN_FEE } from "../constants/pricing";

export class Subscriptions {
    private userBalances: UserBalances
    constructor() {
        this.userBalances = new UserBalances()
    }

    public async chargeSubscription(userWalletAddress: string) {
        const userPublicKey = new PublicKey(userWalletAddress)

        const balance = await this.userBalances.userPersonalSolBalance(userWalletAddress)

        if (balance === undefined) {
            console.log('USER_BALANCE_IS_UNDEFINED')
            return
        }

        if (balance >= HOBBY_PLAN_FEE) {

        }
    }

    private async getKeypairFromPrivateKey(base64PrivateKey: string) {
        const secretKey = Buffer.from(base64PrivateKey, 'base64');
        return Keypair.fromSecretKey(secretKey);
    }
}