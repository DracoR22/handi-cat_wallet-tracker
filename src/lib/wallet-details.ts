import { PublicKey } from '@solana/web3.js'
import { RpcConnectionManager } from '../providers/solana'
import { formatDistanceToNow } from 'date-fns'
import { GmgnWalletResponse } from '../types/helius-types'

export class WalletDetails {
  constructor() {}

  public async getLastWalletTx(walletAddress: string) {
    const signatures = await RpcConnectionManager.getRandomConnection().getSignaturesForAddress(
      new PublicKey(walletAddress),
      {
        limit: 1,
      },
    )

    if (signatures.length === 0) {
      console.log('No transactions found for this wallet.')
      return null
    }

    // Get the most recent transaction signature
    const latestSignature = signatures[0].signature

    // Get the transaction details
    const transaction = await RpcConnectionManager.connections[0].getTransaction(latestSignature, {
      maxSupportedTransactionVersion: 0,
    })

    if (transaction?.blockTime === null) {
      console.log('Block time not available for this transaction.')
      return null
    }

    // Convert the Unix timestamp to a JavaScript Date object
    const date = new Date(transaction!.blockTime! * 1000)

    const timeAgo = formatDistanceToNow(date, { addSuffix: true })
    console.log('LAST TX DATE:', timeAgo)
    return timeAgo
  }

  public async getWalletPNL(walletAddress: string): Promise<GmgnWalletResponse | undefined> {
    try {
      const res = await fetch(`https://gmgn.ai/defi/quotation/v1/smartmoney/sol/walletNew/${walletAddress}?period=7d`)

      const data = await res.json()

      return data.data
    } catch (error) {
      console.log('GMGN_API_ERROR', error)
      return
    }
  }
}
