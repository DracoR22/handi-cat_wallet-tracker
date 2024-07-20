import { PublicKey } from "@solana/web3.js";
import { connection } from "./providers/solana";
import { Token } from "@solana/spl-token";
import { RAYDIUM_PROGRAM_ID } from "./config/solana/program-ids";

// Replace with your actual token account address
const tokenAccountAddress = new PublicKey('5b39hnBZ24a2LzLRqmzj8eTUc8GXpnTVTBwEvPoRpump');


// Replace with your actual token account address
const tokenAccountAddressWrappedSol = new PublicKey('4HzSzvHe4h38oazMFSMpc4ewf27MHoCfAYBBaenBwJEa');

//4HzSzvHe4h38oazMFSMpc4ewf27MHoCfAYBBaenBwJEa
async function getTokenBalance(tokenAccountAddress: PublicKey) {
  try {
    const tokenBalance = await connection.getTokenAccountBalance(tokenAccountAddress);
    console.log('TOKEN_BALANCE', tokenBalance)
    return tokenBalance.value.amount;
  } catch (error) {
    console.error('Error fetching token balance:', error);
    throw error;
  }
}
export async function fetchAndCalculate(){
  let splTokenBalance: any = await getTokenBalance(tokenAccountAddress);
  let wrappedSol: any = await getTokenBalance(tokenAccountAddressWrappedSol);

  let priceOfSPLToken= (wrappedSol/1_000_000_000)/(splTokenBalance/1_000_000);
  console.log("priceOfSPLToken: "+priceOfSPLToken);

}

// fetchAndCalculate();

export const getTokenAccount = async () => {
//the public solana address
const accountPublicKey = new PublicKey(
    "2B1Uy1UTnsaN1rBNJLrvk8rzTf5V187wkhouWJSApvGT"
  );

//mintAccount = the token mint address
  const mintAccount = new PublicKey(
    "GLmaRDRmYd4u3YLfnj9eq1mrwxa1YfSweZYYZXZLTRdK"
  );
  const account = await connection.getTokenAccountsByOwner(accountPublicKey, {
      mint: mintAccount});

      console.log(account.value[0].pubkey.toString());

}