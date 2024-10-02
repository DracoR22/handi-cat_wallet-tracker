import TelegramBot, { InlineKeyboardMarkup } from 'node-telegram-bot-api'
import { AddCommand } from '../commands/add-command'
import { START_MENU, SUB_MENU } from '../../config/bot-menus'
import { ManageCommand } from '../commands/manage-command'
import { DeleteCommand } from '../commands/delete-command'
import { userExpectingWalletAddress } from '../../constants/flags'
import { MyWalletCommand } from '../commands/mywallet-command'
import { GeneralMessages } from '../messages/general-messages'
import { UpgradePlanCommand } from '../commands/upgrade-plan-command'
import { MAX_HOBBY_WALLETS } from '../../constants/pricing'
import { UpgradePlanHandler } from './upgrade-plan-handler'
import { BuyCodeCommand } from '../commands/buy-code-command'
import { BuyCodeHandler } from './buy-code-handler'
import { SettingsCommand } from '../commands/settings-command'
import { UpdateBotStatusHandler } from './update-bot-status-handler'

export class CallbackQueryHandler {
  private addCommand: AddCommand
  private manageCommand: ManageCommand
  private deleteCommand: DeleteCommand
  private myWalletCommand: MyWalletCommand
  private upgradePlanCommand: UpgradePlanCommand
  private buyCodeCommand: BuyCodeCommand
  private settingsCommand: SettingsCommand
  private updateBotStatusHandler: UpdateBotStatusHandler

  private generalMessages: GeneralMessages

  private upgradePlanHandler: UpgradePlanHandler
  private buyCodeHandler: BuyCodeHandler
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.addCommand = new AddCommand(this.bot)
    this.manageCommand = new ManageCommand(this.bot)
    this.deleteCommand = new DeleteCommand(this.bot)
    this.myWalletCommand = new MyWalletCommand(this.bot)
    this.upgradePlanCommand = new UpgradePlanCommand(this.bot)
    this.buyCodeCommand = new BuyCodeCommand(this.bot)
    this.settingsCommand = new SettingsCommand(this.bot)
    this.updateBotStatusHandler = new UpdateBotStatusHandler(this.bot)

    this.generalMessages = new GeneralMessages()

    this.upgradePlanHandler = new UpgradePlanHandler(this.bot)
    this.buyCodeHandler = new BuyCodeHandler(this.bot)
  }

  public call() {
    this.bot.on('callback_query', async (callbackQuery) => {
      const message = callbackQuery.message
      const chatId = message?.chat.id
      const data = callbackQuery.data

      const userId = message?.chat.id.toString()

      if (!chatId || !userId) {
        return
      }

      let responseText

      switch (data) {
        case 'add':
          this.addCommand.addButtonHandler(message)
          break
        case 'manage':
          await this.manageCommand.manageButtonHandler(message)
          break
        case 'delete':
          this.deleteCommand.deleteButtonHandler(message)
          break
        case 'settings':
          this.settingsCommand.settingsCommandHandler(message)
          break
        case 'pause-resume-bot':
          await this.updateBotStatusHandler.pauseResumeBot(message)
          break
        case 'upgrade':
          this.upgradePlanCommand.upgradePlanCommandHandler(message)
          break
        case 'upgrade_hobby':
          await this.upgradePlanHandler.upgradePlan(message, 'HOBBY')
          break
        case 'upgrade_pro':
          await this.upgradePlanHandler.upgradePlan(message, 'PRO')
          break
        case 'upgrade_whale':
          await this.upgradePlanHandler.upgradePlan(message, 'WHALE')
          break
        case 'buy_code':
          this.buyCodeCommand.buyCodeCommandHandler(message)
          break
        case 'buy_code_action':
          await this.buyCodeHandler.buySourceCode(message)
          break
        case 'my_wallet':
          this.myWalletCommand.myWalletCommandHandler(message)
          break
        case 'back_to_main_menu':
          const messageText = this.generalMessages.sendStartMessage()

          // reset any flags
          userExpectingWalletAddress[Number(chatId)] = false

          this.bot.editMessageText(messageText, {
            chat_id: chatId,
            message_id: message.message_id,
            reply_markup: START_MENU,
          })
          break
        default:
          responseText = 'Unknown command.'
      }

      // this.bot.sendMessage(chatId, responseText);
    })
  }
}
