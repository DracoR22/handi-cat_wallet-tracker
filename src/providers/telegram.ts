import TelegramBot from "node-telegram-bot-api";

const BOT_TOKEN = '7452618308:AAEpqrvzeQXBQj28tHlXyIr6tEO8njLjJgc';
export const bot = new TelegramBot(BOT_TOKEN, { polling: true }); // Create a bot that uses 'polling' to fetch new updates