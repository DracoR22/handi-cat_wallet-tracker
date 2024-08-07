import { User } from "@prisma/client"
import { UserBalances } from "../../lib/user-balances"
import { TokenUtils } from "../../lib/token-utils"

export class MyWalletMessages {
    private userBalances: UserBalances
    private tokenUtils: TokenUtils
    constructor() {
        this.userBalances = new UserBalances()
        this.tokenUtils = new TokenUtils()
    }

    public async sendMyWalletMessage(wallet: Pick<User, 'personalWallet'>): Promise<string> {
        const solBalance = await this.userBalances.userPersonalSolBalance(wallet.personalWallet)
     
        // const solPrice = await this.tokenUtils.getSolPriceNative()

        // const solBalanceInUSD = Number(solBalance) * Number(solPrice)

        const responseText = `
<b>Your wallet address:</b> 
<code>${wallet && wallet.personalWallet}</code>

<b>SOL:</b> ${solBalance ? solBalance : 0}

`

return responseText
    }
}