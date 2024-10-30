import { PromotionType } from '@prisma/client'

export const HALLOWEEN_PROMOTION = {
  price: 0.1,
  type: PromotionType.UPGRADE_TO_50_WALLETS,
  description: 'Track up to 50 wallets life-time',
}
