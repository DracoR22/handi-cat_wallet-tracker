import TelegramBot from "node-telegram-bot-api";
import { SUB_MENU } from "../../config/bot/menus";
import { PublicKey } from "@solana/web3.js";
import { connection } from "../../providers/solana";
import { PrismaWalletRepository } from "../../repositories/prisma/wallet";
import { WatchWallets } from "../../lib/watch-wallets";

export class AddCommand {
    private prismaWalletRepository: PrismaWalletRepository
    constructor(
        private bot: TelegramBot,
    ) {
        this.bot = bot
        this.prismaWalletRepository = new PrismaWalletRepository()
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

        const userId = message.chat.id.toString()

        const listener = async (responseMsg: TelegramBot.Message) => {
         const walletAddress = responseMsg.text;

         // validate the wallet before pushing to database
         const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

         const isValid = base58Regex.test(walletAddress as string) && PublicKey.isOnCurve(new PublicKey(walletAddress as string).toBytes());

         if (!isValid) {
           this.bot.sendMessage(message.chat.id, 'Please add a valid Solana address');
           return;
         }

         const isWalletAlready = await this.prismaWalletRepository.getWalletByAddress(userId, walletAddress!)

         if (isWalletAlready) {
            this.bot.sendMessage(message.chat.id, `You already follow this wallet`);
            return
         }

        //   await this.checkBot(walletAddress as string)

         // add wallet to database
         console.log('USERID', userId)
          this.prismaWalletRepository.create(userId!, walletAddress!)

         this.bot.sendMessage(message.chat.id, `Wallet ${walletAddress} has been added.`);

        //  const walletWatcher = new WatchWallets()

        // await walletWatcher.setupWalletWatcher();

         // Remove the listener to avoid duplicate handling
         this.bot.removeListener('message', listener);
        }


        this.bot.once('message', listener);
    }

    private async checkBot(walletAddress: string) {
        let signatures: Set<string> = new Set();
        let before = undefined;

        const publicKey = new PublicKey(walletAddress);

           // Fetch the transaction signatures for the given wallet address
    const transactions = await connection.getSignaturesForAddress(publicKey, { limit: 1000 });

    // Object to keep track of transactions processed per second
    const processedSeconds: Set<string> = new Set();
    let excludedCount = 0; // Counter for excluded transactions

    transactions.forEach(tx => {
        const timestamp = new Date(tx.blockTime! * 1000); // Convert blockTime to milliseconds
        const secondKey = timestamp.toISOString().slice(0, 19); // Group by second (yyyy-mm-ddThh:mm:ss)

        if (!processedSeconds.has(secondKey)) {
            processedSeconds.add(secondKey);
            // console.log(`Transaction allowed at ${timestamp.toISOString()}:`, tx);
        } else {
            excludedCount++;
            // console.log(`Transaction excluded at ${timestamp.toISOString()} due to rate limiting.`);
        }
    });

    console.log(`Total transactions excluded due to rate limiting: ${excludedCount}`);
    }
}