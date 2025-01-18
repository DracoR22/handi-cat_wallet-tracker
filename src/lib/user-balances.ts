import { PublicKey } from '@solana/web3.js'
import { RpcConnectionManager } from '../providers/solana'

export class UserBalances {
  constructor() {}

  public async userPersonalSolBalance(walletAddress: string): Promise<number | undefined> {
    try {
      const publicKey = new PublicKey(walletAddress)

      const balance = await RpcConnectionManager.connections[0].getBalance(publicKey)

      // Convert lamports to SOL
      const solBalance = balance / 1_000_000_000

      // console.log(`Balance: ${solBalance} SOL`);

      return balance
    } catch (error) {
      console.error('USER_FETCH_BALANCE_ERROR', error)
      return
    }
  }
}
