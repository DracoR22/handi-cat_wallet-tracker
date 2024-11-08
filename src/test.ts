import axios from 'axios'
import { connection, connection2 } from './providers/solana'
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

export const test2 = async () => {
  const walletAddress = 'CRVidEDtEUTYZisCxBZkpELzhQc9eauMLR3FWg74tReL'

  const publicKey = new PublicKey(walletAddress)

  const subscriptionId = connection2.onLogs(
    publicKey,
    async (logs, ctx) => {
      const { isRelevant, program } = isRelevantTransaction(logs)

      if (!isRelevant) {
        console.log('NO RELEVANT', logs.signature)
        return
      }

      console.log('YES ITS RELEVANT', logs.signature)
      console.log('Program:', program)
    },
    'confirmed',
  )
}

test2()
