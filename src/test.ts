import axios from 'axios'
import { RpcConnectionManager } from './providers/solana'
import { UserPlan } from './lib/user-plan'
import { ValidTransactions } from './lib/valid-transactions'
import { TokenUtils } from './lib/token-utils'
import { Logs, PublicKey } from '@solana/web3.js'
import {
  JUPITER_PROGRAM_ID,
  PUMP_FUN_PROGRAM_ID,
  PUMP_FUN_TOKEN_MINT_AUTH,
  RAYDIUM_PROGRAM_ID,
} from './config/program-ids'
import { SwapType } from './types/swap-types'
import chalk from 'chalk'
import { TokenParser } from './parsers/token-parser'
import { FormatNumbers } from './lib/format-numbers'

// @ts-expect-error
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token'

type TestSwapType = 'pumpfun' | 'raydium' | 'jupiter' | 'mint_pumpfun' | 'sol_transfer' | null

function isRelevantTransaction(logs: Logs): { isRelevant: boolean; program: TestSwapType } {
  // Guard clause for empty logs
  if (!logs.logs || logs.logs.length === 0) {
    return { isRelevant: false, program: null }
  }

  // Join logs into a single string for searching
  const logString = logs.logs.join(' ')

  console.log('LOGS', logs.logs)

  if (logString.includes(PUMP_FUN_TOKEN_MINT_AUTH)) {
    return { isRelevant: true, program: 'mint_pumpfun' }
  }
  if (logString.includes(PUMP_FUN_PROGRAM_ID)) {
    return { isRelevant: true, program: 'pumpfun' }
  }
  if (logString.includes(RAYDIUM_PROGRAM_ID)) {
    return { isRelevant: true, program: 'raydium' }
  }
  if (logString.includes(JUPITER_PROGRAM_ID)) {
    return { isRelevant: true, program: 'jupiter' }
  }

  // O(n) Solution. This way we save rpc calls by excluding bulk transfers e.g: ads like solcasino micro transfers
  // const systemProgramCount = logs.logs.filter((log) => log.includes('11111111111111111111111111111111')).length

  // if (systemProgramCount > 0 && systemProgramCount <= 2) {
  //   return { isRelevant: true, program: 'sol_transfer' }
  // }

  // O(1) Solution
  let systemProgramCount = 0

  for (const log of logs.logs) {
    if (log.includes('11111111111111111111111111111111')) {
      systemProgramCount++
      if (systemProgramCount > 2) break
    }
  }

  if (systemProgramCount > 0 && systemProgramCount <= 2) {
    return { isRelevant: true, program: 'sol_transfer' }
  }

  return { isRelevant: false, program: null }
}

const programIds = [PUMP_FUN_PROGRAM_ID, RAYDIUM_PROGRAM_ID, JUPITER_PROGRAM_ID]

export const test2 = async () => {
  const walletAddresses = ['5vbVfRkfTv37CJW8mbgx3boM5rWbEirCZddP2z2wZ5jp']

  for (const walletAddress of walletAddresses) {
    const publicKey = new PublicKey(walletAddress)
    console.log('watching transactions for: ', publicKey.toBase58())

    const subscriptionId = RpcConnectionManager.logConnection.onLogs(
      publicKey,
      async (logs, ctx) => {
        const { isRelevant, program } = isRelevantTransaction(logs)

        if (!isRelevant) {
          console.log(chalk.redBright('NO RELEVANT', logs.signature))
          return
        }

        console.log(chalk.greenBright('YES ITS RELEVANT', logs.signature))
        console.log('Program:', program)
      },
      'processed',
    )
  }
}

export const parseTransactions = async (swap: TestSwapType) => {
  try {
    const transactionDetails = await RpcConnectionManager.getRandomConnection().getParsedTransactions(
      ['1EhsniqDepkoUb7bZ8ew2J7gQfLM5kLTaUi6BCe4bHNGGrR7q9NedE2j51Hg57ki1MwKAayJ9UhpFaQEpCzpyAN'],
      {
        maxSupportedTransactionVersion: 0,
      },
    )

    const transactions: any = []
    const parsedInfos: any[] = []

    if (!transactionDetails) return

    // Transaction Metadata
    transactionDetails[0]?.meta?.innerInstructions?.forEach((i: any) => {
      // raydium
      i.instructions.forEach((r: any) => {
        if (r.parsed?.type === 'transfer' && r.parsed.info.amount !== undefined) {
          transactions.push(r.parsed)
        }
      })
    })

    // pumpfun
    transactionDetails[0]?.transaction.message.instructions.map((instruction: any) => {
      if (transactions.length <= 1 && instruction && instruction.parsed !== undefined) {
        parsedInfos.push(instruction.parsed)
      }
    })

    if (swap === 'sol_transfer') {
      transactionDetails[0]?.transaction.message.instructions.map((instruction: any) => {
        if (transactions.length <= 1 && instruction && instruction.parsed !== undefined) {
          transactions.push(instruction.parsed)
        }
      })
    } else {
      transactionDetails[0]?.meta?.innerInstructions?.forEach((i: any) => {
        // raydium
        i.instructions.forEach((r: any) => {
          if (r.parsed?.type === 'transfer' && r.parsed.info.amount !== undefined) {
            transactions.push(r.parsed)
          }
        })
      })
    }

    // transfers
    console.log('transaction', transactions)

    const raydiumTransfer =
      transactions.length > 2
        ? transactions.find((t: any) => t?.info?.destination === transactions[0]?.info?.source)
        : transactions[transactions.length - 1]

    if (!raydiumTransfer) {
      console.log('NO RAYDIUM TRANSFER', transactionDetails[0]?.transaction.message.instructions)
      return
    }

    const formatNumbers = new FormatNumbers()

    const formattedAmountIn = FormatNumbers.formatTokenAmount(Number(raydiumTransfer?.info?.amount))
    const formattedAmountOut = FormatNumbers.formatTokenAmount(Number(transactions[0]?.info?.amount))

    console.log('amount out', transactions[0]?.info?.amount)
    console.log('amount in', raydiumTransfer?.info?.amount)
    console.log('formatted amount in:', formattedAmountIn)
    console.log('formatted amount out: ', formattedAmountOut)

    const preBalances = transactionDetails[0]?.meta?.preBalances
    const postBalances = transactionDetails[0]?.meta?.postBalances

    if (!preBalances || !postBalances) {
      console.log('No balance information available')
      return
    }

    let totalSolSwapped = 0

    for (let i = 0; i < preBalances.length; i++) {
      const preBalance = preBalances[i]
      const postBalance = postBalances[i]

      console.log(`PRE BALANCE [${i}]: `, preBalance)
      console.log(`POST BALANCE [${i}]: `, postBalance)

      const solDifference = (postBalance! - preBalance!) / 1e9 // Convert lamports to SOL

      console.log('SOL DIFFERENCE: ', solDifference)

      if (solDifference < 0 && i === 1) {
        totalSolSwapped += Math.abs(solDifference)
        // break
      } else if (solDifference < 0 && i === 2) {
        totalSolSwapped += Math.abs(solDifference)
        // break
      } else if (solDifference < 0 && i === 5) {
        totalSolSwapped += Math.abs(solDifference)
        // break
      }
    }

    console.log('TOTAL SOL SWAPPED', totalSolSwapped)
  } catch (error) {
    console.log('GET_PARSED_TRANSACTIONS_ERROR', error)
    return
  }
}

export const parseTransfers = async () => {
  try {
    const transactionDetails = await RpcConnectionManager.getRandomConnection().getParsedTransactions(
      ['4Qn6UFtVLetxEGTFrWFjv3L5vaN48fpZE7MK7JJq2KjbeEMMXQ41crSzxVbUpt7sJq2ZLoEHfMqwYUz7GR4AUxhD'],
      {
        maxSupportedTransactionVersion: 0,
      },
    )

    const transactions: any = []

    if (!transactionDetails) return

    // Transaction Metadata
    transactionDetails[0]?.meta?.innerInstructions?.forEach((i: any) => {
      i.instructions.forEach((r: any) => {
        if (r.parsed?.type === 'transfer' && r.parsed.info.amount !== undefined) {
          transactions.push(r.parsed)
        }
      })
    })

    // transactionDetails[0]?.transaction.message.instructions.forEach((instruction: any) => {
    //   if (instruction?.parsed?.type === 'transfer' && transactions.length <= 1) {
    //     transactions.push(instruction.parsed) // Only push transfers
    //   }
    // })
    transactionDetails[0]?.transaction.message.instructions.map((instruction: any) => {
      if (transactions.length <= 1 && instruction && instruction.parsed !== undefined) {
        transactions.push(instruction.parsed)
      }
    })

    // transfers
    console.log('transaction', transactions)

    const amount = (transactions[0].info.lamports ?? transactions[0].info.amount) / 1e9

    console.log(`${transactions[0].info.source} transfered ${amount} SOL to ${transactions[0].info.destination}`)
  } catch {
    console.log('PARSE_TRANSFERS_ERROR')
    return
  }
}

// parseTransfers()
// parseTransactions('sol_transfer')
test2()
