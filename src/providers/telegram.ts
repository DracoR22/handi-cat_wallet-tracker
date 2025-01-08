import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'

dotenv.config()

const BOT_TOKEN = process.env.BOT_TOKEN
const TEST_BOT_TOKEN = process.env.TEST_BOT_TOKEN
const APP_URL = process.env.APP_URL

const WEBHOOK_URL = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${APP_URL}`

// uncomment this line for local development and comment webhook setup
// export const bot = new TelegramBot(BOT_TOKEN ?? '', { polling: true })

// webhook -- comment everything below this line to disable webhook setup
export const bot = new TelegramBot(BOT_TOKEN ?? '')

bot
  .setWebHook(WEBHOOK_URL)
  .then(() => {
    console.log(`Webhook set to ${WEBHOOK_URL}`)
  })
  .catch((error) => {
    console.error('Error setting webhook:', error)
  })
