import TelegramBot from 'node-telegram-bot-api'
import { GeneralMessages } from '../messages/general-messages'
import { Payments } from '../../lib/payments'
import { SubscriptionPlan } from '@prisma/client'
import { PaymentsMessageEnum } from '../../types/messages-types'
import { INSUFFICIENT_BALANCE_SUB_MENU, SUB_MENU } from '../../config/bot-menus'

export class UpgradePlanHandler {
  private generalMessages: GeneralMessages
  private payments: Payments
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.generalMessages = new GeneralMessages()
    this.payments = new Payments()
  }

  public async upgradePlan(message: TelegramBot.Message, plan: SubscriptionPlan): Promise<void> {
    const userId = message?.chat.id.toString()
    const chatId = message.chat.id
    const {
      message: subscriptionMessage,
      success,
      subscriptionEnd,
    } = await this.payments.chargeSubscription(userId, plan)

    if (subscriptionMessage === PaymentsMessageEnum.PLAN_UPGRADED) {
      this.bot.editMessageText(GeneralMessages.planUpgradedMessage(plan, subscriptionEnd!), {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: SUB_MENU,
        parse_mode: 'HTML',
      })
    } else if (subscriptionMessage === PaymentsMessageEnum.INSUFFICIENT_BALANCE) {
      this.bot.editMessageText(GeneralMessages.insufficientBalanceMessage, {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: INSUFFICIENT_BALANCE_SUB_MENU,
        parse_mode: 'HTML',
      })
    } else if (subscriptionMessage === PaymentsMessageEnum.USER_ALREADY_PAID) {
      this.bot.editMessageText(GeneralMessages.userAlreadyPaidMessage('PLAN'), {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: SUB_MENU,
        parse_mode: 'HTML',
      })
    } else {
      this.bot.editMessageText(GeneralMessages.generalMessageError, {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: SUB_MENU,
        parse_mode: 'HTML',
      })
    }

    return
  }
}
