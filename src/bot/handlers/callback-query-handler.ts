import TelegramBot, { InlineKeyboardMarkup } from "node-telegram-bot-api";
import { AddCommand } from "../commands/add-command";
import { START_MENU, SUB_MENU } from "../../config/bot/menus";

export class CallbackQueryHandler {
    constructor(
        private bot: TelegramBot
    ) {
        this.bot = bot
    }

    public call() {
        const addCommand = new AddCommand(this.bot)

        this.bot.on('callback_query', (callbackQuery) => {
            const message = callbackQuery.message;
            const chatId = message?.chat.id;
            const data = callbackQuery.data;
        
            if (!chatId) {
                return
            }
        
            let responseText;
        
            switch (data) {
              case 'add':
                 addCommand.addButtonHandler(message)
                break;
              case 'manage':
                responseText = 'You clicked Manage.';
                break;
              case 'settings':
                responseText = 'You clicked Settings.';
                break;
              case 'groups':
                responseText = 'You clicked Groups.';
                break;
              case 'pro':
                responseText = 'You clicked PRO.';
                break;
              case 'my_wallet':
                responseText = 'You clicked My Wallet.';
                break;
              case 'links':
                responseText = 'You clicked Links.';
                break;
              case 'sell':
                responseText = 'You clicked SELL.';
                break;
              case 'back_to_main_menu':
                const messageText = `🐱 Handi Cat | Wallet Tracker\n\n 🆙 For more features, you can upgrade to PRO, which allows tracking 50+ wallets.`;

                this.bot.editMessageText(messageText, { chat_id: chatId, message_id: message.message_id, reply_markup: START_MENU })
                break;
              default:
                responseText = 'Unknown command.';
            }
        
            // this.bot.sendMessage(chatId, responseText);
        })
    }
}