import { Connection, LAMPORTS_PER_SOL, ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js'
// @ts-expect-error
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token'

import axios from 'axios'
import { PoolInfoLayout, SqrtPriceMath } from '@raydium-io/raydium-sdk'
import dotenv from 'dotenv'
import { ParsedTxInfo } from '../types/general-interfaces'
import {
  PUMP_CURVE_STATE_OFFSETS,
  PUMP_CURVE_STATE_SIGNATURE,
  PUMP_CURVE_STATE_SIZE,
  PUMP_CURVE_TOKEN_DECIMALS,
  PUMP_FUN_PROGRAM_ID,
} from '../config/program-ids'
import { PumpCurveState } from '../types/pumpfun-types'
import { BufferUtils } from './buffer-utils'
import { RpcConnectionManager } from '../providers/solana'
import { FormatNumbers } from './format-numbers'

dotenv.config()

export class TokenUtils {
  constructor(private connection: Connection) {
    this.connection = connection
  }
  public async getTokenMintAddress(tokenAddress: string) {
    try {
      const tokenPublicKey = new PublicKey(tokenAddress)
      const accountInfo = await getAccount(this.connection, tokenPublicKey)
      return accountInfo.mint.toBase58()
    } catch (error) {
      console.log(`Error fetching mint address for token ${tokenAddress}:`, error)
      return null
    }
  }

  public async getTokenMintAddressWithFallback(transactions: any) {
    let tokenOutMint = null

    if (transactions[0]?.info?.destination) {
      tokenOutMint = await this.getTokenMintAddress(transactions[0].info.destination)
    }

    if (!tokenOutMint && transactions[0]?.info?.source) {
      tokenOutMint = await this.getTokenMintAddress(transactions[0].info.source)
    }

    return tokenOutMint
  }

  public calculateNativeBalanceChanges(transactionDetails: (ParsedTransactionWithMeta | null)[]) {
    const meta = transactionDetails[0] && transactionDetails[0].meta

    if (!meta) {
      console.log('No meta information available')
      return
    }

    const preBalances = meta.preBalances
    const postBalances = meta.postBalances

    if (!preBalances || !postBalances) {
      console.log('No balance information available')
      return
    }

    const balanceChanges = []

    // Calculate SOL balance changes for each account
    for (let i = 0; i < preBalances.length; i++) {
      const preBalance = preBalances[i]
      const postBalance = postBalances[i]
      const solDifference = (postBalance! - preBalance!) / 1e9 // Convert lamports to SOL

      if (solDifference !== 0) {
        balanceChanges.push({
          accountIndex: i,
          preBalance: preBalance! / 1e9, // Convert to SOL
          postBalance: postBalance! / 1e9, // Convert to SOL
          change: solDifference,
        })
      }
    }

    // Log the results
    if (balanceChanges.length > 0) {
      const firstChange = balanceChanges[0]
      // console.log(`Account Index ${firstChange.accountIndex} native balance change:`);
      // console.log(`Pre Balance: ${firstChange.preBalance} SOL`);
      // console.log(`Post Balance: ${firstChange.postBalance} SOL`);
      // console.log(`Change: ${firstChange.change} SOL`);
      // console.log('-----------------------------------');
      const type = firstChange!.change > 0 ? 'sell' : 'buy'
      return {
        type,
        balanceChange: firstChange!.change,
      }
    } else {
      console.log('No balance changes found')
      return {
        type: '',
        balanceChange: '',
      }
    }
  }

  static async getSolPriceGecko(): Promise<string | undefined> {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')

      const data = await response.data

      const solanaPrice = data.solana.usd

      return String(solanaPrice)
    } catch (error) {
      console.log('GET_SOL_PRICE_ERROR')
      return
    }
  }

  static async getSolPriceNative(): Promise<string | undefined> {
    try {
      const id = new PublicKey('8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj')

      const accountInfo = await RpcConnectionManager.getRandomConnection().getAccountInfo(id)

      if (accountInfo === null) {
        console.log('get pool info error')
        return
      }

      const poolData = PoolInfoLayout.decode(accountInfo.data)

      const solPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
        poolData.sqrtPriceX64,
        poolData.mintDecimalsA,
        poolData.mintDecimalsB,
      ).toFixed(2)

      // console.log('current price -> ', solPrice)

      return solPrice
    } catch (error) {
      console.log('FETCH_SOL_PRICE_ERROR')
      return
    }
  }

  public async getTokenBalance(tokenAccountAddress: PublicKey) {
    try {
      const tokenBalance = await this.connection.getTokenAccountBalance(tokenAccountAddress)
      return tokenBalance.value.amount
    } catch (error) {
      console.log('Error fetching token balance:', error)
      return
    }
  }

  public async getTokenPriceRaydium(
    txInstructions: ParsedTxInfo[],
    type: 'buy' | 'sell',
    solPriceInUsd: number,
  ): Promise<number | undefined> {
    if (type === 'buy') {
      const tokenAccountAddress = new PublicKey(txInstructions[1]!.info.source)
      const tokenAccountAddressWrappedSol = new PublicKey(txInstructions[0]!.info.destination)

      const splTokenBalance: any = await this.getTokenBalance(tokenAccountAddress)
      const wrappedSolBalance: any = await this.getTokenBalance(tokenAccountAddressWrappedSol)
      // const solPriceInUsd: any = await this.getSolPriceNative()

      const priceOfSPLTokenInSOL = wrappedSolBalance / 1_000_000_000 / (splTokenBalance / 1_000_000)
      let priceOfSPLTokenInUSD = priceOfSPLTokenInSOL * solPriceInUsd

      // console.log('PRICE IN USD FIXED', priceOfSPLTokenInUSD.toFixed(10))
      // console.log('SOL PRICE TOKEN', priceOfSPLTokenInSOL)

      if (priceOfSPLTokenInUSD.toString().includes('e')) {
        // Convert the scientific notation number to a fixed decimal number string
        const formattedPrice = priceOfSPLTokenInUSD.toFixed(10)

        // Remove the first three leading zeros after the decimal point
        const [integerPart, decimalPart] = formattedPrice.split('.')
        const newDecimalPart = decimalPart!.replace(/^0{3}/, '')
        priceOfSPLTokenInUSD = parseFloat(`${integerPart}.${newDecimalPart}`)
      }

      return priceOfSPLTokenInUSD
    } else if (type === 'sell') {
      const tokenAccountAddress = new PublicKey(txInstructions[0]!.info.destination)
      const tokenAccountAddressWrappedSol = new PublicKey(txInstructions[1]!.info.source)

      const splTokenBalance: any = await this.getTokenBalance(tokenAccountAddress)
      const wrappedSolBalance: any = await this.getTokenBalance(tokenAccountAddressWrappedSol)
      // const solPriceInUsd: any = await this.getSolPriceNative()

      const priceOfSPLTokenInSOL = wrappedSolBalance / 1_000_000_000 / (splTokenBalance / 1_000_000)
      let priceOfSPLTokenInUSD = priceOfSPLTokenInSOL * solPriceInUsd

      // console.log('PRICE IN USD FIXED', priceOfSPLTokenInUSD.toFixed(10))
      // console.log('SOL PRICE TOKEN', priceOfSPLTokenInSOL)

      if (priceOfSPLTokenInUSD.toString().includes('e')) {
        // Convert the scientific notation number to a fixed decimal number string
        const formattedPrice = priceOfSPLTokenInUSD.toFixed(10)

        // Remove the first three leading zeros after the decimal point
        const [integerPart, decimalPart] = formattedPrice.split('.')
        const newDecimalPart = decimalPart!.replace(/^0{3}/, '')
        priceOfSPLTokenInUSD = parseFloat(`${integerPart}.${newDecimalPart}`)
      }

      return priceOfSPLTokenInUSD
    }

    return
  }

  public async getTokenPricePumpFun(tokenAddress: string, solPrice: string | undefined): Promise<number | null> {
    const pumpFunProgram = new PublicKey(PUMP_FUN_PROGRAM_ID)
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding-curve'), new PublicKey(tokenAddress).toBytes()],
      pumpFunProgram,
    )

    const curveAddressStr = bondingCurve.toBase58()

    if (!curveAddressStr) return null

    const curveAddress = new PublicKey(curveAddressStr)

    const curveState = await this.getPumpCurveState(curveAddress)
    if (!curveState) return null

    const tokenPriceSol = this.calculatePumpCurvePrice(curveState)

    // treat this as raydium token
    if (tokenPriceSol === 0) return null

    const parsedSolPrice = Number(solPrice)
    const validSolPrice = isNaN(parsedSolPrice) ? 0 : parsedSolPrice

    const tokenPriceUsd = tokenPriceSol * validSolPrice

    // const formattedPrice = FormatNumbers.formatTokenPrice(tokenPriceUsd)

    return tokenPriceUsd
  }

  public async getPumpCurveState(curveAddress: PublicKey): Promise<PumpCurveState | undefined> {
    const response = await this.connection.getAccountInfo(curveAddress)
    if (
      !response ||
      !response.data ||
      response.data.byteLength < PUMP_CURVE_STATE_SIGNATURE.byteLength + PUMP_CURVE_STATE_SIZE
    ) {
      console.log('unexpected curve state')
      return
    }

    const idlSignature = BufferUtils.readBytes(response.data, 0, PUMP_CURVE_STATE_SIGNATURE.byteLength)
    if (idlSignature?.compare(PUMP_CURVE_STATE_SIGNATURE) !== 0) {
      console.log('unexpected curve state IDL signature')
      return
    }

    return {
      virtualTokenReserves: BufferUtils.readBigUintLE(
        response.data,
        PUMP_CURVE_STATE_OFFSETS.VIRTUAL_TOKEN_RESERVES,
        8,
      ),
      virtualSolReserves: BufferUtils.readBigUintLE(response.data, PUMP_CURVE_STATE_OFFSETS.VIRTUAL_SOL_RESERVES, 8),
      realTokenReserves: BufferUtils.readBigUintLE(response.data, PUMP_CURVE_STATE_OFFSETS.REAL_TOKEN_RESERVES, 8),
      realSolReserves: BufferUtils.readBigUintLE(response.data, PUMP_CURVE_STATE_OFFSETS.REAL_SOL_RESERVES, 8),
      tokenTotalSupply: BufferUtils.readBigUintLE(response.data, PUMP_CURVE_STATE_OFFSETS.TOKEN_TOTAL_SUPPLY, 8),
      complete: BufferUtils.readBoolean(response.data, PUMP_CURVE_STATE_OFFSETS.COMPLETE, 1),
    }
  }

  public calculatePumpCurvePrice(curveState: PumpCurveState): number {
    if (
      curveState === null ||
      typeof curveState !== 'object' ||
      !(typeof curveState.virtualTokenReserves === 'bigint' && typeof curveState.virtualSolReserves === 'bigint')
    ) {
      console.log('curveState must be a PumpCurveState')
      return 0
    }

    if (curveState.virtualTokenReserves <= BigInt(0) || curveState.virtualSolReserves <= BigInt(0)) {
      console.log('curve state contains invalid reserve data')
      return 0
    }

    return (
      Number(curveState.virtualSolReserves) /
      LAMPORTS_PER_SOL /
      (Number(curveState.virtualTokenReserves) / 10 ** PUMP_CURVE_TOKEN_DECIMALS)
    )
  }

  public async getTokenMktCap(tokenPrice: number, tokenMint: string, isPump: boolean) {
    try {
      let supplyValue = null
      let supplyAmount = null

      const mintPublicKey = new PublicKey(tokenMint)

      if (isPump) {
        supplyValue = 1e9
        supplyAmount = 1e9
      } else {
        const tokenSupply = await this.connection.getTokenSupply(mintPublicKey)
        supplyValue = tokenSupply.value.uiAmount
        supplyAmount = Number(tokenSupply.value.amount)
      }

      if (!supplyValue) {
        return { tokenMarketCap: 0, supplyAmount: 0 }
      }

      const tokenMarketCap = Number(supplyValue) * tokenPrice

      // console.log('TOKEN_MARKET_CAP', tokenMarketCap)
      return { tokenMarketCap, supplyAmount: supplyAmount || 0 }
    } catch (error) {
      console.log('GET_TOKEN_MKC_ERROR')
      return { tokenMarketCap: 0, supplyAmount: 0 }
    }
  }

  public async getTokenHoldings(
    walletAddress: string,
    tokenMintAddress: string,
    tokenSupply: number,
    isPump: boolean,
  ): Promise<{ balance: string; percentage: string }> {
    try {
      const walletPublicKey = new PublicKey(walletAddress)
      const tokenMintPublicKey = new PublicKey(tokenMintAddress)

      const associatedTokenAddress = await getAssociatedTokenAddress(tokenMintPublicKey, walletPublicKey)
      const tokenAccountInfo = await getAccount(this.connection, associatedTokenAddress)

      const percentage = isPump
        ? Number(tokenAccountInfo.amount) / Number(tokenSupply) / 10000
        : (Number(tokenAccountInfo.amount) / Number(tokenSupply)) * 100
      const fixedPercentage = percentage > 0 ? `${percentage.toFixed(2)}` : '0'

      const balance = FormatNumbers.formatTokenAmount(Number(tokenAccountInfo.amount))

      return {
        balance: balance,
        percentage: fixedPercentage,
      }
    } catch (error) {
      console.log('Error fetching token holdings:', error)

      return { balance: '0', percentage: '0' }
    }
  }
}
