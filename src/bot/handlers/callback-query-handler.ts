import TelegramBot, { InlineKeyboardMarkup } from "node-telegram-bot-api";
import { AddCommand } from "../commands/add-command";
import { START_MENU, SUB_MENU } from "../../config/bot-menus";
import { ManageCommand } from "../commands/manage-command";
import { DeleteCommand } from "../commands/delete-command";
import { userExpectingWalletAddress } from "../../constants/flags";
import { MyWalletCommand } from "../commands/mywallet-command";

export class CallbackQueryHandler {
        private addCommand: AddCommand
        private manageCommand: ManageCommand
        private deleteCommand: DeleteCommand
        private myWalletCommand: MyWalletCommand
    constructor(
        private bot: TelegramBot
    ) {
        this.bot = bot

        this.addCommand = new AddCommand(this.bot)
        this.manageCommand = new ManageCommand(this.bot)
        this.deleteCommand = new DeleteCommand(this.bot)
        this.myWalletCommand = new MyWalletCommand(this.bot)
    }

    public call() {
        this.bot.on('callback_query', async (callbackQuery) => {
            const message = callbackQuery.message;
            const chatId = message?.chat.id;
            const data = callbackQuery.data;
        
            if (!chatId) {
                return
            }
        
            let responseText;
        
            switch (data) {
              case 'add':
                 this.addCommand.addButtonHandler(message)
                break;
              case 'manage':
                 await this.manageCommand.manageButtonHandler(message)
                break;
              case 'delete':
                 this.deleteCommand.deleteButtonHandler(message)
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
                 this.myWalletCommand.myWalletCommandHandler(message)
                break;
              case 'links':
                responseText = 'You clicked Links.';
                break;
              case 'sell':
                responseText = 'You clicked SELL.';
                break;
              case 'back_to_main_menu':
                const messageText = `🐱 Handi Cat | Wallet Tracker\n\n 🆙 For more features, you can upgrade to PRO, which allows tracking 50+ wallets.`;

                // reset any flags
                userExpectingWalletAddress[Number(chatId)] = false;

                this.bot.editMessageText(messageText, { chat_id: chatId, message_id: message.message_id, reply_markup: START_MENU })
                break;
              default:
                responseText = 'Unknown command.';
            }
        
            // this.bot.sendMessage(chatId, responseText);
        })
    }
}