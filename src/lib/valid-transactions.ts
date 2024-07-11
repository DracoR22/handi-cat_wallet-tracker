import { PublicKey } from "@solana/web3.js";
import { SwapType } from "../types/swap-types"

export class ValidTransactions {
    constructor(
        private pumpFunProgramId: PublicKey,
        private raydiumProgramId: PublicKey,
        private programIds: any
    ) {
        this.pumpFunProgramId = pumpFunProgramId
    }

    public getTransaction(): { valid: boolean, swap: SwapType } {
        const pumpFunTransaction = this.programIds && this.programIds.some((id: any) => id.equals(this.pumpFunProgramId));
        const raydiumTransaction = this.programIds && this.programIds.some((id: any) => id.equals(this.raydiumProgramId));

        if (pumpFunTransaction) {
            console.log('detected pumpfun transaction')
            return { valid: true, swap: 'PUMP FUN'};
        } else if (raydiumTransaction) {
            console.log('detected raydium transaction')
            return { valid: true, swap: 'RAYDIUM' }; 
        } else {
           return { valid: false, swap: null }
        }
    }
}