import { PublicKey } from "@solana/web3.js";
import { connection } from "../providers/solana";
import { ValidTransactions } from "./valid-transactions";
import { PUMP_FUND_PROGRAM_ID, RAYDIUM_PROGRAM_ID } from "../config/solana/program-ids";
import EventEmitter from "events";
import { TransactionParser } from "../parsers/transaction-parser";
import { SendTransactionMsgHandler } from "../bot/handlers/send-tx-msg-handler";
import { bot } from "../providers/telegram";

const pumpFunProgramId = new PublicKey(PUMP_FUND_PROGRAM_ID)
const raydiumProgramId = new PublicKey(RAYDIUM_PROGRAM_ID)

export class WatchTransaction extends EventEmitter {
    // Rate limit
    private rateLimitInterval: number;
    private lastProcessedTime: number;

    constructor(private wallets: string[], rateLimitInterval: number = 5000) {
        super()
        this.wallets = wallets;

        // Rate limit
        this.rateLimitInterval = rateLimitInterval;
        this.lastProcessedTime = 0;
    }

    public async watchSocket(): Promise<void> {
       try {
        for (const wallet of this.wallets) {
            const publicKey = new PublicKey(wallet);
            console.log(`Watching transactions for wallet: ${publicKey.toBase58()}`);
    
            // start realtime log
            const subscriptionId = connection.onLogs(
              publicKey, async (logs, ctx) => {
                // rate limit
                const currentTime = Date.now();
                if (currentTime - this.lastProcessedTime < this.rateLimitInterval) {
                    return; // Skip processing if within rate limit interval
                }
    
                this.lastProcessedTime = currentTime; // Update the last processed time
    
                const transactionSignature = logs.signature
                // console.log(`Transaction detected: ${transactionSignature}`);
    
                // get full transaction
                const transactionDetails = await connection.getParsedTransactions([transactionSignature], {
                    maxSupportedTransactionVersion: 0,
                });
               
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
                const parsed = await transactionParser.parseNative(transactionDetails)
    
                if (!parsed) {
                    return
                }
                
                console.log(parsed)
               
                // use bot to send message of transaction
                const sendMessageHandler = new SendTransactionMsgHandler(bot)
                sendMessageHandler.send(parsed.description)
            },
            'confirmed'
          );
    
           console.log(`Subscribed to logs with subscription ID: ${subscriptionId}`);
        }
       } catch (error) {
         console.error('Error in watchSocket:', error);
       }
    }
}