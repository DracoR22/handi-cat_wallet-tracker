import dotenv from "dotenv"
import { TransactionParser } from './parsers/transaction-parser';
import { WatchTransaction } from "./lib/watch-transactions";

dotenv.config()

const WALLET_ADDRESSES = [
    'xEMtBCyRdZRzwKQnzHoViJ3UM7XELyVNYFsnii7hP2d',
    'Xatt2uaAnQY3tmT98EaUeRrrp1QFeCNnQrqKf1GY7cC',
    'G9wwcYULb1ic18ZTgN3nYxEjVdovE2zdKsSbsVSXebXx'
]

class Main {
    constructor() {}

    public async init(): Promise<void> {
        const watch = new WatchTransaction(WALLET_ADDRESSES)
        await watch.watchSocket()

        // const parseTransactions = new TransactionParser('HmDsh1QgsjeCPZttqVN8NcjcBrWCLLJow34T9dDNSX8iG5aqRfJr6vUHCJjiKEkFs8JvoHCXWSQFzWvpcRc4dTo')

        // const parsed = await parseTransactions.parseNative()
        // console.log(parsed)
    }

    
}

const main = new Main()
main.init()



