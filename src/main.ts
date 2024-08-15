import dotenv from "dotenv"
import { bot } from "./providers/telegram";
import { StartCommand } from "./bot/commands/start-command";
import { NewMembersHandler } from "./bot/handlers/new-members-handler";
import { AddCommand } from "./bot/commands/add-command";
import { CallbackQueryHandler } from "./bot/handlers/callback-query-handler";
import express, { Express } from "express"
import { ManageCommand } from "./bot/commands/manage-command";
import { DeleteCommand } from "./bot/commands/delete-command";
import { TrackWallets } from "./lib/track-wallets";
import { getRecentTransactionsCount } from "./test";
import { Subscriptions } from "./lib/subscriptions";

dotenv.config()

const WALLET_ADDRESSES = [
    '4eADUUa7sumjdV1uJCBCZxCyeDYTbMruVwKNzWAnYZU4',
    '48ry8Bci3B62UNcUVvU2wavwSv9vjKCWEu9bTNmj6JqN',
    'Eah4NJNMLUsJwQnTyELgm28uqy3Jtn3ft1YJ7r6WH55d',
]

const PORT = process.env.PORT || 3001

class Main {
    private trackWallets: TrackWallets

    private newMembersHandler: NewMembersHandler
    private callbackQueryHandler: CallbackQueryHandler
    private startCommand: StartCommand
    private addCommand: AddCommand
    private manageCommand: ManageCommand
    private deleteCommand: DeleteCommand
    constructor(private app: Express = express()) {
        this.app.use(express.json({ limit: '50mb' }))

        this.setupRoutes()

        this.trackWallets = new TrackWallets()

        this.newMembersHandler = new NewMembersHandler(bot)
        this.callbackQueryHandler = new CallbackQueryHandler(bot)
        this.startCommand = new StartCommand(bot)
        this.addCommand = new AddCommand(bot)
        this.manageCommand = new ManageCommand(bot)
        this.deleteCommand = new DeleteCommand(bot)
    }

    setupRoutes() {
        // Default endpoint
        this.app.get('/', async (req, res) => {
            try {
                res.status(200).send('Hello world');
            } catch (error) {
                console.error('Error processing update:', error);
                res.status(500).send('Error processing update');
            }
        });
        this.app.post(`/webhook/telegram`, async (req, res) => {
            try {
                bot.processUpdate(req.body);
                
                res.status(200).send('Update received');
            } catch (error) {
                console.log('Error processing update:', error);
                res.status(500).send('Error processing update');
            }
        });
    }

    public async init(): Promise<void> {
        // Bot
        this.newMembersHandler.newMember()
        this.callbackQueryHandler.call()
        this.startCommand.start()
        this.addCommand.addCommandHandler()
        await this.manageCommand.manageCommandHandler()
        this.deleteCommand.deleteCommandHandler()
 
        this.app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

        await this.trackWallets.setupWalletWatcher();
        await this.trackWallets.listenForDatabaseChanges();
    }
}

const main = new Main()
main.init()



