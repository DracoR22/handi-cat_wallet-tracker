import { connection } from './providers/solana';
import { ParsedInstruction, PartiallyDecodedInstruction} from '@solana/web3.js';


import dotenv from "dotenv"
import { ParsedInfo } from './types/parsed-info-types';
import { ParseTransactions } from './lib/parse-transactions';

dotenv.config()

const WALLET_ADDRESS = 'ZG98FUCjb8mJ824Gbs6RsgVmr1FhXb2oNiJHa2dwmPd'

class Main {
    constructor() {}

    public async init(): Promise<void> {
        // const watch = new WatchTransaction(WALLET_ADDRESS)
        // await watch.watchSocket()

        const parseTransactions = new ParseTransactions('5GsU5t5rNfmfdQz1hVQYALDWbg7FP6L6AMmWJDRgxTcqjJWy63RiQn7LAVU9fmrpdPTLXMR5XwZedMS6gDV7A5WS')

        // const transaction = await parseTransactions.parseWithHelius()
        // console.log(transaction)

        this.parseTransactionDetails('4HnXcQUFnQFgU7RFuuuejdyhvWiMEWbPZxvbqMCFCGzmtTyAFBAA9zfNvC1cvtfmtpSNuTRnRVWjLRZu3yMJGBCw', 'raydium')

        // await parseTransactions.parseNative()
    }

    private async parseTransactionDetails(transactionSignature: string, program: 'pumpfun' | 'raydium') {
        const transactionDetails = await connection.getParsedTransactions([transactionSignature], {
            maxSupportedTransactionVersion: 0,
        });
    
        if (!transactionDetails || !transactionDetails[0]) {
            console.log('Transaction not found or invalid.');
            return;
        }

       
        // console.log('META', transactionDetails[0].meta?.innerInstructions)
        const meta = transactionDetails[0].meta?.innerInstructions?.map((i) => {
          const instructions =  i.instructions
          instructions.map((r) => {
            // @ts-ignore
            console.log('META', r.parsed)
          })
           
        })
        
        const instructions = transactionDetails[0].transaction.message.instructions;
        const parsedInfos: any[] = [];
        const descriptions = instructions.map((instruction: ParsedInstruction | PartiallyDecodedInstruction) => {
            let description = '';
            const programId = instruction.programId.toString();
    
        });
    
        console.log('Instructions', instructions)
        console.log('Parsed Info', parsedInfos)

      if (parsedInfos.length === 1) {
        console.log('Transaction is a transfer')
        return
      }

      if (program === 'pumpfun') {
        const owner = parsedInfos[1].wallet
        const amountIn = (parsedInfos.find(info => info.lamports)!.lamports / 1e9).toFixed(6);

        const swapDescription = `${owner} swapped ${amountIn} ${''} for ${''} ${''}`;
       console.log(swapDescription);
      }

      if (program === 'raydium') {
        const owner = parsedInfos[0].source;
        const amountIn = (parsedInfos.find(info => info.lamports)!.lamports / 1e9).toFixed(6); // Convert lamports to SOL and fix to 2 decimal places
        const tokenIn = parsedInfos[0].mint ? parsedInfos[0].mint : 'Unknown Token'; // Use the mint if available, otherwise fallback
        const amountOut = parsedInfos.find(info => info.tokenAmount)!.tokenAmount.uiAmountString;
        const tokenOut = parsedInfos.find(info => info.tokenAmount)!.mint ? parsedInfos.find(info => info.tokenAmount)!.mint : 'Unknown Token'; // Use the mint if available, otherwise fallback

       const swapDescription = `${owner} swapped ${amountIn} ${tokenIn} for ${amountOut} ${tokenOut}`;
       console.log(swapDescription);
      }
        return descriptions;
    }
}

const main = new Main()
main.init()



