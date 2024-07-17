import { Transaction } from "../types/helius-types";
import { connection } from "../providers/solana";
import { TokenParser } from "./token-parser";
import { Utils } from "../lib/token-utils";
import { ParsedTransactionWithMeta } from "@solana/web3.js";

export class TransactionParser {
    constructor(private transactionSignature: string) {
      this.transactionSignature = this.transactionSignature
    }

    public async parseWithHelius(): Promise<{ message: string; type: 'buy' | 'sell' } | undefined> {
     const apiUrl = `https://api.helius.xyz/v0/transactions/?api-key=${process.env.HELIUS_API_KEY}`
     console.log('Parsing Transaction:', this.transactionSignature);
     
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transactions: [this.transactionSignature],
          }),
        });
  
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
  
        const transactions = await response.json() as Transaction[]
        console.log('Received transactions:', transactions);
        const type: 'buy' | 'sell' = transactions[0].accountData[0].nativeBalanceChange > 0 ? 'sell' : 'buy'

        return { 
            message: transactions[0].description,
            type
        }
      } catch (error) {
        console.error('Error parsing transaction with Helius:', error);
      }
    }

    public async parseNative(transactionDetails: (ParsedTransactionWithMeta | null)[]): Promise<NativeParserInterface | undefined> {
      const tokenParser = new TokenParser(connection)
      const utils = new Utils()

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
      const parsedInfos: any[] = [];

      // console.log('PARSED_TRANSACTION:', transactionDetails)

      const preBalances = transactionDetails[0].meta?.preBalances
      const postBalances = transactionDetails[0].meta?.postBalances

      // Transaction Metadata
      transactionDetails[0].meta?.innerInstructions?.forEach((i: any) => {
        
        i.instructions.forEach((r: any) => {
          if (r.parsed?.type === 'transfer' && r.parsed.info.amount !== undefined) {
            transactions.push(r.parsed);
          }
        });
      });

        transactionDetails[0].transaction.message.instructions.map((instruction: any) => {
          if (transactions.length <= 1 && instruction && instruction.parsed !== undefined) {  
           parsedInfos.push(instruction.parsed)
       
          }
      });

      const nativeBalance = utils.calculateNativeBalanceChanges(transactionDetails)
      
      if (!preBalances || !postBalances) {
        console.log('No balance information available');
        return;
      }
    
      // we have to do this for pumpfun transactions since swap info is not available in its instructions
      let totalSolSwapped = 0;
    
      for (let i = 0; i < preBalances.length; i++) {
        const preBalance = preBalances[i];
        const postBalance = postBalances[i];
        const solDifference = (postBalance - preBalance) / 1e9; // Convert lamports to SOL
      
        if (solDifference !== 0 && i === 2 && nativeBalance?.type === 'sell') {
          totalSolSwapped += Math.abs(solDifference)
        } else if (solDifference !== 0 && i === 3 && nativeBalance?.type === 'buy') {
          totalSolSwapped += Math.abs(solDifference)
          // In case index 3 doesnt hold the amount
        } else if (solDifference === 0 && i === 3 && nativeBalance?.type === 'buy') {
          totalSolSwapped = Math.abs((postBalances[2] - preBalances[2]) / 1e9);
        }
      }
      // TODO: fix, there should be a better way of doing this
      const raydiumTransfer = transactions.length > 2 ? transactions.find((t: any) => t?.info?.destination === transactions[0]?.info?.source) : transactions[transactions.length - 1]

      if (!raydiumTransfer) {
        return 
      }

      // FOR RAYDIUM TRANSACTIONS
      if (transactions.length > 1) {
        // TOKEN OUT
        const tokenOutMint = await utils.getTokenMintAddress(transactions[0]?.info.destination) 
        const tokenOutInfo = await tokenParser.getTokenInfo(tokenOutMint)
        const cleanedTokenOutSymbol = tokenOutInfo.data.symbol.replace(/\x00/g, '');

        // TOKEN IN
        const tokenInMint = await utils.getTokenMintAddress(raydiumTransfer.info.source)
        const tokenInInfo = await tokenParser.getTokenInfo(tokenInMint)
        const cleanedTokenInSymbol = tokenInInfo.data.symbol.replace(/\x00/g, '');

        owner = transactions[0]?.info?.authority || '';
        amountOut = transactions[0]?.info?.amount || 0;
        amountIn = raydiumTransfer.info.amount || '';
        tokenOut = cleanedTokenOutSymbol
        tokenIn = cleanedTokenInSymbol
     
        const swapDescription = `${owner} swapped ${amountOut} ${tokenOut} for ${amountIn} ${tokenIn}`;
       
        return {
          platform: 'raydium',
          description: swapDescription,
          type: nativeBalance?.type,
          balanceChange: nativeBalance?.balanceChange,
          signature: this.transactionSignature,
          tokenTransfers: {
            tokenInMint: tokenInMint,
            tokenOutMint: tokenOutMint,
            tokenAmountIn: amountIn,
            tokenAmountOut: amountOut
          }
        }
      } 

      // FOR PUMP FUN TRANSACTIONS
      if (transactions.length === 1 || transactions.length[0]?.info?.amount === transactions[1]?.info?.amount) {
        // TOKEN OUT
        const tokenOutMint = await utils.getTokenMintAddressWithFallback(transactions)
        const tokenOutInfo = await tokenParser.getTokenInfo(tokenOutMint)
        const cleanedTokenOutSymbol = tokenOutInfo.data.symbol.replace(/\x00/g, '');

        // TOKEN IN
        const tokenInMint = await utils.getTokenMintAddressWithFallback(transactions)
        const tokenInInfo = await tokenParser.getTokenInfo(tokenInMint)
        const cleanedTokenInSymbol = tokenInInfo.data.symbol.replace(/\x00/g, '');

        owner = parsedInfos[0]?.info?.source ? parsedInfos[0]?.info?.source : transactions[0]?.info?.authority
        amountOut = nativeBalance?.type === 'sell' ? transactions[0]?.info?.amount : totalSolSwapped
        amountIn =  nativeBalance?.type === 'sell' ? totalSolSwapped : transactions[0]?.info.amount
        tokenOut = nativeBalance?.type === 'sell' ? cleanedTokenOutSymbol : 'SOL'
        tokenIn = nativeBalance?.type === 'sell' ? 'SOL' : cleanedTokenInSymbol
        
       const swapDescription = `${owner} swapped ${amountOut} ${tokenOut} for ${amountIn} ${tokenIn}`;

       return {
         platform: 'pumpfun',
         description: swapDescription,
         type: nativeBalance?.type,
         balanceChange: nativeBalance?.balanceChange,
         signature: this.transactionSignature,
         tokenTransfers: {
          tokenInMint: nativeBalance?.type === 'sell' ? 'So11111111111111111111111111111111111111112' : tokenInMint,
          tokenOutMint: nativeBalance?.type === 'sell' ? tokenOutMint : 'So11111111111111111111111111111111111111112',
          tokenAmountIn: nativeBalance?.type === 'sell' ? totalSolSwapped : transactions[0]?.info.amount,
          tokenAmountOut: nativeBalance?.type === 'sell' ? transactions[0]?.info?.amount : totalSolSwapped
         }
       }
      }

      return 
  }
}