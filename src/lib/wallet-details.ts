import { PublicKey } from '@solana/web3.js'
import { connection } from '../providers/solana'

export class WalletDetails {
  constructor() {}

  public async getLastWalletTx(walletAddress: string) {
    // Get the transaction signatures for the wallet
    const signatures = await connection.getSignaturesForAddress(new PublicKey(walletAddress), {
      limit: 1, // We only need the most recent transaction
    })

    if (signatures.length === 0) {
      console.log('No transactions found for this wallet.')
      return null
    }

    // Get the most recent transaction signature
    const latestSignature = signatures[0].signature

    // Get the transaction details
    const transaction = await connection.getTransaction(latestSignature, {
      maxSupportedTransactionVersion: 0,
    })

    if (transaction?.blockTime === null) {
      console.log('Block time not available for this transaction.')
      return null
    }

    // Convert the Unix timestamp to a JavaScript Date object
    const date = new Date(transaction!.blockTime! * 1000)
    console.log('LAST TX DATE:', date.toString())
    return date
  }
}
