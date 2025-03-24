import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { PumpCurveState } from '../types/pumpfun-types'
import {
  PUMP_CURVE_STATE_OFFSETS,
  PUMP_CURVE_STATE_SIGNATURE,
  PUMP_CURVE_STATE_SIZE,
  PUMP_CURVE_TOKEN_DECIMALS,
} from '../config/program-ids'
import { BufferUtils } from '../lib/buffer-utils'

export class PumpMarketCurve {
  static async getPumpCurveState(connection: Connection, curveAddress: PublicKey): Promise<PumpCurveState | undefined> {
    const response = await connection.getAccountInfo(curveAddress)
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

  static calculatePumpCurvePrice(curveState: PumpCurveState): number {
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
}
