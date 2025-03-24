import { Connection, PublicKey } from '@solana/web3.js'
import { ParsedTxInfo } from '../types/general-interfaces'
import { PUMP_FUN_PROGRAM_ID } from '../config/program-ids'
import { PumpMarketCurve } from './pump-market-curve'

export class TokenMarketPrice {
  constructor(private connection: Connection) {
    this.connection = connection
  }

  public async getTokenPricePumpFunAMM(
    txInstructions: ParsedTxInfo[],
    type: 'buy' | 'sell',
    solPriceInUsd: number,
  ): Promise<number | undefined> {
    if (type === 'buy') {
      const tokenAccountAddress = new PublicKey(txInstructions[0]!.info.source)
      const tokenAccountAddressWrappedSol = new PublicKey(txInstructions[1]!.info.destination)

      const splTokenBalance: any = await this.getTokenBalance(tokenAccountAddress)
      const wrappedSolBalance: any = await this.getTokenBalance(tokenAccountAddressWrappedSol)

      const priceOfSPLTokenInSOL = wrappedSolBalance / 1_000_000_000 / (splTokenBalance / 1_000_000)
      let priceOfSPLTokenInUSD = priceOfSPLTokenInSOL * solPriceInUsd

      if (priceOfSPLTokenInUSD.toString().includes('e')) {
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

      const priceOfSPLTokenInSOL = wrappedSolBalance / 1_000_000_000 / (splTokenBalance / 1_000_000)
      let priceOfSPLTokenInUSD = priceOfSPLTokenInSOL * solPriceInUsd

      if (priceOfSPLTokenInUSD.toString().includes('e')) {
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

      const priceOfSPLTokenInSOL = wrappedSolBalance / 1_000_000_000 / (splTokenBalance / 1_000_000)
      let priceOfSPLTokenInUSD = priceOfSPLTokenInSOL * solPriceInUsd

      if (priceOfSPLTokenInUSD.toString().includes('e')) {
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

      const priceOfSPLTokenInSOL = wrappedSolBalance / 1_000_000_000 / (splTokenBalance / 1_000_000)
      let priceOfSPLTokenInUSD = priceOfSPLTokenInSOL * solPriceInUsd

      if (priceOfSPLTokenInUSD.toString().includes('e')) {
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

    const curveState = await PumpMarketCurve.getPumpCurveState(this.connection, curveAddress)
    if (!curveState) return null

    const tokenPriceSol = PumpMarketCurve.calculatePumpCurvePrice(curveState)

    // treat this as raydium token
    if (tokenPriceSol === 0) return null

    const parsedSolPrice = Number(solPrice)
    const validSolPrice = isNaN(parsedSolPrice) ? 0 : parsedSolPrice

    const tokenPriceUsd = tokenPriceSol * validSolPrice

    // const formattedPrice = FormatNumbers.formatTokenPrice(tokenPriceUsd)

    return tokenPriceUsd
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

  public async getTokenBalance(tokenAccountAddress: PublicKey) {
    try {
      const tokenBalance = await this.connection.getTokenAccountBalance(tokenAccountAddress)
      return tokenBalance.value.amount
    } catch (error) {
      console.log('Error fetching token balance:', error)
      return
    }
  }
}
