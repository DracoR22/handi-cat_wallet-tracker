import { SubscriptionPlan } from '@prisma/client'
import { MAX_FREE_WALLETS, MAX_HOBBY_WALLETS, MAX_PRO_WALLETS, MAX_WHALE_WALLETS } from '../../constants/pricing'

export class GeneralMessages {
  constructor() {}

  public sendStartMessage(): string {
    const promText = `
🎉 <b>LIMITED-TIME OFFER (24hrs)</b>🎉
For a <b>One-Time</b> payment of only <b>0.1 SOL</b>, track up to <b>**50 wallets LIFETIME**</b>

Don’t miss out on this exclusive deal to supercharge your wallet tracking without any monthly subscriptions!
`
    const messageText = `
🐱 Handi Cat | Wallet Tracker

Get real time activity notifications for any wallet you add!

You can track up to ${MAX_FREE_WALLETS} wallets for free ✨

👑 Upgrade to track up to <b>${MAX_WHALE_WALLETS}</b> wallets with a <b>LIFETIME</b> plan!  
No recurring fees — pay once, and enjoy forever. 🐾
`

    return messageText
  }

  public sendPlanUpgradedMessage(plan: SubscriptionPlan, subscriptionEnd: string): string {
    const planWallets: { [key: string]: number } = {
      HOBBY: MAX_HOBBY_WALLETS,
      PRO: MAX_PRO_WALLETS,
      WHALE: MAX_WHALE_WALLETS,
    }

    const planWallet = planWallets[plan]

    const messageText = `
😸 Success! Your plan has been upgraded to <b>${plan}</b>.

You can now track up to <b>${planWallet}</b> wallets at the time!
`

    return messageText
  }

  public sendInsufficientBalanceMessage(): string {
    const messageText = `
😿 Ooops it seems that you don't have sufficient balance to perform this transaction.

You can try by adding some <b>SOL</b> to your Handi Cat personal wallet 😺
`

    return messageText
  }

  public sendUserAlreadyPaidMessage(action: 'CODE' | 'PLAN'): string {
    const messageText = `
🤝 You already purchased this ${action.toLowerCase()} 
`

    return messageText
  }

  public sendWalletLimitMessageError(
    walletName: string | undefined,
    walletAddress: string,
    planWallets: number,
  ): string {
    const messageText = `
😾 Could not add wallet: <code>${walletName ? walletName : walletAddress}</code>, 

Wallet limit reached: <b>${planWallets}</b>

You can try by upgrading your <b>plan</b> for more wallets 💎
`

    return messageText
  }

  public sendGeneralMessageError(): string {
    const messageText = `
😿 Ooops it seems that something went wrong while processing the transaction.

You probaly don't have sufficient balance in your wallet

Maybe try adding some <b>SOL</b> to your Handi Cat personal wallet 😺
`

    return messageText
  }

  public sendBotWalletError(): string {
    const messageText = `
😿 Oops! it seems that this wallet has been banned due to too many tps
`

    return messageText
  }
}
