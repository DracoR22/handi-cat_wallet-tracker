import { BOT_USERNAME } from '../../constants/handi-cat'
import {
  HOBBY_PLAN_FEE,
  MAX_HOBBY_WALLETS,
  MAX_PRO_WALLETS,
  MAX_USER_GROUPS,
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
✅ Prevent wallet cleanups.
✅ Get access to <b>PREMIUM</b> features.

<b>Choose your plan:</b>
<b>HOBBY</b>: ${MAX_HOBBY_WALLETS} wallets - ${HOBBY_PLAN_FEE / 1e9} <b>SOL</b> / month 
<b>PRO</b>: ${MAX_PRO_WALLETS} wallets - ${PRO_PLAN_FEE / 1e9} <b>SOL</b> / month
<b>WHALE</b>: ${MAX_WHALE_WALLETS} wallets - ${WHALE_PLAN_FEE / 1e9} <b>SOL</b> / month

<b>How to upgrade your plan?</b>
1. Transfer the required <b>SOL</b> to your <b>Handi Cat</b> wallet: <code>${user?.personalWalletPubKey}</code>
2. Now you can select one of the plans below!
`

    return messageText
  }

  static groupChatNotPro = `
🚫 You can only add Handi Cat to a group if you have a <b>PRO</b> or a <b>WHALE</b> subscription.

You can upgrade your plan directly from our official bot:

@${BOT_USERNAME}
`

  static userUpgradeGroups = `
To add <b>Handi Cat</b> to Groups, you need a <b>PRO</b> or <b>WHALE</b> subscription

<b>Click the button below to upgrade your subscription and access to our exclusive features!</b>
`

  static userGroupsLimit = `
You’ve reached the maximum limit of groups you can add <b>(${MAX_USER_GROUPS}).</b> 
To add a new group, please remove an existing one.
`
}
