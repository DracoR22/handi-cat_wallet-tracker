import TelegramBot from "node-telegram-bot-api";
import { SUB_MENU } from "../../config/bot/menus";
import { PublicKey } from "@solana/web3.js";
import { connection } from "../../providers/solana";
import { PrismaWalletRepository } from "../../repositories/prisma/wallet";
import { userExpectingWalletAddress } from "../../constants/flags";
import { TrackWallets } from "../../lib/track-wallets";
import { RateLimit } from "../../lib/rate-limit";
import { MAX_5_MIN_TXS_ALLOWED } from "../../constants/handi-cat";

export class AddCommand {
    private prismaWalletRepository: PrismaWalletRepository
    private trackWallets: TrackWallets
    private rateLimit: RateLimit
    constructor(
        private bot: TelegramBot
    ) {
        this.bot = bot

        this.prismaWalletRepository = new PrismaWalletRepository()
        this.trackWallets = new TrackWallets()
        this.rateLimit = new RateLimit()
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
            this.bot.editMessageText(`
🐱 Ok, just send me a wallet address to track:

You can also give that wallet a name by following the address with the desired name, for example: 

walletAddress walletName
`, {
                chat_id: message.chat.id,
                message_id: message.message_id,
                reply_markup: SUB_MENU,
                parse_mode: 'HTML'
           })
        } else if (!isButton) {
            this.bot.sendMessage(message.chat.id, `
🐱 Ok, just send me a wallet address to track:

You can also give that wallet a name by following the address with the desired name, for example: 

walletAddress walletName
`, { reply_markup: SUB_MENU, parse_mode: 'HTML' })
        }

        const userId = message.chat.id.toString()

        userExpectingWalletAddress[Number(userId)] = true;
        const listener = async (responseMsg: TelegramBot.Message) => {
         // Check if the user is expected to enter a wallet address
         if (!userExpectingWalletAddress[Number(userId)]) return;
         const text = responseMsg.text;

         const [walletAddress, walletName] = text!.split(' ');
         console.log('WALLET ADDRESS', walletAddress)
         console.log('WALLET NAME', walletName)
         // validate the wallet before pushing to database
         const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

         const isValid = base58Regex.test(walletAddress as string) && PublicKey.isOnCurve(new PublicKey(walletAddress as string).toBytes());

         if (!isValid) {
           this.bot.sendMessage(message.chat.id, '😾 Address provided is not a valid Solana wallet ');
           return;
         }

         const latestWalletTxs = await this.rateLimit.last5MinutesTxs(walletAddress)

         if (latestWalletTxs && latestWalletTxs > MAX_5_MIN_TXS_ALLOWED) {
            this.bot.sendMessage(message.chat.id, '😾 This wallet is spamming to many txs, try another wallet or try again later');
            return
         }

         const isWalletAlready = await this.prismaWalletRepository.getUserWalletById(userId, walletAddress!)

         if (isWalletAlready) {
            this.bot.sendMessage(message.chat.id, `🙀 You already follow this wallet`);
            return
         }

         // await this.checkBot(walletAddress as string)

         // add wallet to database
         console.log('USERID', userId)
          this.prismaWalletRepository.create(userId!, walletAddress!, walletName)

         this.bot.sendMessage(message.chat.id, `🎉 Wallet ${walletAddress} has been added.`);

        //  const walletWatcher = new WatchWallets()

        // await walletWatcher.setupWalletWatcher();

         // Remove the listener to avoid duplicate handling
         this.bot.removeListener('message', listener);

        // Reset the flag
         userExpectingWalletAddress[Number(userId)] = false;
        }


        this.bot.once('message', listener);
    }
}