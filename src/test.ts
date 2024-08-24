import { PublicKey } from '@solana/web3.js'
import { connection } from './providers/solana'
import { formatDistanceToNow } from 'date-fns'

export async function getRecentTransactionsCount(walletAddress: any) {
  // Get the current time
  const currentTime = Date.now()

  // Calculate the time 5 minutes ago
  const fiveMinutesAgo = currentTime - 5 * 60 * 1000

  // Fetch recent transaction signatures for the given wallet
  const signatures = await connection.getSignaturesForAddress(new PublicKey(walletAddress))

  // Filter the transactions that occurred in the last 5 minutes
  const recentTransactions = signatures.filter((signatureInfo) => {
    const transactionTime = signatureInfo.blockTime! * 1000 // Convert seconds to milliseconds
    return transactionTime >= fiveMinutesAgo
  })

  // Return the number of transactions in the last 5 minutes
  return recentTransactions.length
}

export async function test(walletAddress: string) {
  const currentTime = Date.now()

  // Calculate the time 5 minutes ago
  const fiveMinutesAgo = currentTime - 5 * 60 * 1000

  // Fetch recent transaction signatures for the given wallet
  const signatures = await connection.getSignaturesForAddress(new PublicKey(walletAddress), { limit: 60 })

  // Filter the transactions that occurred in the last 5 minutes
  const recentTransactions = signatures.filter((signatureInfo) => {
    const transactionTime = signatureInfo.blockTime! * 1000 // Convert seconds to milliseconds
    return transactionTime >= fiveMinutesAgo
  })

  // Return the number of transactions in the last 5 minutes
  console.log('TRANSACTIONS', recentTransactions)
  return recentTransactions
}

export async function getLastWalletTransaction(walletAddress: string) {
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

  const timeAgo = formatDistanceToNow(date, { addSuffix: true })
  console.log('LAST TX DATE:', timeAgo)
  return timeAgo
}
