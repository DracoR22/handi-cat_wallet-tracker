import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { WatchTransaction } from './lib/watch-transactions';
import { connection } from './providers/solana';
import { PublicKey } from '@solana/web3.js';
import { SolanaParser } from "@debridge-finance/solana-transaction-parser";
import { ParseTransactions } from './lib/parse-transactions';

import dotenv from "dotenv"

dotenv.config()

const WALLET_ADDRESS = 'ZG98FUCjb8mJ824Gbs6RsgVmr1FhXb2oNiJHa2dwmPd'

class Main {
    constructor() {}

    public async init(): Promise<void> {
        const watch = new WatchTransaction(WALLET_ADDRESS)
        await watch.watchSocket()

        // const parseTransactions = new ParseTransactions('5GsU5t5rNfmfdQz1hVQYALDWbg7FP6L6AMmWJDRgxTcqjJWy63RiQn7LAVU9fmrpdPTLXMR5XwZedMS6gDV7A5WS')

        // const transaction = await parseTransactions.parseWithHelius()
        // console.log(transaction)
    }
}

const main = new Main()
main.init()



