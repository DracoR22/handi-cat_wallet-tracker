import { TokenParser } from './token-parser'
import { TokenUtils } from '../lib/token-utils'
import { Connection, ParsedTransactionWithMeta } from '@solana/web3.js'
import { SwapType } from '../types/swap-types'
import { FormatNumbers } from '../lib/format-numbers'
import { NativeParserInterface, TransferParserInterface } from '../types/general-interfaces'
import { RpcConnectionManager } from '../providers/solana'

export class TransactionParser {
  private tokenUtils: TokenUtils
  private tokenParser: TokenParser
  private connection: Connection
  constructor(private transactionSignature: string) {
    this.connection = RpcConnectionManager.connections[0]
    this.tokenUtils = new TokenUtils(this.connection)
    this.transactionSignature = this.transactionSignature
    this.tokenParser = new TokenParser(this.connection)
  }

  public async parseDefiTransaction(
    transactionDetails: (ParsedTransactionWithMeta | null)[],
    swap: SwapType,
    solPriceUsd: string | undefined,
    walletAddress: string,
  ): Promise<NativeParserInterface | undefined> {
    try {
      if (transactionDetails === undefined) {
        console.log('Transaction not found or invalid.')
        return
      }

      let owner = ''
      let amountIn = ''
      let tokenIn = ''
      let amountOut = ''
      let tokenOut = ''

      let currentHoldingPrice = ''
      let currenHoldingPercentage = ''

      // TODO!
      let isNew = false

      const transactions: any = []
      const parsedInfos: any[] = []

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

      // console.log('transaction', transactions)

      const nativeBalance = this.tokenUtils.calculateNativeBalanceChanges(transactionDetails)
      // console.log('native balance', nativeBalance)

      if (!preBalances || !postBalances) {
        console.log('No balance information available')
        return
      }

      // we have to do this for pumpfun transactions since swap info is not available in its instructions
      let totalSolSwapped = 0

      for (let i = 0; i < preBalances.length; i++) {
        const preBalance = preBalances[i]
        const postBalance = postBalances[i]

        const solDifference = (postBalance! - preBalance!) / 1e9 // Convert lamports to SOL

        if (solDifference < 0 && i === 1 && nativeBalance?.type === 'sell') {
          totalSolSwapped += Math.abs(solDifference)
        } else if (solDifference < 0 && i === 2 && nativeBalance?.type === 'sell') {
          totalSolSwapped += Math.abs(solDifference)
        } else if (solDifference < 0 && i === 5 && nativeBalance?.type === 'sell') {
          totalSolSwapped += Math.abs(solDifference)
        } else if (solDifference !== 0 && i === 3 && nativeBalance?.type === 'buy') {
          totalSolSwapped += Math.abs(solDifference)
          // In case index 3 doesnt hold the amount
        } else if (solDifference === 0 && i === 3 && nativeBalance?.type === 'buy') {
          totalSolSwapped = Math.abs((postBalances[2]! - preBalances[2]!) / 1e9)
        }
      }

      // TODO: fix, there should be a better way of doing this
      const raydiumTransfer =
        transactions.length > 2
          ? transactions.find((t: any) => t?.info?.destination === transactions[0]?.info?.source)
          : transactions[transactions.length - 1]

      if (!raydiumTransfer) {
        console.log('NO RAYDIUM TRANSFER')
        return
      }

      // solPrice = await this.tokenUtils.getSolPriceGecko()

      // if (!solPrice) {
      //   solPrice = await this.tokenUtils.getSolPriceNative()
      // }

      // const solPrice = ''

      // for raydium transactions
      if (transactions.length > 1) {
        if (nativeBalance?.type === 'sell') {
          tokenOutMint = await this.tokenUtils.getTokenMintAddress(transactions[0]?.info.destination)
          tokenInMint = 'So11111111111111111111111111111111111111112'

          if (tokenOutMint === null) {
            console.log('NO TOKEN OUT MINT')
            return
          }

          const tokenOutInfo = await this.tokenParser.getTokenInfo(tokenOutMint)

          tokenOut = tokenOutInfo.data.symbol.replace(/\x00/g, '')
          tokenIn = 'SOL'
        } else {
          tokenInMint = await this.tokenUtils.getTokenMintAddress(raydiumTransfer.info.source)
          tokenOutMint = 'So11111111111111111111111111111111111111112'

          if (tokenInMint === null) {
            console.log('NO TOKEN IN MINT')
            return
          }

          const tokenInInfo = await this.tokenParser.getTokenInfo(tokenInMint)

          tokenIn = tokenInInfo.data.symbol.replace(/\x00/g, '')
          tokenOut = 'SOL'
        }

        // const [tokenOutMint, tokenInMint] = await Promise.all([
        //   this.tokenUtils.getTokenMintAddress(transactions[0]?.info.destination),
        //   this.tokenUtils.getTokenMintAddress(raydiumTransfer.info.source),
        // ])

        // console.log('TOKEN OUT MINTTT', tokenOutMint)
        // console.log('TOKEN IN MINTTTT', tokenInMint)

        // const [tokenOutInfo, tokenInInfo] = await Promise.all([
        //   this.tokenParser.getTokenInfo(tokenOutMint),
        //   this.tokenParser.getTokenInfo(tokenInMint),
        // ])

        // // const tokenOutInfo = await this.tokenParser.getTokenInfo(tokenOutMint)
        // const cleanedTokenOutSymbol = tokenOutInfo.data.symbol.replace(/\x00/g, '')

        // // const tokenInInfo = await this.tokenParser.getTokenInfo(tokenInMint)
        // const cleanedTokenInSymbol = tokenInInfo.data.symbol.replace(/\x00/g, '')

        const formattedAmountOut = FormatNumbers.formatTokenAmount(Number(transactions[0]?.info?.amount))
        const formattedAmountIn = FormatNumbers.formatTokenAmount(Number(raydiumTransfer?.info?.amount))

        // owner = parsedInfos[0]?.info?.source ? parsedInfos[0]?.info?.source : transactions[0]?.info?.authority
        // owner = signerAccountAddress ? signerAccountAddress : transactions[0]?.info?.authority
        owner = walletAddress
        amountOut =
          tokenOut === 'SOL' ? (Number(transactions[0]?.info?.amount) / 1e9).toFixed(2).toString() : formattedAmountOut
        amountIn =
          tokenIn === 'SOL' ? (Number(raydiumTransfer.info.amount) / 1e9).toFixed(2).toString() : formattedAmountIn

        // tokenOut = cleanedTokenOutSymbol
        // tokenIn = cleanedTokenInSymbol

        let tokenMc: number | null | undefined = null
        let raydiumTokenPrice: number | null | undefined = null

        const swapDescription = `${owner} swapped ${amountOut} ${tokenOut} for ${amountIn} ${tokenIn}`

        // get the token price and market cap for raydium
        if (transactions.length[0]?.info?.amount !== transactions[1]?.info?.amount) {
          const tokenPrice = await this.tokenUtils.getTokenPriceRaydium(
            transactions,
            nativeBalance?.type as 'buy' | 'sell',
            Number(solPriceUsd),
          )

          const tokenToMc = tokenInMint === 'So11111111111111111111111111111111111111112' ? tokenOutMint : tokenInMint

          if (tokenPrice) {
            const { tokenMarketCap, supplyAmount } = await this.tokenUtils.getTokenMktCap(tokenPrice, tokenToMc, false)
            tokenMc = tokenMarketCap
            raydiumTokenPrice = tokenPrice

            const tokenHoldings = await this.tokenUtils.getTokenHoldings(owner, tokenToMc, supplyAmount, false)

            currenHoldingPercentage = tokenHoldings.percentage
            currentHoldingPrice = tokenHoldings.balance
          }
        }

        return {
          platform: swap,
          owner: owner,
          description: swapDescription,
          type: nativeBalance?.type,
          balanceChange: nativeBalance?.balanceChange,
          signature: this.transactionSignature,
          swappedTokenMc: tokenMc,
          swappedTokenPrice: raydiumTokenPrice,
          solPrice: solPriceUsd || '',
          currenHoldingPercentage: currenHoldingPercentage,
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
        // token out
        // const tokenOutMint = await this.tokenUtils.getTokenMintAddressWithFallback(transactions)
        // if (tokenOutMint === null) {
        //   return
        // }

        // token in
        // const tokenInMint = await this.tokenUtils.getTokenMintAddressWithFallback(transactions)
        // if (tokenInMint === null) {
        //   return
        // }

        if (nativeBalance?.type === 'sell') {
          tokenOutMint = await this.tokenUtils.getTokenMintAddressWithFallback(transactions)
          tokenInMint = 'So11111111111111111111111111111111111111112'

          if (tokenOutMint === null) {
            console.log('NO TOKEN OUT MINT')
            return
          }

          const tokenOutInfo = await this.tokenParser.getTokenInfo(tokenOutMint)

          tokenOut = tokenOutInfo.data.symbol.replace(/\x00/g, '')
          tokenIn = 'SOL'
        } else {
          tokenOutMint = 'So11111111111111111111111111111111111111112'
          tokenInMint = await this.tokenUtils.getTokenMintAddressWithFallback(transactions)

          if (tokenInMint === null) {
            console.log('NO TOKEN IN MINT')
            return
          }

          const tokenInInfo = await this.tokenParser.getTokenInfo(tokenInMint)

          tokenIn = tokenInInfo.data.symbol.replace(/\x00/g, '')
          tokenOut = 'SOL'
        }

        // const tokenOutInfo = await this.tokenParser.getTokenInfo(tokenOutMint)
        // const cleanedTokenOutSymbol = tokenOutInfo.data.symbol.replace(/\x00/g, '')

        // console.log('TOKEN OUT MINTTT', tokenOutMint)
        // console.log('TOKEN IN MINTTTT', tokenInMint)

        // const tokenInInfo = await this.tokenParser.getTokenInfo(tokenInMint)
        // const cleanedTokenInSymbol = tokenInInfo.data.symbol.replace(/\x00/g, '')

        const formattedAmount = FormatNumbers.formatTokenAmount(Number(transactions[0]?.info?.amount))

        // owner = signerAccountAddress ? signerAccountAddress : transactions[0]?.info?.authority
        owner = walletAddress
        amountOut = nativeBalance?.type === 'sell' ? formattedAmount : totalSolSwapped.toFixed(2).toString()
        amountIn = nativeBalance?.type === 'sell' ? totalSolSwapped.toFixed(2).toString() : formattedAmount

        // console.log('OWNER', signerAccountAddress)
        const swapDescription = `${owner} swapped ${amountOut} ${tokenOut} for ${amountIn} ${tokenIn}`

        let tokenMc: number | null | undefined = null

        // get the token price and market cap for pumpfun

        const tokenToMc = tokenInMint === 'So11111111111111111111111111111111111111112' ? tokenOutMint : tokenInMint

        const tokenPrice = await this.tokenUtils.getTokenPricePumpFun(tokenToMc, solPriceUsd)
        // console.log('TOKEN PRICE:', tokenPrice)
        if (tokenPrice) {
          const { tokenMarketCap, supplyAmount } = await this.tokenUtils.getTokenMktCap(tokenPrice, tokenToMc, true)
          tokenMc = tokenMarketCap

          const tokenHoldings = await this.tokenUtils.getTokenHoldings(owner, tokenToMc, supplyAmount, true)

          currenHoldingPercentage = tokenHoldings.percentage
          currentHoldingPrice = tokenHoldings.balance
        }

        return {
          platform: swap,
          owner: walletAddress,
          description: swapDescription,
          type: nativeBalance?.type,
          balanceChange: nativeBalance?.balanceChange,
          signature: this.transactionSignature,
          swappedTokenMc: tokenMc,
          swappedTokenPrice: tokenPrice,
          solPrice: solPriceUsd || '',
          isNew: isNew,
          currenHoldingPercentage: currenHoldingPercentage,
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
      console.log('TRANSACTION_PARSER_ERROR', error)
      return
    }
  }

  public async parseSolTransfer(
    transactionDetails: (ParsedTransactionWithMeta | null)[],
    solPriceUsd: string | undefined,
    walletAddress: string,
  ): Promise<TransferParserInterface | undefined> {
    try {
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

      transactionDetails[0]?.transaction.message.instructions.map((instruction: any) => {
        if (transactions.length <= 1 && instruction && instruction.parsed !== undefined) {
          transactions.push(instruction.parsed)
        }
      })

      // if length is more than 1 it was probably a token transfer or some stuff idk
      if (transactions.length < 1 || transactions.length > 1) return

      const amount = Number.isNaN(transactions[0].info.lamports / 1e9) ? 0 : transactions[0].info.lamports / 1e9

      const description = `${transactions[0].info.source} transferred ${transactions[0].info.lamports / 1e9} SOL to ${transactions[0].info.destination}`
      const solAmount = transactions[0].info.lamports / 1e9

      return {
        owner: walletAddress,
        description,
        fromAddress: transactions[0].info.source ?? 'Unknown',
        toAddress: transactions[0].info.destination ?? 'Unknown',
        lamportsAmount: transactions[0].info.lamports ?? 0,
        solAmount: solAmount ?? 0,
        solPrice: solPriceUsd ?? '0',
        signature: this.transactionSignature,
      }
    } catch {
      console.log('PARSE_TRANSFERS_ERROR')
      return
    }
  }
}
