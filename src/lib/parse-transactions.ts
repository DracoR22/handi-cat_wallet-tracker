import { SolanaParser } from "@debridge-finance/solana-transaction-parser";
import { Transaction } from "../types/helius-types";

export class ParseTransactions {
    constructor(private transaction: string) {
      this.transaction = this.transaction
    }

    public async parseWithHelius(): Promise<{ message: string; type: 'buy' | 'sell' } | undefined> {
     const apiUrl = `https://api.helius.xyz/v0/transactions/?api-key=${process.env.HELIUS_API_KEY}`
    console.log('Parsing Transaction:', this.transaction);
     
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transactions: [this.transaction],
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

    public async parseNative() {
        const parser = new SolanaParser([{}])
    }
}