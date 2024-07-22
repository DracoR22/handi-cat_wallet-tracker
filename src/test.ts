import { PublicKey } from "@solana/web3.js";
import { RAYDIUM_PROGRAM_ID } from "./config/solana/program-ids";
import { connection } from "./providers/solana";
import { Liquidity, PoolInfoLayout, SqrtPriceMath, } from "@raydium-io/raydium-sdk";
import { Utils } from "./lib/token-utils";
import { FormatNumbers } from "./lib/format-numbers";

// POOL ADDRESS MUST BE AUTHORITY OF RAYDIUM V4

export const test = async () => {
  const transactionDetails = await connection.getParsedTransactions(['3QDxRMDv7TVZKtcXx4tjqhq1WjbPEF7wFsz1yRNUSXsCDw9e8EQ59bZM8wh9uFQUVHnFnckABWyULvM4Ji4LJDyv'], {
    maxSupportedTransactionVersion: 0,
});

if (!transactionDetails || !transactionDetails[0]) {
  return
}

const transactions: any = []
const parsedInfos: any[] = [];

transactionDetails[0].meta?.innerInstructions?.forEach((i: any) => {
  // raydium
  i.instructions.forEach((r: any) => {
    if (r.parsed?.type === 'transfer' && r.parsed.info.amount !== undefined) {
      transactions.push(r.parsed);
    }
  });
});


console.log('TRANSACTIONS', transactions)
}

// Raydium liquidity pool addresses (example for USDC/SPL_TOKEN)
// const poolAddress = new PublicKey('PoolPublicKeyHere');

// async function getRaydiumPoolPrice() {
//     // Load the Raydium pool
//     const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys: { id: poolAddress, programId:  } });

//     // Get the reserves
//     const { baseReserve, quoteReserve } = poolInfo;

//     // Calculate the price (quoteReserve / baseReserve)
//     const price = quoteReserve / baseReserve;

//     return price;
// }



//-------------------------------------------------------------------------------------------------------//

async function getSolPriceNative() {
  const id = new PublicKey('8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj');

  const accountInfo = await connection.getAccountInfo(id);

  if (accountInfo === null) {
    console.log('get pool info error');
    return;
  }

  const poolData = PoolInfoLayout.decode(accountInfo.data);

  const solPrice = SqrtPriceMath.sqrtPriceX64ToPrice(poolData.sqrtPriceX64, poolData.mintDecimalsA, poolData.mintDecimalsB).toFixed(2);

  return solPrice;
}

// Replace with your actual token account address
const tokenAccountAddress = new PublicKey('6f1SB7neLsDfGgoqKyFobf1uxtevJN8ztNZUfT8URSkp');

// Replace with your actual token account address
const tokenAccountAddressWrappedSol = new PublicKey('4iBYtxm1HWPhgpok3sgy3NLfthHP6SZD4tneM99hAnAo');

//4HzSzvHe4h38oazMFSMpc4ewf27MHoCfAYBBaenBwJEa
async function getTokenBalance(tokenAccountAddress: any) {
  try {
    const tokenBalance = await connection.getTokenAccountBalance(tokenAccountAddress);
    return tokenBalance.value.amount;
  } catch (error) {
    console.error('Error fetching token balance:', error);
    throw error;
  }
}
export async function fetchAndCalculate() {
  try {
    const splTokenBalance: any = await getTokenBalance(tokenAccountAddress);
    const wrappedSolBalance: any = await getTokenBalance(tokenAccountAddressWrappedSol);
    const solPriceInUsd: any = await getSolPriceNative();

    const priceOfSPLTokenInSOL = (wrappedSolBalance / 1_000_000_000) / (splTokenBalance / 1_000_000);
    const priceOfSPLTokenInUSD = priceOfSPLTokenInSOL * solPriceInUsd;

    console.log("priceOfSPLToken in SOL: " + priceOfSPLTokenInSOL);
    console.log("priceOfSPLToken in USD: " + priceOfSPLTokenInUSD);

  } catch (error) {
    console.error('Error fetching and calculating price:', error);
  }
}

export async function getTokenMktCap(tokenMint: string, tokenPrice: number) {
  const mintPublicKey = new PublicKey(tokenMint);
  const tokenSupply = await connection.getTokenSupply(mintPublicKey);
  const supplyValue = tokenSupply.value.uiAmount;
  console.log('SUPPLY VALUE', supplyValue)

  if (!supplyValue) {
    return
  }

  if (!tokenPrice || tokenPrice === undefined || tokenPrice === null) {
   console.log('NO TOKEN PRICE')
    return
  }

  const tokenMarketCap = supplyValue * tokenPrice

  const utils = new FormatNumbers()

  const formattedMarketCap = utils.formatNumber(tokenMarketCap)

  console.log('TOKEN_MARKET_CAP', formattedMarketCap)
  return formattedMarketCap
}