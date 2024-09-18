import TelegramBot from 'node-telegram-bot-api'
import { SUB_MENU, UPGRADE_PLAN_SUBMENU } from '../../config/bot-menus'
import { PublicKey } from '@solana/web3.js'
import { PrismaWalletRepository } from '../../repositories/prisma/wallet'
import { userExpectingWalletAddress } from '../../constants/flags'
import { TrackWallets } from '../../lib/track-wallets'
import { RateLimit } from '../../lib/rate-limit'
import { MAX_5_MIN_TXS_ALLOWED } from '../../constants/handi-cat'
import { AddWalletMessage } from '../messages/add-wallet-messages'
import { UserPlan } from '../../lib/user-plan'
import { PrismaUserRepository } from '../../repositories/prisma/user'
import { GeneralMessages } from '../messages/general-messages'

export class AddCommand {
  private prismaWalletRepository: PrismaWalletRepository
  private trackWallets: TrackWallets
  private rateLimit: RateLimit
  private addWalletMessage: AddWalletMessage
  private userPlan: UserPlan
  private generalMessages: GeneralMessages
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.prismaWalletRepository = new PrismaWalletRepository()

    this.trackWallets = new TrackWallets()
    this.rateLimit = new RateLimit()
    this.addWalletMessage = new AddWalletMessage()
    this.userPlan = new UserPlan()
    this.generalMessages = new GeneralMessages()
  }

  public addCommandHandler() {
    this.bot.onText(/\/add/, async (msg) => {
      const userId = msg.from?.id

      if (!userId) return

      this.add({ message: msg, isButton: false })
    })
  }

  public addButtonHandler(msg: TelegramBot.Message) {
    this.add({ message: msg, isButton: true })
  }

  private add({ message, isButton }: { message: TelegramBot.Message; isButton: boolean }) {
    const addMessage = this.addWalletMessage.sendAddWalletMessage()
    if (isButton) {
      this.bot.editMessageText(addMessage, {
        chat_id: message.chat.id,
        message_id: message.message_id,
        reply_markup: SUB_MENU,
        parse_mode: 'HTML',
      })
    } else if (!isButton) {
      this.bot.sendMessage(message.chat.id, addMessage, { reply_markup: SUB_MENU, parse_mode: 'HTML' })
    }

    const userId = message.chat.id.toString()

    userExpectingWalletAddress[Number(userId)] = true
    const listener = async (responseMsg: TelegramBot.Message) => {
      // Check if the user is expected to enter a wallet address
      if (!userExpectingWalletAddress[Number(userId)]) return

      const text = responseMsg.text
      const walletEntries = text
        ?.split('\n')
        .map((entry) => entry.trim())
        .filter(Boolean) // Split input by new lines, trim, and remove empty lines

      if (!walletEntries || walletEntries.length === 0) {
        this.bot.sendMessage(message.chat.id, 'No wallet addresses provided.')
        return
      }

      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

      for (const entry of walletEntries) {
        const [walletAddress, walletName] = entry.split(' ')

        // check if user can add a wallet inside their plan limits
        const planWallets = await this.userPlan.getUserPlanWallets(userId)
        const userWallets = await this.prismaWalletRepository.getUserWallets(userId)

        if (userWallets && userWallets.length >= planWallets) {
          return this.bot.sendMessage(
            message.chat.id,
            this.generalMessages.sendWalletLimitMessageError(walletName, walletAddress, planWallets),
            { parse_mode: 'HTML', reply_markup: UPGRADE_PLAN_SUBMENU },
          )
        }

        // Validate the wallet before pushing to the database
        const isValid =
          base58Regex.test(walletAddress as string) &&
          PublicKey.isOnCurve(new PublicKey(walletAddress as string).toBytes())

        if (!isValid) {
          this.bot.sendMessage(message.chat.id, `😾 Address provided is not a valid Solana wallet`)
          continue
        }

        // const latestWalletTxs = await this.rateLimit.last5MinutesTxs(walletAddress)

        // if (latestWalletTxs && latestWalletTxs >= MAX_5_MIN_TXS_ALLOWED) {
        //   this.bot.sendMessage(
        //     message.chat.id,
        //     `😾 Wallet ${walletAddress} is spamming too many transactions, try another wallet or try again later`,
        //   )
        //   continue
        // }

        const isWalletAlready = await this.prismaWalletRepository.getUserWalletById(userId, walletAddress)

        if (isWalletAlready) {
          this.bot.sendMessage(message.chat.id, `🙀 You already follow the wallet: ${walletAddress}`)
          continue
        }

        // Add wallet to the database
        await this.prismaWalletRepository.create(userId!, walletAddress!, walletName)

        this.bot.sendMessage(message.chat.id, `🎉 Wallet ${walletAddress} has been added.`)
      }

      // Remove the listener to avoid duplicate handling
      this.bot.removeListener('message', listener)

      // Reset the flag
      userExpectingWalletAddress[Number(userId)] = false
    }

    this.bot.once('message', listener)
  }
}
