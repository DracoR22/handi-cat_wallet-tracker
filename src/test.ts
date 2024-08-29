import { connection } from './providers/solana'

export const test = async (transactionSignature: string) => {
  const transactions: any = []

  const transactionDetails = await connection.getParsedTransactions([transactionSignature], {
    maxSupportedTransactionVersion: 0,
  })

  console.log('TRANSACTION_DETAILS', transactionDetails)
}
