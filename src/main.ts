import dotenv from "dotenv"
import { TransactionParser } from './parsers/transaction-parser';
import { WatchTransaction } from "./lib/watch-transactions";
import { bot } from "./providers/telegram";
import { StartCommand } from "./bot/commands/start-command";
import { start } from "repl";
import { NewMembersHandler } from "./bot/handlers/new-members-handler";

dotenv.config()

const WALLET_ADDRESSES = [
    '4eADUUa7sumjdV1uJCBCZxCyeDYTbMruVwKNzWAnYZU4',
    '48ry8Bci3B62UNcUVvU2wavwSv9vjKCWEu9bTNmj6JqN',
    'Eah4NJNMLUsJwQnTyELgm28uqy3Jtn3ft1YJ7r6WH55d',
]

class Main {
    constructor() {}

    public async init(): Promise<void> {
        // Solana
        const watch = new WatchTransaction(WALLET_ADDRESSES)

        await watch.watchSocket()

        // Bot
        const newMembersHandler = new NewMembersHandler(bot)
        const startCommand = new StartCommand(bot)

        await newMembersHandler.newMember()
        await startCommand.start()
    }

    
}

const main = new Main()
main.init()



