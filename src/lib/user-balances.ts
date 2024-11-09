import { PublicKey } from '@solana/web3.js'
import { connection } from '../providers/solana'

export class UserBalances {
  constructor() {}

  public async userPersonalSolBalance(walletAddress: string): Promise<number | undefined> {
    try {
      // Create a PublicKey object from the wallet address
      const publicKey = new PublicKey(walletAddress)

      // Fetch the balance
      const balance = await connection.getBalance(publicKey)

      // Convert lamports to SOL (1 SOL = 10^9 lamports)
      const solBalance = balance / 1_000_000_000

      // console.log(`Balance: ${solBalance} SOL`);

      return balance
    } catch (error) {
      console.error('USER_FETCH_BALANCE_ERROR', error)
      return
    }
  }
}
