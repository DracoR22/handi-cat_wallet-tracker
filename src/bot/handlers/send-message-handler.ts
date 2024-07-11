import TelegramBot from "node-telegram-bot-api";

export class SendMessageHandler {
    constructor(
        private bot: TelegramBot,
    ) {
        this.bot = bot
    }

    public send(message: string) {
        const chatId = '7323059679'; // Replace with the recipient's chat ID
        this.bot.sendMessage(chatId, message);
    }
}