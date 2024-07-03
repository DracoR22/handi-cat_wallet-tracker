import { AccountInfo, PublicKey, SystemProgram } from "@solana/web3.js";
import { connection } from "../providers/solana";

export class Utils {
    constructor(
        private wallet: string
    ) {
        this.wallet = wallet
    }

    public async isSystemProgramAccount(): Promise<boolean> {
        try {
            const publicKey = new PublicKey(this.wallet)

            const accountInfo: AccountInfo<Buffer> | null = await connection.getAccountInfo(publicKey);
            if (accountInfo && accountInfo.owner.equals(SystemProgram.programId)) {
                return true;
            }
        } catch (error) {
            console.error('Error fetching account info:', error);
        }
        return false;
    }
}