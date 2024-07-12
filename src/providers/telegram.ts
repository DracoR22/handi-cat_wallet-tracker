import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv"

dotenv.config()

const BOT_TOKEN = process.env.BOT_TOKEN
console.log(BOT_TOKEN)

const WEBHOOK_URL = 'https://api.telegram.org/bot7452618308:AAEpqrvzeQXBQj28tHlXyIr6tEO8njLjJgc/setWebhook?url=https://88d8-190-140-13-100.ngrok-free.app/'

// polling
// export const bot = new TelegramBot(BOT_TOKEN, { polling: true })

// webhook
export const bot = new TelegramBot(BOT_TOKEN ?? '')
// Set the webhook
bot.setWebHook(WEBHOOK_URL).then(() => {
    console.log(`Webhook set to ${WEBHOOK_URL}`);
}).catch(error => {
    console.error('Error setting webhook:', error);
});
