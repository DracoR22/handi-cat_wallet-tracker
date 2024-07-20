import { Connection, clusterApiUrl } from "@solana/web3.js";

const SOLANA_NETWORK = clusterApiUrl('mainnet-beta');
const HELIUS_NETWORK = ''
export const connection = new Connection(SOLANA_NETWORK, 'confirmed');