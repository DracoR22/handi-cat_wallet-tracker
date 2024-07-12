import dotenv from "dotenv"
import { WatchTransaction } from "./lib/watch-transactions";
import { bot } from "./providers/telegram";
import { StartCommand } from "./bot/commands/start-command";
import { NewMembersHandler } from "./bot/handlers/new-members-handler";
import { AddCommand } from "./bot/commands/add-command";
import { CallbackQueryHandler } from "./bot/handlers/callback-query-handler";
import express, { Express } from "express"
import { WebhookQueryHandler } from "./bot/webhook/webhook-query-handler";

dotenv.config()

const WALLET_ADDRESSES = [
    '4eADUUa7sumjdV1uJCBCZxCyeDYTbMruVwKNzWAnYZU4',
    '48ry8Bci3B62UNcUVvU2wavwSv9vjKCWEu9bTNmj6JqN',
    'Eah4NJNMLUsJwQnTyELgm28uqy3Jtn3ft1YJ7r6WH55d',
]

const PORT = process.env.PORT || 3001

class Main {
    constructor(private app: Express = express()) {
        this.app.use(express.json({ limit: '50mb' }))

        this.setupRoutes()
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
        this.app.post(`*`, async (req, res) => {
            try {
                const { message } = req.body;
        
                // Handle incoming message using bot.onText or directly
                // bot.on('message', (msg) => {
                //     // Check if the message is a command
                //     if (msg.text?.startsWith('/start')) {
                //         const chatId = msg.chat.id;
                //         const firstName = msg.from?.first_name;
        
                //         // Example response to /start command
                //         bot.sendMessage(chatId, `Hello, ${firstName}! Welcome to our bot.`);
                //     } else if (msg.text?.startsWith('/add')) {
                //         // Handle /add command or any other commands here
                //         const chatId = msg.chat.id;
                //         bot.sendMessage(chatId, 'Received /add command.');
                //     }
                //     // Add more command handling as needed
                // });
        
                // Handle the incoming message from the webhook
           
                bot.processUpdate(req.body);
                
                res.status(200).send('Update received');
            } catch (error) {
                console.error('Error processing update:', error);
                res.status(500).send('Error processing update');
            }
        });
        
    }

    public async init(): Promise<void> {
        // Solana
        const watch = new WatchTransaction(WALLET_ADDRESSES)

        await watch.watchSocket()

        // Bot
        const newMembersHandler = new NewMembersHandler(bot)
        const callbackQueryHandler = new CallbackQueryHandler(bot)
        const startCommand = new StartCommand(bot)
        const addCommand = new AddCommand(bot)

        newMembersHandler.newMember()
        callbackQueryHandler.call()
        startCommand.start()
        addCommand.addCommandHandler()

        this.app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    }

    
}

const main = new Main()
main.init()



