import TelegramBot from 'node-telegram-bot-api'
import { PrismaWalletRepository } from '../../repositories/prisma/wallet'
import { SUB_MENU } from '../../config/bot-menus'
import { PublicKey } from '@solana/web3.js'
import { TrackWallets } from '../../lib/track-wallets'
import { userExpectingWalletAddress } from '../../constants/flags'
import { WalletMessages } from '../messages/wallet-messages'
import { BotMiddleware } from '../../config/bot-middleware'

export class DeleteCommand {
  private prismaWalletRepository: PrismaWalletRepository
  private trackWallets: TrackWallets
  constructor(private bot: TelegramBot) {
    this.bot = bot
    this.prismaWalletRepository = new PrismaWalletRepository()
    this.trackWallets = new TrackWallets()
  }

  public deleteCommandHandler() {
    this.bot.onText(/\/delete/, async (msg) => {
      const userId = msg.from?.id
      const chatId = msg.chat.id

      if (!userId) return

      // check for group chats
      const groupValidationResult = await BotMiddleware.checkGroupChatRequirements(chatId, String(userId))

      if (!groupValidationResult.isValid) {
        return this.bot.sendMessage(chatId, groupValidationResult.message, {
          parse_mode: 'HTML',
        })
      }

      this.delete({ message: msg, isButton: false })
    })
  }

  public deleteButtonHandler(msg: TelegramBot.Message) {
    this.delete({ message: msg, isButton: true })
  }

  private delete({ message, isButton }: { message: TelegramBot.Message; isButton: boolean }) {
    this.bot.removeAllListeners('message')

    const deleteMessage = WalletMessages.deleteWalletMessage
    if (isButton) {
      this.bot.editMessageText(deleteMessage, {
        chat_id: message.chat.id,
        message_id: message.message_id,
        reply_markup: BotMiddleware.isGroup(message.chat.id) ? undefined : SUB_MENU,
        parse_mode: 'HTML',
      })
    } else if (!isButton) {
      this.bot.sendMessage(message.chat.id, deleteMessage, {
        reply_markup: BotMiddleware.isGroup(message.chat.id) ? undefined : SUB_MENU,
        parse_mode: 'HTML',
      })
    }

    const userId = message.chat.id.toString()

    userExpectingWalletAddress[Number(userId)] = true
    const listener = async (responseMsg: TelegramBot.Message) => {
      if (responseMsg.text?.startsWith('/')) {
        userExpectingWalletAddress[Number(userId)] = false
        return
      }

      if (!userExpectingWalletAddress[Number(userId)]) return

      const walletAddresses = responseMsg.text
        ?.split('\n')
        .map((addr) => addr.trim())
        .filter(Boolean) // Split input by new lines, trim, and remove empty lines

      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

      let deletedCount = 0
      const failedAddresses: string[] = [] // Track failed deletions

      for (const walletAddress of walletAddresses!) {
        // Validate each wallet address before using it in the database
        const isValid = base58Regex.test(walletAddress) && PublicKey.isOnCurve(new PublicKey(walletAddress).toBytes())

        if (!isValid) {
          this.bot.sendMessage(message.chat.id, `Address ${walletAddress} is not a valid Solana wallet`)
          continue
        }

        const deletedAddress = await this.prismaWalletRepository.deleteWallet(userId, walletAddress)

        if (!deletedAddress?.walletId) {
          this.bot.sendMessage(message.chat.id, `You're not tracking the wallet: ${walletAddress}`)
          continue
        }

        await this.trackWallets.setupWalletWatcher({ event: 'delete', walletId: deletedAddress.walletId })

        deletedCount++
      }

      if (deletedCount > 0) {
        this.bot.sendMessage(
          message.chat.id,
          `🐱 ${deletedCount} ${deletedCount < 2 ? `wallet has been succesfully deleted!` : `wallets have succesfully been deleted!`} you will no longer get notifications for ${deletedCount < 2 ? `this wallet` : `these wallets`}`,
          { reply_markup: BotMiddleware.isGroup(message.chat.id) ? undefined : SUB_MENU },
        )
      }

      this.bot.removeListener('message', listener)

      // Reset the flag
      userExpectingWalletAddress[Number(userId)] = false
    }

    this.bot.once('message', listener)
  }
}
