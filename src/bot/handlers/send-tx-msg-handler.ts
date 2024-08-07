import TelegramBot from "node-telegram-bot-api";
import { TokenUtils } from "../../lib/token-utils";
import { TokenPrices } from "../../lib/token-prices";
import { FormatNumbers } from "../../lib/format-numbers";
import { createTxSubMenu } from "../../config/bot/menus";
import { TxMessages } from "../messages/send-tx-message";
import { PrismaWalletRepository } from "../../repositories/prisma/wallet";
import { NativeParserInterface } from "../../types/interfaces";

export class SendTransactionMsgHandler {
    private tokenUtils: TokenUtils
    private txMessages: TxMessages
    private tokenPrices: TokenPrices
    private formatNumbers: FormatNumbers
    private prismaWalletRepository: PrismaWalletRepository
    constructor(
        private bot: TelegramBot,
    ) {
        this.bot = bot
        this.tokenUtils = new TokenUtils()
        this.txMessages = new TxMessages()
        this.tokenPrices = new TokenPrices()
        this.formatNumbers = new FormatNumbers()
        this.prismaWalletRepository = new PrismaWalletRepository()
    }

    public async send(message: NativeParserInterface, chatId: string) {
        const solPrice = await this.tokenUtils.getSolPriceNative()

        if (!solPrice) {
            return
        }

        const tokenToMc = message.type === 'buy' ? message.tokenTransfers.tokenInMint : message.tokenTransfers.tokenOutMint
        const tokenToMcSymbol = message.type === 'buy' ? message.tokenTransfers.tokenInSymbol : message.tokenTransfers.tokenOutSymbol

        const TX_SUB_MENU = createTxSubMenu(tokenToMcSymbol, tokenToMc)

        const walletName = await this.prismaWalletRepository.getUserWalletNameById(chatId, message.owner)

        if (message.platform === 'raydium') {
            let tokenMarketCap = message.swappedTokenMc

             // Check if the market cap is below 1000 and adjust if necessary
            if (tokenMarketCap && tokenMarketCap < 1000) {
              console.log('MC ADJUSTED')
              tokenMarketCap *= 1000;
            }
    
            const formattedMarketCap = tokenMarketCap ? this.formatNumbers.formatMarketCap(tokenMarketCap) : undefined
    
            const messageText = this.txMessages.sendTxMessage(message, Number(solPrice), formattedMarketCap, walletName?.name)
            return this.bot.sendMessage(chatId, messageText, { parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: TX_SUB_MENU });

        } else if (message.platform === 'pumpfun') {
            const tokenInfo = await this.tokenPrices.gmgnTokenInfo(tokenToMc)
            let tokenMarketCap = tokenInfo?.market_cap

            const formattedMarketCap = tokenMarketCap ? this.formatNumbers.formatMarketCap(tokenMarketCap) : undefined
    
            const messageText = this.txMessages.sendTxMessage(message, Number(solPrice), formattedMarketCap, walletName?.name)
            return this.bot.sendMessage(chatId, messageText, { parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: TX_SUB_MENU });
        }
        
        return
    }
}