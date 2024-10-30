import TelegramBot from 'node-telegram-bot-api'
import { Payments } from '../../lib/payments'
import { PromotionType } from '@prisma/client'
import { GeneralMessages } from '../messages/general-messages'
import { PaymentsMessageEnum } from '../../types/messages-types'
import { INSUFFICIENT_BALANCE_SUB_MENU, SUB_MENU } from '../../config/bot-menus'

export class PromotionHandler {
  private payments: Payments
  private generalMessages: GeneralMessages
  constructor(private bot: TelegramBot) {
    this.bot = bot
    this.payments = new Payments()
    this.generalMessages = new GeneralMessages()
  }

  public async buyPromotion(message: TelegramBot.Message, promotionPrice: number, promotionType: PromotionType) {
    const userId = String(message.chat.id)
    const chatId = message.chat.id

    const { message: paymentMessage, success } = await this.payments.chargePromotion(
      userId,
      promotionPrice,
      promotionType,
    )

    if (paymentMessage === PaymentsMessageEnum.INSUFFICIENT_BALANCE) {
      this.bot.editMessageText(this.generalMessages.sendInsufficientBalanceMessage(), {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: INSUFFICIENT_BALANCE_SUB_MENU,
        parse_mode: 'HTML',
      })
    } else if (paymentMessage === PaymentsMessageEnum.USER_ALREADY_PAID) {
      this.bot.editMessageText('It seems that you already purchased this promotion', {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: INSUFFICIENT_BALANCE_SUB_MENU,
        parse_mode: 'HTML',
      })
    } else if (paymentMessage === PaymentsMessageEnum.TRANSACTION_SUCCESS) {
      this.bot.editMessageText(
        `
😸 Promotion purchased!

You now will be able to track up to 50 wallets at the same time forever! ✨
`,
        {
          chat_id: chatId,
          message_id: message.message_id,
          reply_markup: SUB_MENU,
          parse_mode: 'HTML',
        },
      )
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
