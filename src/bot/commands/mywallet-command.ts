import TelegramBot from 'node-telegram-bot-api'
import { PrismaUserRepository } from '../../repositories/prisma/user'
import { SUB_MENU, USER_WALLET_SUB_MENU } from '../../config/bot-menus'
import { WalletMessages } from '../messages/wallet-messages'

export class MyWalletCommand {
  private prismaUserRepository: PrismaUserRepository
  private walletMessages: WalletMessages
  constructor(private bot: TelegramBot) {
    this.prismaUserRepository = new PrismaUserRepository()
    this.walletMessages = new WalletMessages()

    this.bot = bot
  }

  public async myWalletCommandHandler(msg: TelegramBot.Message) {
    const userId = msg.chat.id.toString()
    const userPersonalWallet = await this.prismaUserRepository.getPersonalWallet(userId)

    if (!userPersonalWallet) {
      return
    }

    const messageText = await this.walletMessages.sendMyWalletMessage(userPersonalWallet)

    const sendMessage = this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: USER_WALLET_SUB_MENU,
      parse_mode: 'HTML',
    })

    return sendMessage
  }

  public async showPrivateKeyHandler(msg: TelegramBot.Message) {
    const userId = String(msg.chat.id)

    const userPrivKey = await this.prismaUserRepository.showUserPrivateKey(userId)

    const messageText = `
Your private key (do not share with anyone!!!)

(Click to copy)
<code>${userPrivKey ? userPrivKey : ''}</code>
`

    this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: SUB_MENU,
      parse_mode: 'HTML',
    })
  }
}
