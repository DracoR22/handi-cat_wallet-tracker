import TelegramBot from "node-telegram-bot-api";
import { Utils } from "../../lib/token-utils";
import { BotMessages } from "../../config/bot/messages";
import { TokenPrices } from "../../lib/token-prices";
import { FormatNumbers } from "../../lib/format-numbers";

export class SendTransactionMsgHandler {
    private tokenUtils: Utils
    private botMessages: BotMessages
    private tokenPrices: TokenPrices
    private formatNumbers: FormatNumbers
    constructor(
        private bot: TelegramBot,
    ) {
        this.bot = bot
        this.tokenUtils = new Utils()
        this.botMessages = new BotMessages()
        this.tokenPrices = new TokenPrices()
        this.formatNumbers = new FormatNumbers()
    }

    public async send(message: NativeParserInterface, chatId: string) {
        const solPrice = await this.tokenUtils.getSolPriceNative()

        const tokenToMc = message.type === 'buy' ? message.tokenTransfers.tokenInMint : message.tokenTransfers.tokenOutMint

        // const tokenMarketCap = await this.tokenUtils.getTokenMktCap(message.platform, tokenToMc)
        const tokenInfo = await this.tokenPrices.gmgnTokenInfo(tokenToMc)

        const tokenMarketCap = tokenInfo?.market_cap

        const formattedMarketCap = tokenMarketCap ? this.formatNumbers.formatMarketCap(tokenMarketCap) : undefined

        const messageText = this.botMessages.sendTxMessageWithUsd(message, Number(solPrice), formattedMarketCap?.toString())

        this.bot.sendMessage(chatId, messageText, { parse_mode: 'HTML', disable_web_page_preview: true });
        
        return
    }
}