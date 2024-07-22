import TelegramBot from "node-telegram-bot-api";
import { PrismaWalletRepository } from "../../repositories/prisma/wallet";
import { ManageMessages } from "../../config/bot/messages/send-manage-message";
import { MANAGE_SUB_MENU } from "../../config/bot/menus";

export class ManageCommand {
        private prismaWalletRepository: PrismaWalletRepository
        private manageMessages: ManageMessages
    constructor(
        private bot: TelegramBot
    ) {
        this.bot = bot
        this.prismaWalletRepository = new PrismaWalletRepository()
        this.manageMessages = new ManageMessages()
    }

    public manageCommandHandler() {
        this.bot.onText(/\/manage/, async (msg) => {
            const userId = msg.from?.id;
      
            if (!userId) return;

            this.manage({ message: msg, isButton: false })
        })
    }

    public manageButtonHandler(msg: TelegramBot.Message) {
         this.manage({ message: msg, isButton: true })
    }

    private manage({ message, isButton }: { message: TelegramBot.Message, isButton: boolean }) {
        const messageText = this.manageMessages.sendManageMessage()
        if (isButton) {
           this.bot.editMessageText(messageText, { 
              chat_id: message.chat.id,
              message_id: message.message_id,
              reply_markup: MANAGE_SUB_MENU ,
              parse_mode: 'HTML'
            })
        } else if (!isButton) {
            this.bot.sendMessage(message.chat.id, messageText, {
                reply_markup: MANAGE_SUB_MENU,
                parse_mode: 'HTML'
            })
        }

        
    }
}