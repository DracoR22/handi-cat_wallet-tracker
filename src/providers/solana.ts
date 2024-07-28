import { Connection, clusterApiUrl } from "@solana/web3.js";
import dotenv from "dotenv"

dotenv.config()

const SOLANA_NETWORK = clusterApiUrl('mainnet-beta');
const HELIUS_NETWORK = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
const ALCHEMY_NETWORK = `https://solana-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`

export const connection = new Connection(SOLANA_NETWORK, 'confirmed');