import TelegramBot from "node-telegram-bot-api";
import { SUB_MENU } from "../../config/bot/menus";

export class AddCommand {
    constructor(
        private bot: TelegramBot
    ) {
        this.bot = bot
    }

    public addCommandHandler() {
        this.bot.onText(/\/add/, async (msg) => {
            const userId = msg.from?.id;
      
            if (!userId) return;

            this.add({ message: msg, isButton: false })
        })
    }

    public addButtonHandler(msg: TelegramBot.Message) {
          this.add({ message: msg, isButton: true })
    } 

    private add({ message, isButton }: { message: TelegramBot.Message, isButton: boolean }) {
        if (isButton) {
            this.bot.editMessageText('Please enter a wallet address to track:', {
                chat_id: message.chat.id,
                message_id: message.message_id,
                reply_markup: SUB_MENU
           })
        } else if (!isButton) {
            this.bot.sendMessage(message.chat.id, 'Please enter a wallet address to track:', { reply_markup: SUB_MENU })
        }

        const listener = async (responseMsg: TelegramBot.Message) => {
         const walletAddress = responseMsg.text;

         // validate the wallet before pushing to database

         // add walet to database
            

         this.bot.sendMessage(message.chat.id, `Wallet address ${walletAddress} has been added.`);

         // Remove the listener to avoid duplicate handling
         this.bot.removeListener('message', listener);
        }


        this.bot.once('message', listener);
    }
}