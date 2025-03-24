import TelegramBot from 'node-telegram-bot-api'
import { FormatNumbers } from '../../lib/format-numbers'
import { createTxSubMenu } from '../../config/bot-menus'
import { TxMessages } from '../messages/tx-messages'
import { PrismaWalletRepository } from '../../repositories/prisma/wallet'
import { NativeParserInterface, TransferParserInterface } from '../../types/general-interfaces'

export class SendTransactionMsgHandler {
  private prismaWalletRepository: PrismaWalletRepository
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.prismaWalletRepository = new PrismaWalletRepository()
  }

  public async sendTransactionMessage(message: NativeParserInterface, chatId: string) {
    const tokenToMc = message.type === 'buy' ? message.tokenTransfers.tokenInMint : message.tokenTransfers.tokenOutMint
    const tokenToMcSymbol =
      message.type === 'buy' ? message.tokenTransfers.tokenInSymbol : message.tokenTransfers.tokenOutSymbol

    const TX_SUB_MENU = createTxSubMenu(tokenToMcSymbol, tokenToMc)

    const walletName = await this.prismaWalletRepository.getUserWalletNameById(chatId, message.owner)

    if (!walletName?.address || !message.owner) {
      console.log('Address not found in user wallets')
      return
    }

    try {
      if (message.platform === 'raydium' || message.platform === 'jupiter' || message.platform === 'pumpfun_amm') {
        let tokenMarketCap = message.swappedTokenMc

        // Check if the market cap is below 1000 and adjust if necessary
        if (tokenMarketCap && tokenMarketCap < 1000) {
          console.log('MC ADJUSTED')
          tokenMarketCap *= 1000
        }

        const formattedMarketCap = tokenMarketCap ? FormatNumbers.formatPrice(tokenMarketCap) : undefined

        const messageText = TxMessages.defiTxMessage(message, formattedMarketCap, walletName?.name)
        return this.bot.sendMessage(chatId, messageText, {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: TX_SUB_MENU,
        })
      } else if (message.platform === 'pumpfun') {
        let tokenMarketCap = message.swappedTokenMc

        const formattedMarketCap = tokenMarketCap ? FormatNumbers.formatPrice(tokenMarketCap) : undefined

        const messageText = TxMessages.defiTxMessage(message, formattedMarketCap, walletName?.name)
        return this.bot.sendMessage(chatId, messageText, {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: TX_SUB_MENU,
        })
      } else if (message.platform === 'mint_pumpfun') {
        const messageText = TxMessages.tokenMintedMessage(message, walletName?.name)

        return this.bot.sendMessage(chatId, messageText, {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: TX_SUB_MENU,
        })
      }
    } catch (error: any) {
      if (error.response && error.response.statusCode === 403) {
        console.log(`User ${chatId} has blocked the bot or chat no longer exists`)
      } else {
        console.log(`Failed to send message to ${chatId}:`, error)
      }
    }

    return
  }

  public async sendTransferMessage(message: TransferParserInterface, chatId: string) {
    try {
      const walletName = await this.prismaWalletRepository.getUserWalletNameById(chatId, message.owner)

      if (!walletName?.address || !message.owner) {
        console.log('Address not found in user wallets')
        return
      }

      const messageText = TxMessages.solTxMessage(message, walletName.name)
      return this.bot.sendMessage(chatId, messageText, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      })
    } catch (error) {
      console.log(`Failed to send message to ${chatId}`)
      return
    }
  }
}
