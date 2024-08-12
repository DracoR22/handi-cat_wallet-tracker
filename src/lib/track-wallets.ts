import { connection } from "../providers/solana";
import { PrismaWalletRepository } from "../repositories/prisma/wallet";
import { WalletWithUsers } from "../types/swap-types";
import { WatchTransaction } from "./watch-transactions";

export class TrackWallets {
    private prismaWalletRepository: PrismaWalletRepository;
    private walletWatcher: WatchTransaction

    public walletsState: []

    constructor() {
        this.prismaWalletRepository = new PrismaWalletRepository();
        this.walletWatcher = new WatchTransaction()

        this.walletsState = []
    }

    public async setupWalletWatcher(refetch?: boolean): Promise<void> {
        const allWallets = await this.prismaWalletRepository.getAllWalletsWithUserIds()

        if (refetch) {
            await this.updateWallets(allWallets!);
        } else {
            await this.walletWatcher.watchSocket(allWallets!);
        }

        return
    }

    public async listenForDatabaseChanges(): Promise<void> {
        const stream = await this.prismaWalletRepository.pulseWallet();

        for await (const event of stream) {
            console.log('New event:', event);

            if (event.action === 'create') {
                // Refetch wallets and update watcher on create/delete actions
                await this.setupWalletWatcher(true);
            } else if (event.action === 'delete') {
                await this.stopWatchingWallet(event.deleted.walletId)

                // Refetch wallets and update watcher on create/delete actions
                await this.setupWalletWatcher(true);
            }
        }
    }

    public async triggerDatabaseChange(event: 'create' | 'delete', walletAddress: string) {
       if (event === 'create') {
         return await this.setupWalletWatcher(true);
       } else if (event === 'delete') {
        await this.stopWatchingWallet(walletAddress)

        return await this.setupWalletWatcher(true);
       }
    }

    public async stopWatching(): Promise<void> {
        for (const [wallet, subscriptionId] of this.walletWatcher.subscriptions) {
            connection.removeOnLogsListener(subscriptionId);
            console.log(`Stopped watching transactions for wallet: ${wallet}`);
        }
        this.walletWatcher.subscriptions.clear();
    }

    public async updateWallets(newWallets: WalletWithUsers[]): Promise<void> {
        // await this.stopWatching();
        console.log('REFETCHING WALLETS')
        await this.walletWatcher.watchSocket(newWallets);
    }

    public async stopWatchingWallet(walletId: string): Promise<void> {
      const walletAddress = await this.prismaWalletRepository.getWalletById(walletId)
      const subscriptionId = this.walletWatcher.subscriptions.get(walletAddress!.address);
      if (subscriptionId) {
        connection.removeOnLogsListener(subscriptionId);
        console.log(`Stopped watching transactions for wallet: ${walletAddress!.address}`);
        this.walletWatcher.subscriptions.delete(walletAddress!.address);
      } else {
        console.log(`No active subscription found for wallet: ${walletAddress}`);
      }
    }
}