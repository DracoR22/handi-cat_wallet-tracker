import { connection } from './providers/solana'

export const test = async (transactionSignature: string) => {
  const transactions: any = []

  const transactionDetails = await connection.getParsedTransactions([transactionSignature], {
    maxSupportedTransactionVersion: 0,
  })

  const programIds = transactionDetails[0]?.transaction.message.accountKeys
    .map((key) => key.pubkey)
    .filter((pubkey) => pubkey !== undefined)

  console.log('PROGRAMIDS', programIds)
}
