import TelegramBot from 'node-telegram-bot-api'

export class SettingsCommand {
  constructor(private bot: TelegramBot) {
    this.bot = bot
  }

  public async settingsCommandHandler() {}
}
