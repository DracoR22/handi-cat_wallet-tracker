import { MAX_FREE_WALLETS } from '../../constants/pricing'
import { WalletDetails } from '../../lib/wallet-details'
import { UserWallet } from '../../types/prisma-types'

export class ManageMessages {
  private walletDetails: WalletDetails
  constructor() {
    this.walletDetails = new WalletDetails()
  }

  public async sendManageMessage(userWallets: UserWallet[]) {
    // const s = await this.walletDetails.getWalletPNL('CwiiPtoSZTeiPXXa2U95NUFX8kVhKAqTNwqfDkXAqgRj')
    // console.log('DATA', s)
    const messageText = `
<b>Your wallets: ${userWallets.length} / ${MAX_FREE_WALLETS}</b>

✅ - Wallet is active
⏸️ - You paused this wallet
⏳ - Wallet was sending too many txs and is paused
🛑 - Renew PRO to continue tracking this wallet

${userWallets
  .map((wallet, i) => `✅ ${i + 1}. <code>${wallet.wallet.address}</code> ${wallet.name ? `(${wallet.name})` : ''}`)
  .join('\n\n')}
`

    return messageText
  }
}
