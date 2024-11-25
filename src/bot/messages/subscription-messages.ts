import {
  HOBBY_PLAN_FEE,
  MAX_HOBBY_WALLETS,
  MAX_PRO_WALLETS,
  MAX_WHALE_WALLETS,
  PRO_PLAN_FEE,
  WHALE_PLAN_FEE,
} from '../../constants/pricing'
import { UserWithSubscriptionPlan } from '../../types/prisma-types'

export class SubscriptionMessages {
  constructor() {}

  static upgradeProMessage(user: UserWithSubscriptionPlan | null): string {
    const subscriptionExists = user?.userSubscription ? true : false

    const subscriptionPlan = subscriptionExists ? user?.userSubscription?.plan : 'FREE'

    const messageText = `
Current plan: ${subscriptionPlan === 'FREE' ? `😿 <b>${subscriptionPlan}</b>` : `😺 <b>${subscriptionPlan}</b>`}

⚠️ <b>Important:</b> Plans are <b>one-time payments</b> for <b>lifetime access</b>. There are <u>no recurring fees</u>.

These are the plans available:

<b>HOBBY</b>: ${MAX_HOBBY_WALLETS} <b>LIFETIME</b> wallets - ${HOBBY_PLAN_FEE / 1e9} <b>SOL</b> 
<b>PRO</b>: ${MAX_PRO_WALLETS} <b>LIFETIME</b> wallets - ${PRO_PLAN_FEE / 1e9} <b>SOL</b> 
<b>WHALE</b>: ${MAX_WHALE_WALLETS} <b>LIFETIME</b> wallets - ${WHALE_PLAN_FEE / 1e9} <b>SOL</b> 

How can you upgrade your plan?

1. Transfer the required <b>SOL</b> to your <b>Handi Cat</b> wallet: <code>${user?.personalWalletPubKey}</code>
2. Now you can select one of the plans below!
`

    return messageText
  }
}
