import { connection } from './providers/solana'

export const test = async (transactionSignature: string) => {
  const transactions: any = []

  const transactionDetails = await connection.getParsedTransactions([transactionSignature], {
    maxSupportedTransactionVersion: 0,
  })

  // console.log(transactionDetails[0]?.transaction.message.accountKeys)

  const accountKeys = transactionDetails[0]?.transaction.message.accountKeys

  const signerAccount = accountKeys!.find((account) => account.signer === true)

  const signerAccountAddress = signerAccount?.pubkey.toString()

  console.log('SIGNER ACCOUNT', signerAccountAddress)

  // const programIds = transactionDetails[0]?.transaction.message.accountKeys
  //   .map((key) => key.pubkey)
  //   .filter((pubkey) => pubkey !== undefined)

  // const instructions = transactionDetails[0]!.meta?.innerInstructions

  // console.log('INSTRUCTIONS', instructions)
  // console.log('PROGRAMIDS', programIds)
}

test('ALkw5MXZkn4S5r1yrb2HaJHqYSM5d4JxPTLWAp1iP8q7BLiuvQUDXsdM7h5gF3uUDrpdV6z6agb1QQ6qLf1DZrG')
