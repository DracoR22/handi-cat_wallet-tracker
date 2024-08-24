import TelegramBot from 'node-telegram-bot-api'
import { PrismaWalletRepository } from '../../repositories/prisma/wallet'
import { DeleteWalletMessage } from '../messages/delete-wallet-message'
import { SUB_MENU } from '../../config/bot-menus'
import { PublicKey } from '@solana/web3.js'
import { TrackWallets } from '../../lib/track-wallets'

export class DeleteCommand {
  private prismaWalletRepository: PrismaWalletRepository
  private deleteWalletMessage: DeleteWalletMessage
  private trackWallets: TrackWallets
  constructor(private bot: TelegramBot) {
    this.bot = bot
    this.prismaWalletRepository = new PrismaWalletRepository()
    this.deleteWalletMessage = new DeleteWalletMessage()
    this.trackWallets = new TrackWallets()
  }

  public deleteCommandHandler() {
    this.bot.onText(/\/delete/, async (msg) => {
      const userId = msg.from?.id

      if (!userId) return

      this.delete({ message: msg, isButton: false })
    })
  }

  public deleteButtonHandler(msg: TelegramBot.Message) {
    this.delete({ message: msg, isButton: true })
  }

  private delete({ message, isButton }: { message: TelegramBot.Message; isButton: boolean }) {
    const deleteMessage = this.deleteWalletMessage.sendDeleteWalletMessage()
    if (isButton) {
      this.bot.editMessageText(deleteMessage, {
        chat_id: message.chat.id,
        message_id: message.message_id,
        reply_markup: SUB_MENU,
        parse_mode: 'HTML',
      })
    } else if (!isButton) {
      this.bot.sendMessage(message.chat.id, deleteMessage, { reply_markup: SUB_MENU, parse_mode: 'HTML' })
    }

    const userId = message.chat.id.toString()

    const listener = async (responseMsg: TelegramBot.Message) => {
      const walletAddresses = responseMsg.text
        ?.split('\n')
        .map((addr) => addr.trim())
        .filter(Boolean) // Split input by new lines, trim, and remove empty lines

      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

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
      }

      if (walletAddresses) {
        this.bot.sendMessage(
          message.chat.id,
          `🐱 ${walletAddresses.length} ${walletAddresses?.length < 2 ? `wallet has been succesfully deleted!` : `wallets have succesfully been deleted!`} you will no longer get notifications for these ${walletAddresses.length < 2 ? `wallet` : `wallets`}`,
          { reply_markup: SUB_MENU },
        )
      }

      this.bot.removeListener('message', listener)
    }

    this.bot.once('message', listener)
  }
}
