import { connection } from './providers/solana'

export const test = async (transactionSignature: string) => {
  const transactions: any = []

  const transactionDetails = await connection.getParsedTransactions([transactionSignature], {
    maxSupportedTransactionVersion: 0,
  })

  const programIds = transactionDetails[0]?.transaction.message.accountKeys
    .map((key) => key.pubkey)
    .filter((pubkey) => pubkey !== undefined)

  const instructions = transactionDetails[0]!.meta?.innerInstructions

  console.log('INSTRUCTIONS', instructions)
  console.log('PROGRAMIDS', programIds)
}

test('4V1JZwjNvhBzKoC7k9kMF5r6iSM6TegMYNjMwfZ64481z17FMJgCETWwtHBShh7SzVGf14i4sZbUsdvofFPMKd3w')
