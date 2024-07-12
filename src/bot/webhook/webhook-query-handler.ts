import TelegramBot, { Message } from "node-telegram-bot-api";
import { AddCommand } from "../commands/add-command";

export class WebhookQueryHandler {
    constructor(
        private bot: TelegramBot
    ) {
        this.bot = bot
    }

    public call(message: TelegramBot.Message) {
        const addCommand = new AddCommand(this.bot)

           // Check if the message is a command
           if (message.text?.startsWith('/')) {
            // Split command and arguments
            const [command, ...args] = message.text?.split(' ');

            // Handle different commands
            switch (command) {
                case '/start':
                    // this.startCommandHandler(chatId);
                    this.bot.sendMessage(message.chat.id, 'start command')
                    break;
                case '/add':
                    this.bot.sendMessage(message.chat.id, 'add your wallet')
                    
                    break;
                    // Add more commands as needed
                     default:
                    // this.defaultCommandHandler(chatId);
                    break;
            }
        }
    }
}