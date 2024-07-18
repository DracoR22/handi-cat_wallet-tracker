import { InlineKeyboardMarkup } from "node-telegram-bot-api";

export const START_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [{ text: '🔥 Add', callback_data: 'add' }, { text: '👀 Manage', callback_data: 'manage' }],
    [{ text: '⚙️ Settings', callback_data: 'settings' }, { text: '👥 Groups', callback_data: 'groups' }],
    [{ text: '📈 PRO', callback_data: 'pro' }, { text: '👛 My Wallet', callback_data: 'my_wallet' }],
    [{ text: '🔗 Links', callback_data: 'links' }, { text: '💱 SELL', callback_data: 'sell' }],
]
}

export const SUB_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [{ text: '🔙 Back', callback_data: 'back_to_main_menu' }],
  ],
};