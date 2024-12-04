import { Connection, clusterApiUrl } from '@solana/web3.js'
import dotenv from 'dotenv'

dotenv.config()

// Don't try to use helius network with their free plan, they banned getParsedTransactions method from it
const SOLANA_NETWORK = clusterApiUrl('mainnet-beta')
const HELIUS_NETWORK = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
const CHAINSTACK_NETWORK = `https://solana-mainnet.core.chainstack.com/${process.env.CHAINSTACK_API_KEY}`
const QUICKNODE_NETWORK = process.env.QUICKNODE_API_KEY ?? ''

export const connection = new Connection(CHAINSTACK_NETWORK, 'confirmed')
// export const connection2 = new Connection(CHAINSTACK_NETWORK2, 'confirmed')
