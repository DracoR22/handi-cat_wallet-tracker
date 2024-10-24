import { User } from '@prisma/client'
import { UserBalances } from '../../lib/user-balances'

export class MyWalletMessages {
  private userBalances: UserBalances
  constructor() {
    this.userBalances = new UserBalances()
  }

  public async sendMyWalletMessage(
    wallet: Pick<User, 'personalWalletPrivKey' | 'personalWalletPubKey'>,
  ): Promise<string> {
    const solBalance = await this.userBalances.userPersonalSolBalance(wallet.personalWalletPubKey)

    const responseText = `
<b>Your wallet address:</b> 
<code>${wallet && wallet.personalWalletPubKey}</code>

<b>SOL:</b> ${solBalance ? solBalance / 1e9 : 0}

`

    return responseText
  }
}
