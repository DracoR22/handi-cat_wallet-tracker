// this class is no longer being used, im using walletWatcher.isRelevantTransaction instead

import { Logs, PublicKey } from '@solana/web3.js'
import { SwapType } from '../types/swap-types'
import {
  JUPITER_PROGRAM_ID,
  PUMP_FUN_PROGRAM_ID,
  PUMP_FUN_TOKEN_MINT_AUTH,
  PUMPFUN_AMM_PROGRAM_ID,
  RAYDIUM_PROGRAM_ID,
} from '../config/program-ids'

export class ValidTransactions {
  constructor(private programIds: any) {
    this.programIds = programIds
  }

  static isRelevantTransaction(logs: Logs): { isRelevant: boolean; swap: SwapType } {
    if (!logs.logs || logs.logs.length === 0) {
      return { isRelevant: false, swap: null }
    }

    const logString = logs.logs.join(' ')

    if (logString.includes(PUMPFUN_AMM_PROGRAM_ID)) {
      return { isRelevant: true, swap: 'pumpfun_amm' }
    }
    if (logString.includes(PUMP_FUN_TOKEN_MINT_AUTH)) {
      return { isRelevant: true, swap: 'mint_pumpfun' }
    }
    if (logString.includes(PUMP_FUN_PROGRAM_ID)) {
      return { isRelevant: true, swap: 'pumpfun' }
    }
    if (logString.includes(JUPITER_PROGRAM_ID)) {
      return { isRelevant: true, swap: 'jupiter' }
    }
    if (logString.includes(RAYDIUM_PROGRAM_ID)) {
      return { isRelevant: true, swap: 'raydium' }
    }

    // This way we save some rpc calls by excluding bulk transfers
    let systemProgramCount = 0

    for (const log of logs.logs) {
      if (log.includes('11111111111111111111111111111111')) {
        systemProgramCount++
        if (systemProgramCount > 2) break
      }
    }

    if (systemProgramCount > 0 && systemProgramCount <= 2) {
      return { isRelevant: true, swap: 'sol_transfer' }
    }

    return { isRelevant: false, swap: null }
  }

  public getDefiTransaction(): { valid: boolean; swap: SwapType } {
    const pumpFunProgramId = new PublicKey(PUMP_FUN_PROGRAM_ID)
    const raydiumProgramId = new PublicKey(RAYDIUM_PROGRAM_ID)
    const jupiterProgramId = new PublicKey(JUPITER_PROGRAM_ID)
    const pumpFunTokenMintAuth = new PublicKey(PUMP_FUN_TOKEN_MINT_AUTH)

    const pumpFunTransaction = this.programIds && this.programIds.some((id: any) => id.equals(pumpFunProgramId))
    const raydiumTransaction = this.programIds && this.programIds.some((id: any) => id.equals(raydiumProgramId))
    const jupiterTransaction = this.programIds && this.programIds.some((id: any) => id.equals(jupiterProgramId))
    const pumpFunMinted = this.programIds && this.programIds.some((id: any) => id.equals(pumpFunTokenMintAuth))

    if (pumpFunMinted) {
      console.log('detected token mint transaction')
      return { valid: true, swap: 'mint_pumpfun' }
    } else if (pumpFunTransaction) {
      console.log('detected pumpfun transaction')
      return { valid: true, swap: 'pumpfun' }
    } else if (jupiterTransaction) {
      console.log('detected jupiter transaction')
      return { valid: true, swap: 'jupiter' }
    } else if (raydiumTransaction) {
      console.log('detected raydium transaction')
      return { valid: true, swap: 'raydium' }
    } else {
      return { valid: false, swap: null }
    }
  }
}
