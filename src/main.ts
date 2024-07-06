import { connection } from './providers/solana';
import { ParsedInnerInstruction, ParsedInstruction, ParsedTransactionMeta, PartiallyDecodedInstruction, PublicKey} from '@solana/web3.js';


import dotenv from "dotenv"
import { ParsedInfo } from './types/parsed-info-types';
import { ParseTransactions } from './lib/parse-transactions';
//@ts-expect-error
import { getAccount  } from '@solana/spl-token';

dotenv.config()

const WALLET_ADDRESS = 'ZG98FUCjb8mJ824Gbs6RsgVmr1FhXb2oNiJHa2dwmPd'

class Main {
    constructor() {}

    public async init(): Promise<void> {
        // const watch = new WatchTransaction(WALLET_ADDRESS)
        // await watch.watchSocket()

        const parseTransactions = new ParseTransactions('5MDQdgqM8PD5WxCgxppW8TGRpiqRyHiJbtfzsAj3jYZvB7sUrmVsPsACwAP1WkB3nwRTUkQd9q6gERP9oALTpTrh')

        // const transaction = await parseTransactions.parseWithHelius()
        // console.log(transaction)

        this.parseTransactionDetails('2NVwmb6rdYKniiJU1SVDNWdKGmT5K2kQu29wM76mC86A7yuiqzAWJrrGxVvs2cRMy7fqM6SFvXCr7PhqNTpVXuyv', 'raydium')

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

        let owner = ''
        let amountIn = ''
        let tokenIn = ''
        let amountOut = ''
        let tokenOut = ''

        const transactions: any = []

       const preTokens = transactionDetails[0].meta?.preTokenBalances
       const postTokens = transactionDetails[0].meta?.postTokenBalances

       console.log('PRE_TOKENS:', preTokens)
       console.log('POST_TOKENS:', postTokens)
     
        // Transaction Metadata
        transactionDetails[0].meta?.innerInstructions?.forEach((i: ParsedInnerInstruction) => {
          console.log('META:', i.instructions)
          i.instructions.forEach((r: any) => {
            if (program === 'raydium' && r.parsed?.type === 'transfer' && r.parsed.info.amount !== undefined) {
              transactions.push(r.parsed);
            }

           
          });
        });
      
        // Log the transactions array once after all instructions are processed
        console.log('TRANSACTIONS', transactions);

        const raydiumTransfer = transactions.length > 2 ? transactions.find((t: any) => t.info.destination === transactions[0]?.info?.source) : transactions[transactions.length - 1]

        // const testTokenIn = await this.getMintAddress(raydiumTransfer.info.destination)

        if (program === 'raydium' && transactions.length > 1) {
          owner = transactions[0]?.info?.authority || '';
          amountOut = transactions[0]?.info?.amount || 0;
          amountIn = raydiumTransfer.info.amount || '';
          tokenOut = await this.getMintAddress(transactions[0]?.info.destination) 
          tokenIn =  await this.getMintAddress(raydiumTransfer.info.source) 
       
        } else {
          console.warn('Program is not raydium or transactions length is insufficient');
        }
      
       
        const instructions = transactionDetails[0].transaction.message.instructions;
        const parsedInfos: any[] = [];
        const descriptions = instructions.map((instruction: ParsedInstruction | PartiallyDecodedInstruction) => {
            let description = '';
            const programId = instruction.programId.toString();
            // @ts-ignore
            console.log('PARSED iNFO', instruction.parsed)
    
        });

        const swapDescription = `${owner} swapped ${amountOut} ${tokenOut} for ${amountIn} ${tokenIn}`;
        console.log(swapDescription);

        return {
          description: swapDescription
        }
    }

   private async getMintAddress(tokenAddress: string) {
      try {
        const tokenPublicKey = new PublicKey(tokenAddress);
        const accountInfo = await getAccount(connection, tokenPublicKey);
        return accountInfo.mint.toBase58();
      } catch (error) {
        console.error(`Error fetching mint address for token ${tokenAddress}:`, error);
        return null;
      }
    }
}

const main = new Main()
main.init()



