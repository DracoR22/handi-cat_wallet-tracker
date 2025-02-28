import { Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { UserBalances } from './user-balances'
import { HOBBY_PLAN_FEE, PRO_PLAN_FEE, SOURCE_CODE_PRICE, WHALE_PLAN_FEE } from '../constants/pricing'
import { HANDI_CAT_WALLET_ADDRESS } from '../constants/handi-cat'
import { RpcConnectionManager } from '../providers/solana'
import { PrismaUserRepository } from '../repositories/prisma/user'
import { PromotionType, SubscriptionPlan, User, UserSubscription } from '@prisma/client'
import { PrismaSubscriptionRepository } from '../repositories/prisma/subscription'
import { PaymentsMessageEnum } from '../types/messages-types'
import { format } from 'date-fns'
import { GeneralMessages } from '../bot/messages/general-messages'
import { PrismaGroupRepository } from '../repositories/prisma/group'

export class Payments {
  private userBalances: UserBalances
  private handiCatWallet: PublicKey

  private prismaUserRepository: PrismaUserRepository
  private prismaSubscriptionRepository: PrismaSubscriptionRepository
  private prismaGroupRepository: PrismaGroupRepository
  constructor() {
    this.userBalances = new UserBalances()
    this.handiCatWallet = new PublicKey(HANDI_CAT_WALLET_ADDRESS ?? '')

    this.prismaUserRepository = new PrismaUserRepository()
    this.prismaSubscriptionRepository = new PrismaSubscriptionRepository()
    this.prismaGroupRepository = new PrismaGroupRepository()
  }

  public async chargeSubscription(
    userId: string,
    plan: SubscriptionPlan,
    shouldRecharge: boolean = false,
  ): Promise<{ success: boolean; message: PaymentsMessageEnum; subscriptionEnd: string | null }> {
    const user = await this.prismaUserRepository.getById(userId)

    if (!user) {
      return { success: false, message: PaymentsMessageEnum.NO_USER_FOUND, subscriptionEnd: null }
    }

    // manually downgrade subscription if there is 0 balance in the wallet for now
    if (user.userSubscription && user.userSubscription.plan === plan && shouldRecharge) {
      return { success: false, message: PaymentsMessageEnum.USER_ALREADY_PAID, subscriptionEnd: null }
    }

    const userPublicKey = new PublicKey(user.personalWalletPubKey)
    const balance = await this.userBalances.userPersonalSolBalance(user.personalWalletPubKey)
    console.log('BALANCE:', balance)
    if (!balance) {
      return { success: false, message: PaymentsMessageEnum.INSUFFICIENT_BALANCE, subscriptionEnd: null }
    }

    const planFees: { [key: string]: number } = {
      HOBBY: HOBBY_PLAN_FEE,
      PRO: PRO_PLAN_FEE,
      WHALE: WHALE_PLAN_FEE,
    }

    const planFee = planFees[plan]

    if (!planFee) {
      return { success: false, message: PaymentsMessageEnum.INVALID_PLAN, subscriptionEnd: null }
    }
    console.log(planFee)

    if (balance >= planFee) {
      try {
        const transaction = await this.createTransaction(userPublicKey, planFee)
        const userKeypair = await this.getKeypairFromPrivateKey(user.personalWalletPrivKey)
        // console.log('USER_PAIR', userKeypair)

        // Sign and send the transaction
        let signature = await RpcConnectionManager.connections[0].sendTransaction(transaction, [userKeypair])
        console.log('Transaction signature:', signature)

        const subscription = await this.prismaSubscriptionRepository.updateUserSubscription(user.id, plan)

        const parsedDate = format(subscription.subscriptionCurrentPeriodEnd!, 'MM/dd/yyyy')

        // resume paused group wallets
        await this.prismaGroupRepository.updateUserGroupStatus(userId)

        return { success: true, message: PaymentsMessageEnum.PLAN_UPGRADED, subscriptionEnd: parsedDate }
      } catch (error) {
        console.log('ERROR', error)
        return { success: false, message: PaymentsMessageEnum.INTERNAL_ERROR, subscriptionEnd: null }
      }
    }

    const currentSubscription = user.userSubscription?.plan
    const subscriptionExpired = user.userSubscription?.subscriptionCurrentPeriodEnd

    const today = new Date()

    // create a free subscription if balance is less than amount or if subscription expired
    if (!currentSubscription || (subscriptionExpired && new Date(subscriptionExpired) <= today)) {
      await Promise.all([
        this.prismaSubscriptionRepository.updateUserSubscription(user.id, 'FREE'),
        this.prismaGroupRepository.updateUserGroupStatus(userId),
      ])
    }
    return { success: false, message: PaymentsMessageEnum.INSUFFICIENT_BALANCE, subscriptionEnd: null }
  }

  public async chargeDonation(
    userId: string,
    donationAmt: number,
  ): Promise<{ success: boolean; message: PaymentsMessageEnum }> {
    const user = await this.prismaUserRepository.getById(userId)

    if (!user) {
      return { success: false, message: PaymentsMessageEnum.NO_USER_FOUND }
    }

    const userPublicKey = new PublicKey(user.personalWalletPubKey)
    const balance = await this.userBalances.userPersonalSolBalance(user.personalWalletPubKey)

    console.log('BALANCE:', balance)

    if (balance === undefined) {
      return { success: false, message: PaymentsMessageEnum.INSUFFICIENT_BALANCE }
    }

    if (balance >= donationAmt) {
      try {
        const transaction = await this.createTransaction(userPublicKey, donationAmt * 1e9)
        const userKeypair = await this.getKeypairFromPrivateKey(user.personalWalletPrivKey)
        // console.log('USER_PAIR', userKeypair)

        // Sign and send the transaction
        let signature = await RpcConnectionManager.connections[0].sendTransaction(transaction, [userKeypair])
        console.log('Transaction signature:', signature)

        await this.prismaUserRepository.hasDonated(userId)

        return { success: true, message: PaymentsMessageEnum.DONATION_MADE }
      } catch (error) {
        console.log('ERROR', error)
        return { success: false, message: PaymentsMessageEnum.INTERNAL_ERROR }
      }
    }

    console.log('BALANCE BELOW AMT', donationAmt * 1e9)
    return { success: false, message: PaymentsMessageEnum.INSUFFICIENT_BALANCE }
  }

  public async chargePromotion(
    userId: string,
    promotionAmt: number,
    promotionType: PromotionType,
  ): Promise<{ success: boolean; message: PaymentsMessageEnum }> {
    const user = await this.prismaUserRepository.getById(userId)

    if (!user) {
      return { success: false, message: PaymentsMessageEnum.NO_USER_FOUND }
    }

    const userPublicKey = new PublicKey(user.personalWalletPubKey)
    const balance = await this.userBalances.userPersonalSolBalance(user.personalWalletPubKey)

    console.log('BALANCE:', balance)

    if (balance === undefined) {
      return { success: false, message: PaymentsMessageEnum.INSUFFICIENT_BALANCE }
    }

    if (balance >= promotionAmt) {
      try {
        const transaction = await this.createTransaction(userPublicKey, promotionAmt * 1e9)
        const userKeypair = await this.getKeypairFromPrivateKey(user.personalWalletPrivKey)
        // console.log('USER_PAIR', userKeypair)

        // Sign and send the transaction
        let signature = await RpcConnectionManager.connections[0].sendTransaction(transaction, [userKeypair])
        console.log('Transaction signature:', signature)

        const { message: promMessage, success } = await this.prismaSubscriptionRepository.buyPromotion(
          userId,
          promotionType,
        )

        if (promMessage === 'Non-stackable promotion already purchased') {
          return { success: false, message: PaymentsMessageEnum.USER_ALREADY_PAID }
        }

        return { success: true, message: PaymentsMessageEnum.TRANSACTION_SUCCESS }
      } catch (error) {
        console.log('ERROR', error)
        return { success: false, message: PaymentsMessageEnum.INTERNAL_ERROR }
      }
    }

    console.log('BALANCE BELOW AMT', promotionAmt * 1e9)
    return { success: false, message: PaymentsMessageEnum.INSUFFICIENT_BALANCE }
  }

  private async createTransaction(userPublicKey: PublicKey, fee: number) {
    let transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: this.handiCatWallet,
        lamports: fee, // Amount in lamports (1 SOL = 1e9 lamports)
      }),
    )
    return transaction
  }

  private async getKeypairFromPrivateKey(base64PrivateKey: string) {
    const secretKey = Buffer.from(base64PrivateKey, 'base64')
    return Keypair.fromSecretKey(secretKey)
  }
}
