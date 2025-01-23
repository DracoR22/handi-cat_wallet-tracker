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

function isRelevantTransaction(logs: Logs): { isRelevant: boolean; program: SwapType } {
  // Guard clause for empty logs
  if (!logs.logs || logs.logs.length === 0) {
    return { isRelevant: false, program: null }
  }

  // Join logs into a single string for searching
  const logString = logs.logs.join(' ')

  // Check programs one by one and return the first match
  if (logString.includes(PUMP_FUN_PROGRAM_ID)) {
    return { isRelevant: true, program: 'pumpfun' }
  }
  if (logString.includes(RAYDIUM_PROGRAM_ID)) {
    return { isRelevant: true, program: 'raydium' }
  }
  if (logString.includes(JUPITER_PROGRAM_ID)) {
    return { isRelevant: true, program: 'jupiter' }
  }
  if (logString.includes(PUMP_FUN_TOKEN_MINT_AUTH)) {
    return { isRelevant: true, program: 'mint_pumpfun' }
  }

  return { isRelevant: false, program: null }
}

const programIds = [PUMP_FUN_PROGRAM_ID, RAYDIUM_PROGRAM_ID, JUPITER_PROGRAM_ID]

export const test2 = async () => {
  const walletAddresses = [
    'DfMxre4cKmvogbLrPigxmibVTTQDuzjdXojWzjCXXhzj',
    'AsX67niuMc9F91tQFeHvHiUEAnXwam4VoHTbRZ84935W',
    'JDWmTTSZv2wkRkRKkeXa44j8Q7M4SW3XFMwYYBf7hwdi',
  ]

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

export const parseTransactions = async () => {
  try {
    const transactionDetails = await RpcConnectionManager.getRandomConnection().getParsedTransactions(
      ['BvD2soJSDVa38xmZbt5ghHJ6KoXykiYVDHQKrJctipMnb6kKjZVfKFJzhi1SghMkbeMKcFSSy5S5yoBKzn4cbYu'],
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

    const raydiumTransfer =
      transactions.length > 2
        ? transactions.find((t: any) => t?.info?.destination === transactions[0]?.info?.source)
        : transactions[transactions.length - 1]

    if (!raydiumTransfer) {
      console.log('NO RAYDIUM TRANSFER')
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

async function getTokenHoldings(walletAddress: string, tokenMintAddress: string) {
  try {
    const walletPublicKey = new PublicKey(walletAddress)
    const tokenMintPublicKey = new PublicKey(tokenMintAddress)

    const associatedTokenAddress = await getAssociatedTokenAddress(tokenMintPublicKey, walletPublicKey)
    const tokenAccountInfo = await getAccount(RpcConnectionManager.connections[0], associatedTokenAddress)

    const tokenSupply = await RpcConnectionManager.connections[0].getTokenSupply(tokenMintPublicKey)
    const supplyValue = tokenSupply.value.uiAmount

    if (!supplyValue) return

    const percentage = (Number(tokenAccountInfo.amount) / Number(tokenSupply.value.amount)) * 100

    const fixedPercentage = percentage > 0 ? `${percentage.toFixed(2)}%` : '0%'

    console.log('BALANCE: ', FormatNumbers.formatTokenAmount(Number(tokenAccountInfo.amount)))
    console.log('PERCENTAGE', fixedPercentage)
    return {
      balance: tokenAccountInfo.amount.toString(),
      decimals: tokenAccountInfo.decimals,
    }
  } catch (error) {
    console.log('Error fetching token holdings:', error)

    // Return zero if account doesn't exist or an error occurs
    if (error) {
      return { balance: '0', decimals: 0 }
    }

    return
  }
}

getTokenHoldings('', '')
// parseTransactions()
// test2()
