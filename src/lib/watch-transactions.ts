import { AccountInfo, PublicKey, SystemProgram } from "@solana/web3.js";
import { connection } from "../providers/solana";
import { ValidTransactions } from "./valid-transactions";
import { PUMP_FUND_PROGRAM_ID, RAYDIUM_PROGRAM_ID } from "../config/program-ids";
import EventEmitter from "events";
import { Token } from "./token";

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
            const transactionDetails = await connection.getTransaction(transactionSignature, {
                maxSupportedTransactionVersion: 0,
            });

            if (!transactionDetails) {
                return
            }

            // find PumpFun transcations with programID
            const programIds = transactionDetails?.transaction.message.staticAccountKeys

            const validTransactions = new ValidTransactions(pumpFunProgramId, raydiumProgramId, programIds)
            const isValidTransaction = validTransactions.getTransaction()

            if (!isValidTransaction.valid) {
                console.log(`Transaction ${transactionSignature} is not related to Pump Fun or Raydium program.`);
                return
            }

            if (isValidTransaction.swap === 'PUMP FUN') {
                console.log(`Transaction ${transactionSignature} is related to Pump Fun program.`);
            } else if (isValidTransaction.swap === 'RAYDIUM') {
                console.log(`Transaction ${transactionSignature} is related to Raydium program.`);
            }

            // get tokens
            const tokens = new Token(connection, transactionDetails)
            await tokens.getTokens()
        },
        'confirmed'
    );

    console.log(`Subscribed to logs with subscription ID: ${subscriptionId}`);
    }
}