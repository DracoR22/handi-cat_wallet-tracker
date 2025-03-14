import { InlineKeyboardMarkup } from 'node-telegram-bot-api'
import { HOBBY_PLAN_FEE, PRO_PLAN_FEE, WHALE_PLAN_FEE } from '../constants/pricing'
import { HandiCatStatus } from '@prisma/client'
import { text } from 'stream/consumers'

export const START_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    // [{ text: '🌟 Buy Limited-Time Offer', callback_data: 'buy_promotion' }],
    [
      { text: '🔮 Add', callback_data: 'add' },
      { text: '👀 Manage', callback_data: 'manage' },
    ],
    [
      { text: '👛 My Wallet', callback_data: 'my_wallet' },
      { text: '❤️ Donate', callback_data: 'donate' },
      { text: '⚙️ Settings', callback_data: 'settings' },
    ],
    [
      { text: '🆕 Groups', callback_data: 'groups' },
      { text: '🔎 Help', callback_data: 'help' },
    ],
    [{ text: '👑 Upgrade', callback_data: 'upgrade' }],
  ],
}

export const SUB_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [[{ text: '🔙 Back', callback_data: 'back_to_main_menu' }]],
}

export const createTxSubMenu = (tokenSymbol: string, tokenMint: string) => {
  const txSubMenu: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: `🐴 Buy on Trojan: ${tokenSymbol}`,
          url: `https://t.me/solana_trojanbot?start=r-handicatbt-${tokenMint}`,
        },
      ],
      [
        { text: `🐶 BonkBot: ${tokenSymbol}`, url: `https://t.me/bonkbot_bot?start=ref_3au54_ca_${tokenMint}` },
        {
          text: `⭐ Axiom: ${tokenSymbol}`,
          url: `https://axiom.trade/t/${tokenMint}/@handi`,
        },
      ],
      [
        {
          text: `🦖 GMGN: ${tokenSymbol}`,
          url: `https://t.me/GMGN_sol_bot?start=i_kxPdcLKf_c_${tokenMint}`,
        },
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

export const UPGRADE_PLAN_SUB_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      {
        text: `BUY HOBBY ${HOBBY_PLAN_FEE / 1e9} SOL/m`,
        callback_data: 'upgrade_hobby',
      },
    ],
    [
      {
        text: `BUY PRO ${PRO_PLAN_FEE / 1e9} SOL/m`,
        callback_data: 'upgrade_pro',
      },
    ],
    [
      {
        text: `BUY WHALE ${WHALE_PLAN_FEE / 1e9} SOL/m`,
        callback_data: 'upgrade_whale',
      },
    ],

    [{ text: '🔙 Back', callback_data: 'back_to_main_menu' }],
  ],
}

export const DONATE_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [{ text: `❤️ ${0.1} SOL`, callback_data: 'donate_action_0.1' }],
    [{ text: `✨ ${0.5} SOL`, callback_data: 'donate_action_0.5' }],
    [{ text: `💪 ${1.0} SOL`, callback_data: 'donate_action_1.0' }],
    [{ text: `🗿 ${5.0} SOL`, callback_data: 'donate_action_5.0' }],
    [{ text: `🔥 ${10.0} SOL`, callback_data: 'donate_action_10.0' }],
    [{ text: '🔙 Back', callback_data: 'back_to_main_menu' }],
  ],
}

export const SUGGEST_UPGRADE_SUBMENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [{ text: '👑 Upgrade', callback_data: 'upgrade' }],
    [{ text: '🔙 Back', callback_data: 'back_to_main_menu' }],
  ],
}

export const INSUFFICIENT_BALANCE_SUB_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [{ text: '😺 Your Handi Cat Wallet', callback_data: 'my_wallet' }],
    [{ text: '🔙 Back', callback_data: 'back_to_main_menu' }],
  ],
}

export const USER_SETTINGS_MENU = (botStatus: HandiCatStatus): InlineKeyboardMarkup => {
  return {
    inline_keyboard: [
      [
        {
          text: `${botStatus === 'ACTIVE' ? '⏸️ Pause Handi Cat' : '▶️ Resume Handi Cat'}`,
          callback_data: 'pause-resume-bot',
        },
      ],
      [{ text: '🔙 Back', callback_data: 'back_to_main_menu' }],
    ],
  }
}

export const USER_WALLET_SUB_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      {
        text: '🔑 Show private key',
        callback_data: 'show_private_key',
      },
    ],
    [{ text: '🔙 Back', callback_data: 'back_to_main_menu' }],
  ],
}

export const GROUPS_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      {
        text: '🗑️ Delete Group',
        callback_data: 'delete_group',
      },
    ],
    [{ text: '🔙 Back', callback_data: 'back_to_main_menu' }],
  ],
}
