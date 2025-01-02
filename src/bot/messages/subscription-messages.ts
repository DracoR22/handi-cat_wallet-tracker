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

<b>By upgrading to any plan, you can:</b>

✅ Track more wallets to expand your monitoring capabilities.
✅ Prevent wallet cleanups, ensuring your tracked wallets stay secure and uninterrupted.

<b>Choose a plan:</b>

<b>HOBBY</b>: ${MAX_HOBBY_WALLETS} wallets - ${HOBBY_PLAN_FEE / 1e9} <b>SOL</b> / month 
<b>PRO</b>: ${MAX_PRO_WALLETS} wallets - ${PRO_PLAN_FEE / 1e9} <b>SOL</b> / month
<b>WHALE</b>: ${MAX_WHALE_WALLETS} wallets - ${WHALE_PLAN_FEE / 1e9} <b>SOL</b> / month

How to upgrade your plan?

1. Transfer the required <b>SOL</b> to your <b>Handi Cat</b> wallet: <code>${user?.personalWalletPubKey}</code>
2. Now you can select one of the plans below!
`

    return messageText
  }
}
