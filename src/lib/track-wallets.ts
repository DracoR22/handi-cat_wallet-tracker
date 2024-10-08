import { walletsToTrack } from '../constants/flags'
import { connection } from '../providers/solana'
import { PrismaWalletRepository } from '../repositories/prisma/wallet'
import { WalletWithUsers } from '../types/swap-types'
import { WatchTransaction } from './watch-transactions'

export class TrackWallets {
  private prismaWalletRepository: PrismaWalletRepository
  private walletWatcher: WatchTransaction

  public walletsState: []

  constructor() {
    this.prismaWalletRepository = new PrismaWalletRepository()
    this.walletWatcher = new WatchTransaction()

    this.walletsState = []
  }

  public async setupWalletWatcher(refetch?: boolean): Promise<void> {
    const allWallets = await this.prismaWalletRepository.getAllWalletsWithUserIds()
    if (refetch) {
      await this.updateWallets(allWallets!)
    } else {
      // check for paused wallets before initial watcher call
      const pausedWallets = allWallets?.filter((wallet) =>
        wallet.userWallets.some((userWallet) => userWallet.status === 'SPAM_PAUSED'),
      )

      // If there are paused wallets, resume their status
      if (pausedWallets && pausedWallets.length > 0) {
        for (const wallet of pausedWallets) {
          for (const userWallet of wallet.userWallets) {
            if (userWallet.status === 'SPAM_PAUSED') {
              await this.prismaWalletRepository.resumeUserWallet(userWallet.userId, userWallet.walletId)
            }
          }
        }
      }

      walletsToTrack.push(...allWallets!)
      await this.walletWatcher.watchSocket(allWallets!)
    }

    return
  }

  public async listenForDatabaseChanges(): Promise<void> {
    while (true) {
      // Infinite loop to keep the process running
      try {
        const stream = await this.prismaWalletRepository.pulseWallet()

        for await (const event of stream!) {
          try {
            console.log('New event:', event)

            if (event.action === 'create' || event.action === 'update') {
              await this.setupWalletWatcher(true)
            } else if (event.action === 'delete') {
              await this.stopWatchingWallet(event.deleted.walletId)
              await this.setupWalletWatcher(true)
            }
          } catch (eventError: any) {
            console.error('Error processing event:', eventError.message)
            throw eventError // This will exit the loop and trigger a reconnect
          }
        }
      } catch (error: any) {
        console.error('Connection lost. Attempting to reconnect...', error.message)
        // Wait before retrying (e.g., 5 seconds)
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }
    }
  }

  public async triggerDatabaseChange(event: 'create' | 'delete', walletAddress: string) {
    if (event === 'create') {
      return await this.setupWalletWatcher(true)
    } else if (event === 'delete') {
      await this.stopWatchingWallet(walletAddress)

      return await this.setupWalletWatcher(true)
    }
  }

  public async stopWatching(): Promise<void> {
    for (const [wallet, subscriptionId] of this.walletWatcher.subscriptions) {
      connection.removeOnLogsListener(subscriptionId)
      console.log(`Stopped watching transactions for wallet: ${wallet}`)
    }
    this.walletWatcher.subscriptions.clear()
  }

  public async updateWallets(newWallets: WalletWithUsers[]): Promise<void> {
    // await this.stopWatching();
    console.log('REFETCHING WALLETS')
    await this.walletWatcher.watchSocket(newWallets)
  }

  public async stopWatchingWallet(walletId: string): Promise<void> {
    const walletAddress = await this.prismaWalletRepository.getWalletById(walletId)
    if (!walletAddress) return
    const subscriptionId = this.walletWatcher.subscriptions.get(walletAddress!.address)
    console.log('LENGTH', walletAddress.userWallets.length)
    if (subscriptionId && walletAddress.userWallets.length < 1) {
      connection.removeOnLogsListener(subscriptionId)
      console.log(`Stopped watching transactions for wallet: ${walletAddress!.address}`)
      this.walletWatcher.subscriptions.delete(walletAddress!.address)
    } else {
      console.log(`No active subscription found for wallet: ${walletAddress}`)
    }
  }
}
