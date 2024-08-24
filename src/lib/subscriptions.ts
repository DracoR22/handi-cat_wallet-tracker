import { Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { UserBalances } from './user-balances'
import { HOBBY_PLAN_FEE, PRO_PLAN_FEE, WHALE_PLAN_FEE } from '../constants/pricing'
import { HANDI_CAT_WALLET_ADDRESS } from '../constants/handi-cat'
import { connection } from '../providers/solana'
import { PrismaUserRepository } from '../repositories/prisma/user'
import { SubscriptionPlan, User, UserSubscription } from '@prisma/client'
import { PrismaSubscriptionRepository } from '../repositories/prisma/subscription'

interface UserWithSubscription {
  id: string
  personalWalletPubKey: string
  personalWalletPrivKey: string
  userSubscription: {
    plan: SubscriptionPlan
  }
}

export class Subscriptions {
  private userBalances: UserBalances
  private handiCatWallet: PublicKey

  private prismaUserRepository: PrismaUserRepository
  private prismaSubscriptionRepository: PrismaSubscriptionRepository
  constructor() {
    this.userBalances = new UserBalances()
    this.handiCatWallet = new PublicKey(HANDI_CAT_WALLET_ADDRESS ?? '')

    this.prismaUserRepository = new PrismaUserRepository()
    this.prismaSubscriptionRepository = new PrismaSubscriptionRepository()
  }

  public async chargeSubscription(
    user: Pick<User, 'id' | 'personalWalletPubKey' | 'personalWalletPrivKey'>,
    plan: SubscriptionPlan,
  ) {
    const userPublicKey = new PublicKey(user.personalWalletPubKey)
    const balance = await this.userBalances.userPersonalSolBalance(user.personalWalletPubKey)

    if (balance === undefined) {
      console.log('no user balance fetched')
      return
    }

    const planFees: { [key: string]: number } = {
      HOBBY: HOBBY_PLAN_FEE,
      PRO: PRO_PLAN_FEE,
      WHALE: WHALE_PLAN_FEE,
    }

    const planFee = planFees[plan]

    if (planFee === undefined) {
      console.log('invalid plan')
      return
    }
    console.log(planFee)

    if (balance >= planFee) {
      try {
        const transaction = await this.createSubscriptionTransaction(userPublicKey, planFee)
        const userKeypair = await this.getKeypairFromPrivateKey(user.personalWalletPrivKey)
        console.log('USER_PAIR', userKeypair)

        // Sign and send the transaction
        let signature = await connection.sendTransaction(transaction, [userKeypair])
        console.log('Transaction signature:', signature)

        await this.prismaSubscriptionRepository.updateUserSubscription(user.id, plan)

        return signature
      } catch (error) {
        console.log('TRANSACTION_FAILED', error)
        return
      }
    }

    console.log('INSUFFICIENT_FUNDS')
    await this.prismaSubscriptionRepository.updateUserSubscription(user.id, 'FREE')
    return
  }

  private async createSubscriptionTransaction(userPublicKey: PublicKey, planFee: number) {
    let transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: this.handiCatWallet,
        lamports: planFee, // Amount in lamports (1 SOL = 1e9 lamports)
      }),
    )
    return transaction
  }

  private async getKeypairFromPrivateKey(base64PrivateKey: string) {
    const secretKey = Buffer.from(base64PrivateKey, 'base64')
    return Keypair.fromSecretKey(secretKey)
  }
}
