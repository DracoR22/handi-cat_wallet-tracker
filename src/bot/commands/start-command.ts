import TelegramBot from "node-telegram-bot-api";
import { START_MENU } from "../../config/bot/menus";
import { CreateWallet } from "../../lib/create-wallet";

export class StartCommand {
    constructor(
        private bot: TelegramBot
    ) {
        this.bot = bot
    }

    public start() {
        this.bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            const firstName = msg.from?.first_name;

            console.log(msg.from?.id)
            console.log(chatId)

            // Create wallet
            // const createWallet = new CreateWallet()
            // createWallet.create()
        
            const commandMenu = {
              reply_markup: {
                inline_keyboard: START_MENU,
              },
            };
        
            this.bot.sendMessage(chatId, `Hello, ${firstName}! Welcome to our bot. How can I help you today?`, commandMenu);
          });
    }
}