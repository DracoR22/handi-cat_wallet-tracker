import TelegramBot from 'node-telegram-bot-api'
import { Payments } from '../../lib/payments'
import { PaymentsMessageEnum } from '../../types/messages-types'
import { GeneralMessages } from '../messages/general-messages'
import { INSUFFICIENT_BALANCE_SUB_MENU, SUB_MENU } from '../../config/bot-menus'
import { DonateMessages } from '../messages/donate-messages'

export class DonateHandler {
  private payments: Payments
  private generalMessages: GeneralMessages
  private donateMessages: DonateMessages
  constructor(private bot: TelegramBot) {
    this.payments = new Payments()
    this.generalMessages = new GeneralMessages()
    this.donateMessages = new DonateMessages()

    this.bot = bot
  }

  public async makeDonation(message: TelegramBot.Message, donationAmount: number) {
    const userId = String(message.chat.id)
    const chatId = message.chat.id

    const { message: paymentMessage, success } = await this.payments.chargeDonation(userId, donationAmount)

    if (paymentMessage === PaymentsMessageEnum.INSUFFICIENT_BALANCE) {
      this.bot.editMessageText(this.generalMessages.sendInsufficientBalanceMessage(), {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: INSUFFICIENT_BALANCE_SUB_MENU,
        parse_mode: 'HTML',
      })
    } else if (paymentMessage === PaymentsMessageEnum.DONATION_MADE) {
      this.bot.editMessageText(this.donateMessages.sendDonationMadeMessage(), {
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
