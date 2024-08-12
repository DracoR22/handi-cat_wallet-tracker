import { Connection, PublicKey } from "@solana/web3.js";
import { connection } from "../providers/solana";
import { ValidTransactions } from "./valid-transactions";
import { PUMP_FUND_PROGRAM_ID, RAYDIUM_PROGRAM_ID } from "../config/solana/program-ids";
import EventEmitter from "events";
import { TransactionParser } from "../parsers/transaction-parser";
import { SendTransactionMsgHandler } from "../bot/handlers/send-tx-msg-handler";
import { bot } from "../providers/telegram";
import { Wallet } from "@prisma/client";
import { WalletWithUsers } from "../types/swap-types";
import pLimit from "p-limit";
import Bottleneck from "bottleneck";
import { RateLimitMessages } from "../bot/messages/rate-limit-messages";
import { PrismaWalletRepository } from "../repositories/prisma/wallet";

const pumpFunProgramId = new PublicKey(PUMP_FUND_PROGRAM_ID)
const raydiumProgramId = new PublicKey(RAYDIUM_PROGRAM_ID)

export class WatchTransaction extends EventEmitter {
    public subscriptions: Map<string, number>;
    private walletTransactions: Map<string, { count: number, startTime: number }>;
    private excludedWallets: Map<string, boolean>;

    private prismaWalletRepository: PrismaWalletRepository

    private rateLimitMessages: RateLimitMessages

    private limiter: Bottleneck

    constructor() {
        super()

        this.subscriptions = new Map();
        this.walletTransactions = new Map();
        this.excludedWallets = new Map();

        this.prismaWalletRepository = new PrismaWalletRepository()

        this.rateLimitMessages = new RateLimitMessages()

        this.limiter = new Bottleneck({
            maxConcurrent: 2,
            minTime: 1000
        })
    }

    public async watchSocket(wallets: WalletWithUsers[]): Promise<void> {
       try {
        for (const wallet of wallets) {
            const publicKey = new PublicKey(wallet.address);
            const walletAddress = publicKey.toBase58();

            // Check if a subscription already exists for this wallet address
             if (this.subscriptions.has(walletAddress)) {
                console.log(`Already watching for: ${walletAddress}`)
                continue; // Skip re-subscribing
            }

            console.log(`Watching transactions for wallet: ${walletAddress}`);

             // Initialize transaction count and timestamp
            this.walletTransactions.set(walletAddress, { count: 0, startTime: Date.now() });
    
            // start realtime log
            const subscriptionId = connection.onLogs(
              publicKey, async (logs, ctx) => {
                // exclude wallets that have reached the limit
                if (this.excludedWallets.has(walletAddress)) {
                  console.log(`Wallet ${walletAddress} is excluded from logging.`);
                  return;
                }
                // await this.limiter.schedule(async () => {
                 const transactionSignature = logs.signature
    
                 const transactionDetails = await this.getParsedTransaction(transactionSignature)
                 
                 if (!transactionDetails) {
                    return
                 }
    
                 // find all programIds involved in the transaction
                 const programIds = transactionDetails[0]?.transaction.message.accountKeys.map(key => key.pubkey).filter(pubkey => pubkey !== undefined)
    
                 const validTransactions = new ValidTransactions(pumpFunProgramId, raydiumProgramId, programIds)
                 const isValidTransaction = validTransactions.getTransaction()
    
                 if (!isValidTransaction.valid) {
                    return
                 }
       
                 // parse transaction
                 const transactionParser = new TransactionParser(transactionSignature)
                 const parsed = await transactionParser.parseNative(transactionDetails, isValidTransaction.swap)
    
                 if (!parsed) {
                    return
                 }
                
                 console.log(parsed)
               
                 // use bot to send message of transaction
                 const sendMessageHandler = new SendTransactionMsgHandler(bot)
                
                 for (const user of wallet.userWallets) {
                    console.log('Users:', user)
                    await sendMessageHandler.send(parsed, user.userId)
                  }

                 // Update transaction count and calculate TPS
              const walletData = this.walletTransactions.get(walletAddress);
              if (walletData) {
                walletData.count++;
                const elapsedTime = (Date.now() - walletData.startTime) / 1000; // seconds

                if (elapsedTime >= 1) {
                  const tps = walletData.count / elapsedTime;
                  console.log(`TPS for wallet ${walletAddress}: ${tps.toFixed(2)}`);

                  // Exclude spamming wallet
                  if (tps >= 0.2) {
                    this.excludedWallets.set(walletAddress, true);
                    console.log(`Wallet ${walletAddress} excluded for 20 minutes due to high TPS.`);

                    for (const user of wallet.userWallets) {
                      bot.sendMessage(user.userId, this.rateLimitMessages.walletWasPaused(walletAddress), { parse_mode: 'HTML' })
                    }

                    setTimeout(() => {
                      this.excludedWallets.delete(walletAddress);

                      for (const user of wallet.userWallets) {
                        bot.sendMessage(user.userId, this.rateLimitMessages.walletWasResumed(walletAddress), { parse_mode: 'HTML' })
                      }

                      console.log(`Wallet ${walletAddress} re-included after 20 minutes.`);
                    }, 60 * 1000); // TODO: change back to 20 minutes

                    // Stop processing for this wallet
                    return;
                  }

                  // Reset for next interval
                  walletData.count = 0;
                  walletData.startTime = Date.now();
                }
              }
                //  })
             },
             'confirmed'
          );
    
           // Store subscription ID
           this.subscriptions.set(wallet.address, subscriptionId);
           console.log(`Subscribed to logs with subscription ID: ${subscriptionId}`);
        }
       } catch (error) {
         console.error('Error in watchSocket:', error);
       }
    }

    private async getParsedTransaction(transactionSignature: string) {
      try {
       const transactionDetails = await connection.getParsedTransactions([transactionSignature], {
           maxSupportedTransactionVersion: 0,
      })

      return transactionDetails
      } catch (error) {
       console.log('GET_PARSED_TRANSACTIONS_ERROR', error)
       return
      }
   }
}