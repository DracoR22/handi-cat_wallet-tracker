import { Connection, PublicKey, VersionedTransactionResponse } from '@solana/web3.js'
import { Metadata, deprecated } from '@metaplex-foundation/mpl-token-metadata'

export class Token {
    constructor(
        private connection: Connection,
        private transactionDetails: VersionedTransactionResponse
    ) {
        this.connection = connection
        this.transactionDetails = transactionDetails
    }

    public async getTokens(): Promise<Metadata[]> {
         // Get tokens swapped
         const postTokenBalances = this.transactionDetails.meta?.postTokenBalances
         console.log('POSTTOKENBALANCES', postTokenBalances)
         if (!postTokenBalances) {
            return []
         }

         const token1 = this.transactionDetails.meta!.postTokenBalances![0]

         const mintPublicKey = new PublicKey(token1.mint);
         const tokenmetaPubkey = await deprecated.Metadata.getPDA(mintPublicKey);
         const metdadataContent =  await Metadata.fromAccountAddress(this.connection, tokenmetaPubkey);
         console.log("METADATA:", metdadataContent.pretty());

         const metadataList: Metadata[] = [];

        //  for (const token of postTokenBalances) {
        //     const mintPublicKey = new PublicKey(token.mint);
            
        //     const tokenMetaPubkey = await deprecated.Metadata.getPDA(mintPublicKey);
        //     const metadataContent = await Metadata.fromAccountAddress(this.connection, tokenMetaPubkey);

        //     console.log("Metadata:", metadataContent.pretty());
        //     metadataList.push(metadataContent);
        // }

        return metadataList
    }
}