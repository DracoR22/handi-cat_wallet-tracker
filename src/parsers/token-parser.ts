import { Connection, PublicKey, VersionedTransactionResponse } from '@solana/web3.js'
import { Collection, Data, Metadata, TokenStandard, Uses, deprecated } from '@metaplex-foundation/mpl-token-metadata'
import {} from '../providers/solana'

interface TokenInfo {
  key: string
  updateAuthority: string
  mint: string
  data: Data
  primarySaleHappened: boolean
  isMutable: boolean
  editionNonce: number
  tokenStandard: TokenStandard
  collection: Collection
  uses: Uses
}

export class TokenParser {
  constructor(private connection: Connection) {
    this.connection = connection
  }

  public async getTokenInfo(tokenMint: string): Promise<TokenInfo> {
    const mintPublicKey = new PublicKey(tokenMint)
    const tokenmetaPubkey = await deprecated.Metadata.getPDA(mintPublicKey)
    const tokenContent = await Metadata.fromAccountAddress(this.connection, tokenmetaPubkey)

    const token = tokenContent.pretty()
    //  console.log('TOKEN', token)

    return token
  }
}
