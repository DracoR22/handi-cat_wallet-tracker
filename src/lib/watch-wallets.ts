import { PrismaWalletRepository } from "../repositories/prisma/wallet";
import { WatchTransaction } from "./watch-transactions";

export class WatchWallets {
    // private prismaWalletRepository: PrismaWalletRepository;
    // private watch: WatchTransaction | null = null;

    // constructor() {
    //     this.prismaWalletRepository = new PrismaWalletRepository();
    // }

    // public async setupWalletWatcher(): Promise<void> {
    //     const allWallets = await this.prismaWalletRepository.getAll();
    //     const walletAddresses = allWallets?.map(wallet => wallet.address) || [] // Ensure unique addresses

    //     // console.log('ALL_WALLETS', walletAddresses);

    //     if (this.watch) {
    //         await this.watch.updateWallets(walletAddresses);
    //     } else {
    //         this.watch = new WatchTransaction(walletAddresses);
    //         await this.watch.watchSocket();
    //     }
    // }

    // public async listenForDatabaseChanges(): Promise<void> {
    //     const stream = await this.prismaWalletRepository.pulseWallet();

    //     for await (const event of stream) {
    //         console.log('New event:', event);

    //         if (event.action === 'create' || event.action === 'delete') {
    //             // Refetch wallets and update watcher on create/delete actions
    //             await this.setupWalletWatcher();
    //         }
    //     }
    // }
}