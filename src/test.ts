import axios from 'axios'
import { connection } from './providers/solana'
import { UserPlan } from './lib/user-plan'

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

const tokenTest = async (mintStr: string) => {
  try {
    const url = `https://frontend-api.pump.fun/coins/${mintStr}`
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
      console.log(response.data)
      return response.data
    } else {
      console.error('Failed to retrieve coin data:', response.status)
      return null
    }
  } catch (error) {
    console.error('Error fetching coin data:', error)
    return null
  }
}

// test('ALkw5MXZkn4S5r1yrb2HaJHqYSM5d4JxPTLWAp1iP8q7BLiuvQUDXsdM7h5gF3uUDrpdV6z6agb1QQ6qLf1DZrG')
// tokenTest('RBqNPm9H4ved3oBhWxXpnzhpj22sc5skxYsRXPdpump')
