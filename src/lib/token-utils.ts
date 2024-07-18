import { AccountInfo, ParsedTransactionWithMeta, PublicKey, SystemProgram } from "@solana/web3.js";
import { connection } from "../providers/solana";
// @ts-expect-error
import { getAccount } from "@solana/spl-token";

export class Utils {
    constructor() {}
    public async getTokenMintAddress(tokenAddress: string) {
        try {
          const tokenPublicKey = new PublicKey(tokenAddress);
          const accountInfo = await getAccount(connection, tokenPublicKey);
          return accountInfo.mint.toBase58();
        } catch (error) {
          console.error(`Error fetching mint address for token ${tokenAddress}:`, error);
          return null;
        }
      }

    public async getTokenMintAddressWithFallback(transactions: any) {
        let tokenOutMint = null;
      
        if (transactions[0]?.info?.destination) {
          tokenOutMint = await this.getTokenMintAddress(transactions[0].info.destination);
        }
      
        if (!tokenOutMint && transactions[0]?.info?.source) {
          tokenOutMint = await this.getTokenMintAddress(transactions[0].info.source);
        }
      
        return tokenOutMint;
    }

    public calculateNativeBalanceChanges(transactionDetails: (ParsedTransactionWithMeta | null)[]) {
        const meta = transactionDetails[0] && transactionDetails[0].meta;
        
        if (!meta) {
          console.log('No meta information available');
          return;
        }
      
        const preBalances = meta.preBalances;
        const postBalances = meta.postBalances;
      
        if (!preBalances || !postBalances) {
          console.log('No balance information available');
          return;
        }
      
        const balanceChanges = [];
      
        // Calculate SOL balance changes for each account
        for (let i = 0; i < preBalances.length; i++) {
          const preBalance = preBalances[i];
          const postBalance = postBalances[i];
          const solDifference = (postBalance - preBalance) / 1e9; // Convert lamports to SOL
          
          if (solDifference !== 0) {
            balanceChanges.push({
              accountIndex: i,
              preBalance: preBalance / 1e9, // Convert to SOL
              postBalance: postBalance / 1e9, // Convert to SOL
              change: solDifference
            });
          }
        }
      
        // Log the results
        if (balanceChanges.length > 0) {
          const firstChange = balanceChanges[0];
          // console.log(`Account Index ${firstChange.accountIndex} native balance change:`);
          // console.log(`Pre Balance: ${firstChange.preBalance} SOL`);
          // console.log(`Post Balance: ${firstChange.postBalance} SOL`);
          // console.log(`Change: ${firstChange.change} SOL`);
          // console.log('-----------------------------------');
          const type = firstChange.change > 0 ? 'sell' : 'buy'
          return {
            type,
            balanceChange: firstChange.change
          }
        } else {
          console.log('No balance changes found');
          return {
            type: '',
            balanceChange: ''
          }
        }
      }
    
      public formatNumber(amount: number) { // TODO: Add try catch, just return the function in case of error
          return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount);
      }
}