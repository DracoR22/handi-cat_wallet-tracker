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
  PUMPFUN_AMM_PROGRAM_ID,
  RAYDIUM_PROGRAM_ID,
} from './config/program-ids'
import { SwapType } from './types/swap-types'
import chalk from 'chalk'
import { FormatNumbers } from './lib/format-numbers'

// @ts-expect-error
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token'
import { TokenMarketPrice } from './markets/token-market-price'

type TestSwapType = 'pumpfun' | 'raydium' | 'jupiter' | 'mint_pumpfun' | 'sol_transfer' | 'pumpfun_amm' | null

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
  if (logString.includes(PUMPFUN_AMM_PROGRAM_ID)) {
    return { isRelevant: true, program: 'pumpfun_amm' }
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
      ['5phw7ToFHTvfdvTZ8m1S59xiJoA8opraB5td8sB4UGFzt7eYMAdL2xdJtKBRw8etcW8GzmDS1SH2TbeeDT1hsStb'],
      {
        maxSupportedTransactionVersion: 0,
      },
    )

    const tokenMarketPrice = new TokenMarketPrice(RpcConnectionManager.connections[0])

    let owner = ''
    let amountIn = ''
    let tokenIn = ''
    let amountOut = ''
    let tokenOut = ''

    let currentHoldingPrice = ''
    let currentHoldingPercentage = ''

    // TODO!
    let isNew = false

    const transactions: any = []

    let tokenInMint: string = ''
    let tokenOutMint: string = ''

    // let solPrice: string | undefined = ''

    // console.log('PARSED_TRANSACTION:', transactionDetails)

    const accountKeys = transactionDetails[0]?.transaction.message.accountKeys

    if (!accountKeys) {
      console.log('Account keys not found in transaction details.', transactionDetails)
      return
    }

    const signerAccount = accountKeys!.find((account) => account.signer === true)

    const signerAccountAddress = signerAccount?.pubkey.toString()

    const preBalances = transactionDetails[0]?.meta?.preBalances
    const postBalances = transactionDetails[0]?.meta?.postBalances

    console.log('PREBALANCE', preBalances?.length)
    console.log('POSTBALANCE', postBalances?.length)

    // Transaction Metadata
    if (swap === 'pumpfun' || swap === 'jupiter' || swap === 'mint_pumpfun' || swap === 'raydium') {
      transactionDetails[0]?.meta?.innerInstructions?.forEach((i: any) => {
        // raydium
        i.instructions.forEach((r: any) => {
          if (r.parsed?.type === 'transfer' && r.parsed.info.amount !== undefined) {
            transactions.push(r.parsed)
          }
        })
      })
    } else if (swap === 'pumpfun_amm') {
      transactionDetails[0]?.meta?.innerInstructions?.forEach((i: any) => {
        // raydium
        i.instructions.forEach((r: any) => {
          if (r.parsed !== undefined && r.parsed.type === 'transferChecked') {
            transactions.push(r.parsed)
          }
        })
      })
    }

    const tokenUtils = new TokenUtils(RpcConnectionManager.connections[0])
    const nativeBalance = tokenUtils.calculateNativeBalanceChanges(transactionDetails)
    // console.log('native balance', nativeBalance)

    if (!preBalances || !postBalances) {
      console.log('No balance information available')
      return
    }

    // we have to do this for pumpfun transactions since swap info is not available in its instructions
    let totalSolSwapped = 0
    let solChange = 0

    if (preBalances && postBalances && preBalances.length === postBalances.length) {
      for (let i = 0; i < preBalances.length; i++) {
        const preBalance = preBalances[i]
        const postBalance = postBalances[i]

        const solDifference = (postBalance - preBalance) / 1e9

        // For sells we track SOL decrease across all indexes
        if (solDifference < 0 && nativeBalance?.type === 'sell') {
          totalSolSwapped += Math.abs(solDifference)
        }

        if (solDifference > 0 && nativeBalance?.type === 'buy' && i === 4) {
          totalSolSwapped += Math.abs(solDifference)
        } else if (solDifference === 0 && i === 4 && nativeBalance?.type === 'buy') {
          totalSolSwapped = Math.abs((postBalances[2]! - preBalances[2]!) / 1e9)
        }
      }
    }

    console.log('Total SOL Swapped:', totalSolSwapped)

    const raydiumTransfer =
      transactions.length > 2
        ? transactions.find((t: any) => t?.info?.destination === transactions[0]?.info?.source)
        : transactions[transactions.length - 1]

    if (!raydiumTransfer && swap !== 'pumpfun_amm') {
      console.log('NO RAYDIUM TRANSFER')
      return
    }

    if (swap === 'pumpfun_amm' && transactions.length < 2) {
      return
    }

    if (swap === 'pumpfun_amm') {
      if (nativeBalance?.type === 'sell') {
        tokenOutMint = transactions[0]?.info.mint
        tokenInMint = 'So11111111111111111111111111111111111111112'

        const tokenOutInfo = await tokenUtils.getParsedTokenInfo(tokenOutMint)

        tokenOut = tokenOutInfo.data.symbol.replace(/\x00/g, '')
        tokenIn = 'SOL'
      } else {
        tokenInMint = transactions[0]?.info.mint
        tokenOutMint = 'So11111111111111111111111111111111111111112'

        if (tokenInMint === null) {
          console.log('NO TOKEN IN MINT')
          return
        }

        const tokenInInfo = await tokenUtils.getParsedTokenInfo(tokenInMint)

        tokenIn = tokenInInfo.data.symbol.replace(/\x00/g, '')
        tokenOut = 'SOL'
      }

      const formattedAmount = FormatNumbers.formatTokenAmount(Number(transactions[0]?.info?.tokenAmount.amount) || 0)

      owner = signerAccountAddress || ''
      amountOut = nativeBalance?.type === 'sell' ? formattedAmount : totalSolSwapped.toString()
      amountIn = nativeBalance?.type === 'sell' ? totalSolSwapped.toString() : formattedAmount

      const swapDescription = `${owner} swapped ${amountOut} ${tokenOut} for ${amountIn} ${tokenIn}`

      let tokenMc: number | null | undefined = null

      // get the token price and market cap for raydium

      const tokenPrice = await tokenMarketPrice.getTokenPricePumpFunAMM(
        transactions,
        nativeBalance?.type as 'buy' | 'sell',
        Number(128),
      )

      const tokenToMc = tokenInMint === 'So11111111111111111111111111111111111111112' ? tokenOutMint : tokenInMint

      if (tokenPrice) {
        const { tokenMarketCap, supplyAmount } = await tokenMarketPrice.getTokenMktCap(tokenPrice, tokenToMc, true)
        tokenMc = tokenMarketCap

        const tokenHoldings = await tokenUtils.getTokenHoldings(owner, tokenToMc, supplyAmount, true)

        currentHoldingPercentage = tokenHoldings.percentage
        currentHoldingPrice = tokenHoldings.balance
      }

      // console.log('TRANSACTION', transactions)

      console.log('HOLDING PERCENTAGE: ', currentHoldingPercentage)

      const formattedMarketCap = tokenMc ? FormatNumbers.formatPrice(tokenMc) : undefined

      console.log('TOKEN PRICE: ', tokenPrice)

      console.log(swapDescription)

      console.log('TOKEN MARKET CAP: ', formattedMarketCap)
      console.log('TOKEN OUT: ', tokenOutMint)
      console.log('TOKEN IN: ', tokenInMint)
      console.log('AMOUNT OUT: ', amountOut)
      console.log('AMOUNT IN: ', amountIn)

      return
    }
    // for raydium transactions
    if (transactions.length > 1) {
      if (nativeBalance?.type === 'sell') {
        tokenOutMint = await tokenUtils.getTokenMintAddress(transactions[0]?.info.destination)
        tokenInMint = 'So11111111111111111111111111111111111111112'

        if (tokenOutMint === null) {
          console.log('NO TOKEN OUT MINT')
          return
        }

        const tokenOutInfo = await tokenUtils.getParsedTokenInfo(tokenOutMint)

        tokenOut = tokenOutInfo.data.symbol.replace(/\x00/g, '')
        tokenIn = 'SOL'
      } else {
        tokenInMint = await tokenUtils.getTokenMintAddress(raydiumTransfer.info.source)
        tokenOutMint = 'So11111111111111111111111111111111111111112'

        if (tokenInMint === null) {
          console.log('NO TOKEN IN MINT')
          return
        }

        const tokenInInfo = await tokenUtils.getParsedTokenInfo(tokenInMint)

        tokenIn = tokenInInfo.data.symbol.replace(/\x00/g, '')
        tokenOut = 'SOL'
      }

      const formattedAmountOut = FormatNumbers.formatTokenAmount(Number(transactions[0]?.info?.amount))
      const formattedAmountIn = FormatNumbers.formatTokenAmount(Number(raydiumTransfer?.info?.amount))

      owner = signerAccountAddress || ''
      amountOut =
        tokenOut === 'SOL' ? (Number(transactions[0]?.info?.amount) / 1e9).toFixed(2).toString() : formattedAmountOut
      amountIn =
        tokenIn === 'SOL' ? (Number(raydiumTransfer.info.amount) / 1e9).toFixed(2).toString() : formattedAmountIn

      let tokenMc: number | null | undefined = null
      let raydiumTokenPrice: number | null | undefined = null

      const swapDescription = `${owner} swapped ${amountOut} ${tokenOut} for ${amountIn} ${tokenIn}`

      // get the token price and market cap for raydium
      if (transactions.length[0]?.info?.amount !== transactions[1]?.info?.amount) {
        const tokenPrice = await tokenMarketPrice.getTokenPriceRaydium(
          transactions,
          nativeBalance?.type as 'buy' | 'sell',
          Number(0),
        )

        const tokenToMc = tokenInMint === 'So11111111111111111111111111111111111111112' ? tokenOutMint : tokenInMint

        if (tokenPrice) {
          const { tokenMarketCap, supplyAmount } = await tokenMarketPrice.getTokenMktCap(tokenPrice, tokenToMc, false)
          tokenMc = tokenMarketCap
          raydiumTokenPrice = tokenPrice

          const tokenHoldings = await tokenUtils.getTokenHoldings(owner, tokenToMc, supplyAmount, false)

          currentHoldingPercentage = tokenHoldings.percentage
          currentHoldingPrice = tokenHoldings.balance
        }
      }

      console.log(swapDescription)

      return {
        platform: swap,
        owner: owner,
        description: swapDescription,
        type: nativeBalance?.type,
        balanceChange: nativeBalance?.balanceChange,
        signature: '',
        swappedTokenMc: tokenMc,
        swappedTokenPrice: raydiumTokenPrice,
        solPrice: '',
        currenHoldingPercentage: currentHoldingPercentage,
        currentHoldingPrice: currentHoldingPrice,
        isNew: isNew,
        tokenTransfers: {
          tokenInSymbol: tokenIn,
          tokenInMint: tokenInMint,
          tokenAmountIn: amountIn,
          tokenOutSymbol: tokenOut,
          tokenOutMint: tokenOutMint,
          tokenAmountOut: amountOut,
        },
      }
    }

    // for pump fun transactions
    if (transactions.length === 1 || transactions.length[0]?.info?.amount === transactions[1]?.info?.amount) {
      if (nativeBalance?.type === 'sell') {
        tokenOutMint = await tokenUtils.getTokenMintAddressWithFallback(transactions)
        tokenInMint = 'So11111111111111111111111111111111111111112'

        if (tokenOutMint === null) {
          console.log('NO TOKEN OUT MINT')
          return
        }

        const tokenOutInfo = await tokenUtils.getParsedTokenInfo(tokenOutMint)

        tokenOut = tokenOutInfo.data.symbol.replace(/\x00/g, '')
        tokenIn = 'SOL'
      } else {
        tokenOutMint = 'So11111111111111111111111111111111111111112'
        tokenInMint = await tokenUtils.getTokenMintAddressWithFallback(transactions)

        if (tokenInMint === null) {
          console.log('NO TOKEN IN MINT')
          return
        }

        const tokenInInfo = await tokenUtils.getParsedTokenInfo(tokenInMint)

        tokenIn = tokenInInfo.data.symbol.replace(/\x00/g, '')
        tokenOut = 'SOL'
      }

      const formattedAmount = FormatNumbers.formatTokenAmount(Number(transactions[0]?.info?.amount))

      // owner = signerAccountAddress ? signerAccountAddress : transactions[0]?.info?.authority
      owner = signerAccountAddress || ''
      amountOut = nativeBalance?.type === 'sell' ? formattedAmount : totalSolSwapped.toFixed(2).toString()
      amountIn = nativeBalance?.type === 'sell' ? totalSolSwapped.toFixed(2).toString() : formattedAmount

      // console.log('OWNER', signerAccountAddress)
      const swapDescription = `${owner} swapped ${amountOut} ${tokenOut} for ${amountIn} ${tokenIn}`

      let tokenMc: number | null | undefined = null

      // get the token price and market cap for pumpfun

      const tokenToMc = tokenInMint === 'So11111111111111111111111111111111111111112' ? tokenOutMint : tokenInMint

      const tokenPrice = await tokenMarketPrice.getTokenPricePumpFun(tokenToMc, '0')
      // console.log('TOKEN PRICE:', tokenPrice)
      if (tokenPrice) {
        const { tokenMarketCap, supplyAmount } = await tokenMarketPrice.getTokenMktCap(tokenPrice, tokenToMc, true)
        tokenMc = tokenMarketCap

        const tokenHoldings = await tokenUtils.getTokenHoldings(owner, tokenToMc, supplyAmount, true)

        currentHoldingPercentage = tokenHoldings.percentage
        currentHoldingPrice = tokenHoldings.balance
      }

      console.log(swapDescription)

      return {
        platform: swap,
        owner: signerAccountAddress,
        description: swapDescription,
        type: nativeBalance?.type,
        balanceChange: nativeBalance?.balanceChange,
        signature: '',
        swappedTokenMc: tokenMc,
        swappedTokenPrice: tokenPrice,
        solPrice: 0,
        isNew: isNew,
        currenHoldingPercentage: currentHoldingPercentage,
        currentHoldingPrice: currentHoldingPrice,
        tokenTransfers: {
          tokenInSymbol: tokenIn,
          tokenInMint: tokenInMint,
          tokenAmountIn: amountIn,
          tokenOutSymbol: tokenOut,
          tokenOutMint: tokenOutMint,
          tokenAmountOut: amountOut,
        },
      }
    }
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
parseTransactions('pumpfun_amm')
// test2()
