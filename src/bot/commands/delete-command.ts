import TelegramBot from "node-telegram-bot-api";
import { PrismaWalletRepository } from "../../repositories/prisma/wallet";

export class DeleteCommand {
    private prismaWalletRepository: PrismaWalletRepository
    constructor(
        private bot: TelegramBot
    ) {
        this.bot = bot
        this.prismaWalletRepository = new PrismaWalletRepository()
    }

    public async deleteCommandHandler() {
        this.bot.onText(/\/delete/, async (msg) => {
            const userId = msg.from?.id;
      
            if (!userId) return;

            await this.delete({ message: msg, isButton: false })
        })
    } 

    public async deleteButtonHandler(msg: TelegramBot.Message) {
       await this.delete({ message: msg, isButton: true})
    }

    private async delete({ message, isButton }: { message: TelegramBot.Message, isButton: boolean }) {

    }
}