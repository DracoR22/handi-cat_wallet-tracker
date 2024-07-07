import dotenv from "dotenv"
import { TransactionParser } from './parsers/transaction-parser';
import { WatchTransaction } from "./lib/watch-transactions";

dotenv.config()

const WALLET_ADDRESS = '9Nm1VSnxmVR2oEzjkSVzDsVTGEjSqTyMYPnXakpGbBwe'

class Main {
    constructor() {}

    public async init(): Promise<void> {
        const watch = new WatchTransaction(WALLET_ADDRESS)
        await watch.watchSocket()

        // const parseTransactions = new TransactionParser('HmDsh1QgsjeCPZttqVN8NcjcBrWCLLJow34T9dDNSX8iG5aqRfJr6vUHCJjiKEkFs8JvoHCXWSQFzWvpcRc4dTo')

        // const parsed = await parseTransactions.parseNative()
        // console.log(parsed)
    }

    
}

const main = new Main()
main.init()



