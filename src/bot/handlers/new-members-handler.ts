import TelegramBot from "node-telegram-bot-api";
import { START_MENU } from "../../config/bot/start-menu";

export class NewMembersHandler {
    constructor(
        private bot: TelegramBot
    ) {
        this.bot = bot
    }

    public async newMember() {
        this.bot.on('new_chat_members', (msg) => {
            const chatId = msg.chat.id;
          
            msg.new_chat_members?.forEach((newMember) => {
              const firstName = newMember.first_name;
          
              const welcomeMessage = `Welcome, ${firstName}! I am here to assist you. Use /start to see what I can do.`;
              
              const commandMenu = {
                reply_markup: {
                  inline_keyboard: START_MENU
                },
              };
          
              this.bot.sendMessage(chatId, welcomeMessage, commandMenu);
            });
          });
    }
}