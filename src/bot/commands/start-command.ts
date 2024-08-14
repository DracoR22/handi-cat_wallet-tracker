import TelegramBot from "node-telegram-bot-api";
import { START_MENU } from "../../config/bot-menus";
import { PrismaUserRepository } from "../../repositories/prisma/user";

export class StartCommand {
    private prismaUserRepository: PrismaUserRepository
    constructor(
        private bot: TelegramBot
    ) {
        this.bot = bot
        this.prismaUserRepository = new PrismaUserRepository()
    }

    public start() {
        this.bot.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            const firstName = msg.from?.first_name || ''
            const lastName = msg.from?.last_name || ''
            const username = msg.from?.username || ''
            const userId = msg.chat.id.toString()

            if (!userId) {
              return
            }
        
            const commandMenu = {
              reply_markup: {
                inline_keyboard: START_MENU,
              },
            };

            const messageText = `😺 Handi Cat | Wallet Tracker\n\n 🆙 For more features, you can upgrade to PRO, which allows tracking 50+ wallets.`;
        
            this.bot.sendMessage(chatId, messageText, { reply_markup: START_MENU });

             // Find existing user
            const user = await this.prismaUserRepository.getById(userId)

            // // Create new user
            if (!user) {
              await this.prismaUserRepository.create({ firstName, id: userId, lastName, username })
            }
          });
    }
}