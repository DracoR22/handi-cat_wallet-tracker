import { WatchTransaction } from './lib/watch-transactions';

const WALLET_ADDRESS = 'J2UzsEri1r8MycFwiMS2zX1u9TZqAHSWjJAeYGQuhBAa'

class Main {
    constructor() {}

    public async init(): Promise<void> {
        const watch = new WatchTransaction(WALLET_ADDRESS)
        await watch.watchSocket()
    }
}

const main = new Main()
main.init()


