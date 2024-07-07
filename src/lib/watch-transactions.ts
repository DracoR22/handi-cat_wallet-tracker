import { PublicKey } from "@solana/web3.js";
import { connection } from "../providers/solana";
import { ValidTransactions } from "./valid-transactions";
import { PUMP_FUND_PROGRAM_ID, RAYDIUM_PROGRAM_ID } from "../config/program-ids";
import EventEmitter from "events";
import { TransactionType } from "helius-sdk";
import { TransactionParser } from "../parsers/transaction-parser";

const pumpFunProgramId = new PublicKey(PUMP_FUND_PROGRAM_ID)
const raydiumProgramId = new PublicKey(RAYDIUM_PROGRAM_ID)

export class WatchTransaction extends EventEmitter {
    private rateLimitInterval: number;
    private lastProcessedTime: number;

    constructor(private wallet: string, rateLimitInterval: number = 5000) {
        super()
        this.wallet = wallet;
        this.rateLimitInterval = rateLimitInterval;
        this.lastProcessedTime = 0;
    }

    public async watchSocket(): Promise<void> {
        const publicKey = new PublicKey(this.wallet);
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

            // find PumpFun transcations with programID
            const programIds = transactionDetails[0]?.transaction.message.accountKeys.map(key => key.pubkey).filter(pubkey => pubkey !== undefined)

            const validTransactions = new ValidTransactions(pumpFunProgramId, raydiumProgramId, programIds)
            const isValidTransaction = validTransactions.getTransaction()

            if (!isValidTransaction.valid) {
                return
            }
   
            // parse transaction
            const transactionParser = new TransactionParser(transactionSignature)
            const parsed = await transactionParser.parseNative(transactionDetails)
            console.log(parsed)
           
        },
        'confirmed'
    );

    console.log(`Subscribed to logs with subscription ID: ${subscriptionId}`);
    }
}