import { TokenParser } from './token-parser'
import { TokenUtils } from '../lib/token-utils'
import { Connection, ParsedTransactionWithMeta } from '@solana/web3.js'
import { SwapType } from '../types/swap-types'
import { FormatNumbers } from '../lib/format-numbers'
import { NativeParserInterface } from '../types/general-interfaces'

export class TransactionParser {
  private formatNumbers: FormatNumbers
  private tokenUtils: TokenUtils
  private tokenParser: TokenParser
  constructor(
    private transactionSignature: string,
    private connection: Connection,
  ) {
    this.tokenUtils = new TokenUtils(this.connection)
    this.connection = connection
    this.transactionSignature = this.transactionSignature
    this.formatNumbers = new FormatNumbers()
    this.tokenParser = new TokenParser(this.connection)
  }

  public async parseRpc(
    transactionDetails: (ParsedTransactionWithMeta | null)[],
    swap: SwapType,
  ): Promise<NativeParserInterface | undefined> {
    if (!transactionDetails || !transactionDetails[0]) {
      console.log('Transaction not found or invalid.')
      return
    }

    let owner = ''
    let amountIn = ''
    let tokenIn = ''
    let amountOut = ''
    let tokenOut = ''

    const transactions: any = []
    const parsedInfos: any[] = []

    // console.log('PARSED_TRANSACTION:', transactionDetails)

    const accountKeys = transactionDetails[0]?.transaction.message.accountKeys

    const signerAccount = accountKeys!.find((account) => account.signer === true)

    const signerAccountAddress = signerAccount?.pubkey.toString()

    const preBalances = transactionDetails[0].meta?.preBalances
    const postBalances = transactionDetails[0].meta?.postBalances

    // Transaction Metadata
    transactionDetails[0].meta?.innerInstructions?.forEach((i: any) => {
      // raydium
      i.instructions.forEach((r: any) => {
        if (r.parsed?.type === 'transfer' && r.parsed.info.amount !== undefined) {
          transactions.push(r.parsed)
        }
      })
    })

    // pumpfun
    transactionDetails[0].transaction.message.instructions.map((instruction: any) => {
      if (transactions.length <= 1 && instruction && instruction.parsed !== undefined) {
        parsedInfos.push(instruction.parsed)
      }
    })

    const nativeBalance = this.tokenUtils.calculateNativeBalanceChanges(transactionDetails)

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

      if (solDifference !== 0 && i === 2 && nativeBalance?.type === 'sell') {
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
      return
    }

    // const solPrice = await this.tokenUtils.getSolPriceNative()

    const solPrice = ''

    // for raydium transactions
    if (transactions.length > 1) {
      // token out
      const tokenOutMint = await this.tokenUtils.getTokenMintAddress(transactions[0]?.info.destination)
      if (tokenOutMint === null) {
        return
      }
      const tokenOutInfo = await this.tokenParser.getTokenInfo(tokenOutMint)
      const cleanedTokenOutSymbol = tokenOutInfo.data.symbol.replace(/\x00/g, '')

      // token in
      const tokenInMint = await this.tokenUtils.getTokenMintAddress(raydiumTransfer.info.source)
      if (tokenInMint === null) {
        return
      }
      const tokenInInfo = await this.tokenParser.getTokenInfo(tokenInMint)
      const cleanedTokenInSymbol = tokenInInfo.data.symbol.replace(/\x00/g, '')

      const formattedAmountOut = this.formatNumbers.formatTokenAmount(Number(transactions[0]?.info?.amount))
      const formattedAmountIn = this.formatNumbers.formatTokenAmount(Number(raydiumTransfer?.info?.amount))

      owner = parsedInfos[0]?.info?.source ? parsedInfos[0]?.info?.source : transactions[0]?.info?.authority
      amountOut =
        cleanedTokenOutSymbol === 'SOL'
          ? (Number(transactions[0]?.info?.amount) / 1e9).toFixed(2).toString()
          : formattedAmountOut
      amountIn =
        cleanedTokenInSymbol === 'SOL'
          ? (Number(raydiumTransfer.info.amount) / 1e9).toFixed(2).toString()
          : formattedAmountIn
      tokenOut = cleanedTokenOutSymbol
      tokenIn = cleanedTokenInSymbol

      let tokenMc: number | null | undefined = null

      const swapDescription = `${owner} swapped ${amountOut} ${tokenOut} for ${amountIn} ${tokenIn}`

      // get the token price and market cap for raydium
      if (transactions.length[0]?.info?.amount !== transactions[1]?.info?.amount) {
        const tokenPrice = await this.tokenUtils.getTokenPriceRaydium(
          transactions,
          nativeBalance?.type as 'buy' | 'sell',
        )

        const tokenToMc = tokenInMint === 'So11111111111111111111111111111111111111112' ? tokenOutMint : tokenInMint

        if (tokenPrice) {
          const tokenMarketCap = await this.tokenUtils.getTokenMktCap(tokenPrice, tokenToMc)
          tokenMc = tokenMarketCap
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
        solPrice: solPrice || '',
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
      const tokenOutMint = await this.tokenUtils.getTokenMintAddressWithFallback(transactions)
      if (tokenOutMint === null) {
        return
      }
      const tokenOutInfo = await this.tokenParser.getTokenInfo(tokenOutMint)
      const cleanedTokenOutSymbol = tokenOutInfo.data.symbol.replace(/\x00/g, '')

      // token in
      const tokenInMint = await this.tokenUtils.getTokenMintAddressWithFallback(transactions)
      if (tokenInMint === null) {
        return
      }
      const tokenInInfo = await this.tokenParser.getTokenInfo(tokenInMint)
      const cleanedTokenInSymbol = tokenInInfo.data.symbol.replace(/\x00/g, '')

      const formattedAmount = this.formatNumbers.formatTokenAmount(Number(transactions[0]?.info?.amount))

      owner = signerAccountAddress ? signerAccountAddress : transactions[0]?.info?.authority
      amountOut = nativeBalance?.type === 'sell' ? formattedAmount : totalSolSwapped.toFixed(2).toString()
      amountIn = nativeBalance?.type === 'sell' ? totalSolSwapped.toFixed(2).toString() : formattedAmount
      tokenOut = nativeBalance?.type === 'sell' ? cleanedTokenOutSymbol : 'SOL'
      tokenIn = nativeBalance?.type === 'sell' ? 'SOL' : cleanedTokenInSymbol
      console.log('OWNER', signerAccountAddress)
      const swapDescription = `${owner} swapped ${amountOut} ${tokenOut} for ${amountIn} ${tokenIn}`

      return {
        platform: swap,
        owner: owner,
        description: swapDescription,
        type: nativeBalance?.type,
        balanceChange: nativeBalance?.balanceChange,
        signature: this.transactionSignature,
        swappedTokenMc: null,
        solPrice: solPrice || '',
        tokenTransfers: {
          tokenInSymbol: tokenIn,
          tokenInMint: nativeBalance?.type === 'sell' ? 'So11111111111111111111111111111111111111112' : tokenInMint,
          tokenAmountIn: amountIn,
          tokenOutSymbol: tokenOut,
          tokenOutMint: nativeBalance?.type === 'sell' ? tokenOutMint : 'So11111111111111111111111111111111111111112',
          tokenAmountOut: amountOut,
        },
      }
    }

    return
  }
}
