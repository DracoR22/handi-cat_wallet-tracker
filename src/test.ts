import axios from 'axios'
import { connection } from './providers/solana'
import { UserPlan } from './lib/user-plan'
import { ValidTransactions } from './lib/valid-transactions'
import { TokenUtils } from './lib/token-utils'
import { PublicKey } from '@solana/web3.js'

export const test = async (transactionSignature: string) => {
  const transactions: any = []

  const transactionDetails = await connection.getParsedTransactions([transactionSignature], {
    maxSupportedTransactionVersion: 0,
  })

  transactionDetails[0]?.meta?.innerInstructions?.forEach((i: any) => {
    // raydium
    i.instructions.forEach((r: any) => {
      if (r.parsed?.type === 'transfer' && r.parsed.info.amount !== undefined) {
        transactions.push(r.parsed)
      }
    })
  })

  // console.log(transactionDetails[0]?.transaction.message.accountKeys)

  const accountKeys = transactionDetails[0]?.transaction.message.accountKeys

  const signerAccount = accountKeys?.find((account) => account.signer === true)

  const signerAccountAddress = signerAccount?.pubkey.toString()

  console.log('SIGNER ACCOUNT', signerAccountAddress)

  const programIds = transactionDetails[0]?.transaction.message.accountKeys
    .map((key) => key.pubkey)
    .filter((pubkey) => pubkey !== undefined)

  const instructions = transactionDetails[0]!.meta?.innerInstructions

  // console.log('INSTRUCTIONS', instructions)
  console.log('PROGRAMIDS', programIds)

  const validTransactions = new ValidTransactions(programIds)
  const tokenUtils = new TokenUtils(connection)

  const isValid = validTransactions.getDefiTransaction()
  const tokenInMint = await tokenUtils.getTokenMintAddressWithFallback(transactions)

  const isPumpfun = transactions.length === 1 || transactions.length[0]?.info?.amount === transactions[1]?.info?.amount

  const nativeBalance = tokenUtils.calculateNativeBalanceChanges(transactionDetails)

  console.log('IS VALIIIIIIDD: ', isValid)
  console.log('TOKEN MINTTTT: ', tokenInMint)
  console.log('IS PUMPUNN??: ', isPumpfun)
  console.log('BALANCE CHANGEEE: ', nativeBalance)
}

// test('5vSMSzEFSGgXm3DnD8zxUrdECFx86oujsNb4XognXAj9aTF7T7VAHJEszrNMcNz6SqENJRSpPAinZHvpD9qTkFWb')
// 39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg

export const tes2 = async () => {
  const id = new PublicKey('5qEDi4FfY8NYTrFDgaTvU3HXNP8NazwmVtQBD3WNBBin')

  const accountInfo = await connection.getAccountInfo(id)

  console.log('account info', accountInfo)
}

tes2()
