import { WalletWithUsers } from '../types/swap-types'

export const userExpectingWalletAddress: { [key: number]: boolean } = {}
export const userExpectingDonation: { [key: number]: boolean } = {}
export const walletsToTrack: WalletWithUsers[] = []

export const cachedUsdSolPrice = ''
