import TelegramBot from 'node-telegram-bot-api'
import { Payments } from '../../lib/payments'
import { PaymentsMessageEnum } from '../../types/messages-types'
import { GeneralMessages } from '../messages/general-messages'
import { INSUFFICIENT_BALANCE_SUB_MENU, SUB_MENU } from '../../config/bot-menus'
import { DonateMessages } from '../messages/donate-messages'

export class DonateHandler {
  private payments: Payments
  constructor(private bot: TelegramBot) {
    this.payments = new Payments()

    this.bot = bot
  }

  public async makeDonation(message: TelegramBot.Message, donationAmount: number) {
    const userId = String(message.chat.id)
    const chatId = message.chat.id

    const { message: paymentMessage, success } = await this.payments.chargeDonation(userId, donationAmount)

    if (paymentMessage === PaymentsMessageEnum.INSUFFICIENT_BALANCE) {
      this.bot.editMessageText(GeneralMessages.insufficientBalanceMessage, {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: INSUFFICIENT_BALANCE_SUB_MENU,
        parse_mode: 'HTML',
      })
    } else if (paymentMessage === PaymentsMessageEnum.DONATION_MADE) {
      this.bot.editMessageText(DonateMessages.donationMadeMessage, {
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
