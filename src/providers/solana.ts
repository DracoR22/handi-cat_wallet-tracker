import { Connection, clusterApiUrl } from "@solana/web3.js";

// TODO: move to class contructor
const SOLANA_NETWORK = clusterApiUrl('mainnet-beta');
export const connection = new Connection(SOLANA_NETWORK, 'confirmed');