import SolanaWeb3 from '@solana/web3.js'

export class CreateWallet {
  constructor() {}

  public create() {
    const keypair = SolanaWeb3.Keypair.generate()

    const publicKey = keypair.publicKey.toString()
    const privateKey = Buffer.from(keypair.secretKey).toString('base64')

    console.log('Public Key (wallet Address):', publicKey)
    console.log('Private Key:', privateKey)

    return { publicKey, privateKey }
  }
}
