import { MAX_FREE_WALLETS } from '../../constants/pricing'
import { WalletDetails } from '../../lib/wallet-details'
import { UserWallet } from '../../types/prisma-types'

export class ManageMessages {
  private walletDetails: WalletDetails
  constructor() {
    this.walletDetails = new WalletDetails()
  }

  public async sendManageMessage(userWallets: UserWallet[], walletsAmt: number) {
    // const s = await this.walletDetails.getWalletPNL('CwiiPtoSZTeiPXXa2U95NUFX8kVhKAqTNwqfDkXAqgRj')
    // console.log('DATA', s)
    const messageText = `
<b>Your wallets: ${userWallets.length} / ${walletsAmt}</b>

✅ - Wallet is active
⏸️ - You paused this wallet
⏳ - Wallet was sending too many txs and is paused
🛑 - Renew PRO to continue tracking this wallet

${userWallets
  .map((wallet, i) => {
    const icon =
      wallet.status === 'ACTIVE'
        ? '✅'
        : wallet.status === 'USER_PAUSED'
          ? '⏸️'
          : wallet.status === 'SPAM_PAUSED'
            ? '⏳'
            : wallet.status === 'BANNED'
              ? '🛑'
              : ''
    return `${icon} ${i + 1}. <code>${wallet.wallet.address}</code> ${wallet.name ? `(${wallet.name})` : ''}`
  })
  .join('\n\n')}
`

    return messageText
  }
}
