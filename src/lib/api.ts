import axios from 'axios'
import { PumpDetail } from '../types/gmgn-ai-types'
import { TokenInfoPump } from '../types/pumpfun-types'
import { HeliusTransaction } from '../types/helius-types'

// this class is no longer used in this project but some of these apis can be useful
export class ApiRequests {
  constructor() {}

  public async gmgnTokenInfo(addr: string): Promise<PumpDetail | undefined> {
    try {
      const res = await fetch(`https://gmgn.ai/defi/quotation/v1/tokens/sol/${addr}`)
      const data = await res.json()

      if (data.code === 0) {
        return data.data.token
      }

      return
    } catch (error) {
      console.log('GMGN_API_ERROR', error)
      return
    }
  }

  public async pumpFunTokenInfo(addr: string): Promise<TokenInfoPump | undefined> {
    try {
      const url = `https://frontend-api.pump.fun/coins/${addr}`
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          Referer: 'https://www.pump.fun/',
          Origin: 'https://www.pump.fun',
          Connection: 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
          'If-None-Match': 'W/"43a-tWaCcS4XujSi30IFlxDCJYxkMKg"',
        },
      })
      if (response.status === 200) {
        return response.data
      } else {
        console.error('Failed to retrieve coin data:', response.status)
        return
      }
    } catch (error) {
      console.error('Error fetching coin data:', error)
      return
    }
  }

  static async parseTransactionWithHelius(
    transactionSignature: string,
  ): Promise<{ message: string; type: 'buy' | 'sell' } | undefined> {
    const apiUrl = `https://api.helius.xyz/v0/transactions/?api-key=${process.env.HELIUS_API_KEY}`
    console.log('Parsing Transaction:', transactionSignature)

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: [transactionSignature],
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const transactions = (await response.json()) as HeliusTransaction[]
      console.log('Received transactions:', transactions)
      const type: 'buy' | 'sell' = transactions[0]!.accountData[0]!.nativeBalanceChange > 0 ? 'sell' : 'buy'

      return {
        message: transactions[0]!.description,
        type,
      }
    } catch (error) {
      console.error('Error parsing transaction with Helius:', error)
    }
  }
}
