import axios from 'axios'
import { connection } from './providers/solana'
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
import { PrismaUserRepository } from './repositories/prisma/user'
import { TransactionParser } from './parsers/transaction-parser'
import { WatchTransaction } from './lib/watch-transactions'

async function isRelevantTransaction() {
  const watchTransactions = new WatchTransaction(connection)
  const transactionDetails = await watchTransactions.getParsedTransaction(
    'P6A1UerB2yumStuKqqcHCJfCnmUqV34sdPXTQEJPqHokT6G2eQTJvovVzVxyZomFz83QMgnyyWs48MFrWzdVg3Q',
  )
  const transactionParser = new TransactionParser(
    'P6A1UerB2yumStuKqqcHCJfCnmUqV34sdPXTQEJPqHokT6G2eQTJvovVzVxyZomFz83QMgnyyWs48MFrWzdVg3Q',
    connection,
  )

  const tx = await transactionParser.parseRpc(transactionDetails!, 'jupiter')

  console.log('TRANSACTION', tx)
}

isRelevantTransaction()
