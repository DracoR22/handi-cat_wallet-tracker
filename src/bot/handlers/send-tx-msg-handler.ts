import TelegramBot from "node-telegram-bot-api";
import { Utils } from "../../lib/token-utils";
import { BotMessages } from "../../config/bot/messages";

export class SendTransactionMsgHandler {
    private tokenUtils: Utils
    private botMessages: BotMessages
    constructor(
        private bot: TelegramBot,
    ) {
        this.bot = bot
        this.tokenUtils = new Utils()
        this.botMessages = new BotMessages()
    }

    public async send(message: NativeParserInterface, chatId: string) {
            const solPrice = await this.tokenUtils.getSolPriceToUSD()

            if (!solPrice) {
                const messageText = this.botMessages.sendTxMessage(message)
                this.bot.sendMessage(chatId, messageText, { parse_mode: 'HTML', disable_web_page_preview: true });
            } else if (solPrice) {
                const messageText = this.botMessages.sendTxMessageWithUsd(message, solPrice)
                this.bot.sendMessage(chatId, messageText, { parse_mode: 'HTML', disable_web_page_preview: true });
            }

            return
    }
}