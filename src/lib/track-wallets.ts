import { PrismaWalletRepository } from "../repositories/prisma/wallet";
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
            await this.walletWatcher.updateWallets(allWallets!);
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
                await this.walletWatcher.stopWatchingWallet(event.deleted.walletId)

                // Refetch wallets and update watcher on create/delete actions
                await this.setupWalletWatcher(true);
            }
        }
    }

    public async triggerDatabaseChange(event: 'create' | 'delete', walletAddress: string) {
       if (event === 'create') {
         return await this.setupWalletWatcher(true);
       } else if (event === 'delete') {
        await this.walletWatcher.stopWatchingWallet(walletAddress)

        return await this.setupWalletWatcher(true);
       }
    }
}