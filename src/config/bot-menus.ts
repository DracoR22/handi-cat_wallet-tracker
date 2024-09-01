import { InlineKeyboardMarkup } from 'node-telegram-bot-api'
import { HOBBY_PLAN_FEE, PRO_PLAN_FEE, WHALE_PLAN_FEE } from '../constants/pricing'

export const START_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '🔮 Add', callback_data: 'add' },
      { text: '👀 Manage', callback_data: 'manage' },
    ],
    [
      { text: '👛 My Wallet', callback_data: 'my_wallet' },
      { text: '👑 Upgrade', callback_data: 'upgrade' },
      { text: '🐱 Get Code', callback_data: 'buy_code' },
    ],
    // [{ text: '⚙️ Settings', callback_data: 'settings' }, { text: '👥 Groups', callback_data: 'groups' }],
    // [{ text: '💎 PRO', callback_data: 'pro' }, { text: '👛 My Wallet', callback_data: 'my_wallet' }],
    // [{ text: '🔗 Links', callback_data: 'links' }, { text: '💱 SELL', callback_data: 'sell' }],
  ],
}

export const SUB_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [[{ text: '🔙 Back', callback_data: 'back_to_main_menu' }]],
}

export const TX_SUB_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [[{ text: 'Buy on GMGN' }]],
}

export const createTxSubMenu = (tokenSymbol: string, tokenMint: string) => {
  const txSubMenu: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: `🐸 Buy on PepeBoost: ${tokenSymbol}`,
          url: `https://t.me/pepeboost_sol_bot?start=ref_03pbvu_ca_${tokenMint}`,
        },
      ],
      [
        { text: `🐶 BonkBot: ${tokenSymbol}`, url: `https://t.me/bonkbot_bot?start=ref_3au54_ca_${tokenMint}` },
        { text: `🥷🏻 Shuriken: ${tokenSymbol}`, url: `https://t.me/ShurikenTradeBot?start=qt-handi_cat-${tokenMint}` },
      ],
    ],
  }

  return txSubMenu
}

export const MANAGE_SUB_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '🔮 Add', callback_data: 'add' },
      { text: '🗑️ Delete', callback_data: 'delete' },
    ],

    [{ text: '🔙 Back', callback_data: 'back_to_main_menu' }],
  ],
}

export const UPGRADE_PLAN_SUBMENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      {
        text: `BUY HOBBY ${HOBBY_PLAN_FEE / 1e9} SOL /m`,
        callback_data: 'upgrade_hobby',
      },
    ],
    [
      {
        text: `BUY PRO ${PRO_PLAN_FEE / 1e9} SOL /m`,
        callback_data: 'upgrade_pro',
      },
    ],
    [
      {
        text: `BUY WHALE ${WHALE_PLAN_FEE / 1e9} SOL /m`,
        callback_data: 'upgrade_whale',
      },
    ],
    [
      {
        text: `😸 Or click to buy your own Handi Cat!`,
        callback_data: 'buy_code',
      },
    ],

    [{ text: '🔙 Back', callback_data: 'back_to_main_menu' }],
  ],
}
