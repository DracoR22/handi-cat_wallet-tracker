import { PrismaWalletRepository } from "../repositories/prisma/wallet";
import { WatchTransaction } from "./watch-transactions";

export class TrackWallets {
    private prismaWalletRepository: PrismaWalletRepository;
    private walletWatcher: WatchTransaction

    constructor() {
        this.prismaWalletRepository = new PrismaWalletRepository();
        this.walletWatcher = new WatchTransaction()
    }

    public async setupWalletWatcher(refetch?: boolean): Promise<void> {
        const allWallets = await this.prismaWalletRepository.getAllWalletsWithUserIds()

        if (refetch) {
            await this.walletWatcher.updateWallets(allWallets!);
        } else {
            await this.walletWatcher.watchSocket(allWallets!);
        }
    }

    public async listenForDatabaseChanges(): Promise<void> {
        const stream = await this.prismaWalletRepository.pulseWallet();

        for await (const event of stream) {
            console.log('New event:', event);

            if (event.action === 'create' || event.action === 'delete') {
                // Refetch wallets and update watcher on create/delete actions
                await this.setupWalletWatcher(true);
            }
        }
    }
}