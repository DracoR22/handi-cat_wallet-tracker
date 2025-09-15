import { Connection, clusterApiUrl } from '@solana/web3.js'
import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

// I use a separate helius connection to just get the logs cause i found this is the fastest one and will get most of the notifications
const HELIUS_NETWORK = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`

const RPC_ENDPOINTS =
  process.env.RPC_ENDPOINTS?.split(',')
    .map((url) => url.trim())
    .filter(Boolean) ?? []

console.log(chalk.bold.greenBright(`LOADED ${RPC_ENDPOINTS.length} RPC ENDPOINTS`))

// If you are going to use Handi Cat locally you can just use SOLANA_NETWORK for all connections
// and will work fine as long you dont track too many wallets
export class RpcConnectionManager {
  static connections: Connection[] = RPC_ENDPOINTS.map((url) => new Connection(url, 'confirmed'))

  static logConnection = new Connection(HELIUS_NETWORK, 'processed')

  static getRandomConnection(): Connection {
    const randomIndex = Math.floor(Math.random() * RpcConnectionManager.connections.length)
    return RpcConnectionManager.connections[randomIndex]
  }

  static resetLogConnection() {
    RpcConnectionManager.logConnection = new Connection(HELIUS_NETWORK, 'processed')
  }
}
