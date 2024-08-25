import TelegramBot from 'node-telegram-bot-api'
import { GeneralMessages } from '../messages/general-messages'
import { Subscriptions } from '../../lib/subscriptions'
import { SubscriptionPlan } from '@prisma/client'
import { SubscriptionMessageEnum } from '../../types/parsed-info-types'
import { SUB_MENU } from '../../config/bot-menus'

export class UpgradePlanHandler {
  private generalMessages: GeneralMessages
  private subscriptions: Subscriptions
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.generalMessages = new GeneralMessages()
    this.subscriptions = new Subscriptions()
  }

  public async upgradePlan(message: TelegramBot.Message, plan: SubscriptionPlan): Promise<void> {
    const userId = message?.chat.id.toString()
    const chatId = message.chat.id
    const {
      message: subscriptionMessage,
      success,
      subscriptionEnd,
    } = await this.subscriptions.chargeSubscription(userId, plan)

    if (subscriptionMessage === SubscriptionMessageEnum.PLAN_UPGRADED) {
      this.bot.editMessageText(this.generalMessages.sendPlanUpgradedMessage(plan, subscriptionEnd!), {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: SUB_MENU,
        parse_mode: 'HTML',
      })
    } else if (subscriptionMessage === SubscriptionMessageEnum.INSUFFICIENT_BALANCE) {
      this.bot.editMessageText(this.generalMessages.sendInsufficientBalanceMessage(), {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: SUB_MENU,
        parse_mode: 'HTML',
      })
    } else {
      this.bot.editMessageText(this.generalMessages.sendGeneralMessageError(), {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: SUB_MENU,
        parse_mode: 'HTML',
      })
    }

    return
  }
}
