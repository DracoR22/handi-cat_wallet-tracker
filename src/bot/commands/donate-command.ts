import TelegramBot from 'node-telegram-bot-api'
import { DONATE_MENU, SUB_MENU } from '../../config/bot-menus'
import { DonateMessages } from '../messages/donate-messages'
import { PrismaUserRepository } from '../../repositories/prisma/user'
import { userExpectingDonation } from '../../constants/flags'
import { Payments } from '../../lib/payments'
import { PaymentsMessageEnum } from '../../types/messages-types'
import { GeneralMessages } from '../messages/general-messages'

export class DonateCommand {
  private prismaUserRepository: PrismaUserRepository
  private payments: Payments
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.prismaUserRepository = new PrismaUserRepository()
    this.payments = new Payments()
  }

  public async donateCommandHandler(msg: TelegramBot.Message) {
    const user = await this.prismaUserRepository.getUserPlan(String(msg.chat.id))

    const userWallet = user?.personalWalletPubKey

    userExpectingDonation[msg.chat.id] = true
    const listener = async (responseMsg: TelegramBot.Message) => {
      if (!userExpectingDonation[msg.chat.id]) return

      const text = responseMsg.text

      const isValidNumber = !isNaN(Number(text)) && text?.trim() !== ''

      if (!isValidNumber) {
        this.bot.sendMessage(msg.chat.id, 'Please enter a valid amount', {
          reply_markup: SUB_MENU,
          parse_mode: 'HTML',
        })
        return
      }

      const amount = Number(text)

      const { message: paymentMessage, success } = await this.payments.chargeDonation(String(msg.chat.id), amount)

      if (paymentMessage === PaymentsMessageEnum.INSUFFICIENT_BALANCE) {
        this.bot.sendMessage(msg.chat.id, GeneralMessages.insufficientBalanceMessage, {
          reply_markup: SUB_MENU,
          parse_mode: 'HTML',
        })
      } else if (paymentMessage === PaymentsMessageEnum.DONATION_MADE) {
        this.bot.sendMessage(msg.chat.id, DonateMessages.donationMadeMessage, {
          reply_markup: SUB_MENU,
          parse_mode: 'HTML',
        })
      } else {
        this.bot.sendMessage(msg.chat.id, GeneralMessages.generalMessageError, {
          reply_markup: SUB_MENU,
          parse_mode: 'HTML',
        })
      }

      this.bot.removeListener('message', listener)
    }

    this.bot.once('message', listener)

    const messageText = DonateMessages.donateMessage(userWallet)

    this.bot.editMessageText(messageText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: DONATE_MENU,
      parse_mode: 'HTML',
    })
  }
}
