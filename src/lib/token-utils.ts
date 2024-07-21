import { AccountInfo, Connection, ParsedTransactionWithMeta, PublicKey, SystemProgram } from "@solana/web3.js";
import { connection } from "../providers/solana";
// @ts-expect-error
import { getAccount } from "@solana/spl-token";
import { TokenListProvider } from "@solana/spl-token-registry"

import axios from "axios";
import { PoolInfoLayout, SqrtPriceMath } from "@raydium-io/raydium-sdk";
import { SwapType } from "../types/swap-types";
import dotenv from "dotenv"
dotenv.config()

export class Utils {
    constructor() {}
    public async getTokenMintAddress(tokenAddress: string) {
        try {
          const tokenPublicKey = new PublicKey(tokenAddress);
          const accountInfo = await getAccount(connection, tokenPublicKey);
          return accountInfo.mint.toBase58();
        } catch (error) {
          console.error(`Error fetching mint address for token ${tokenAddress}:`, error);
          return null;
        }
      }

    public async getTokenMintAddressWithFallback(transactions: any) {
        let tokenOutMint = null;
      
        if (transactions[0]?.info?.destination) {
          tokenOutMint = await this.getTokenMintAddress(transactions[0].info.destination);
        }
      
        if (!tokenOutMint && transactions[0]?.info?.source) {
          tokenOutMint = await this.getTokenMintAddress(transactions[0].info.source);
        }
      
        return tokenOutMint;
    }

    public calculateNativeBalanceChanges(transactionDetails: (ParsedTransactionWithMeta | null)[]) {
        const meta = transactionDetails[0] && transactionDetails[0].meta;
        
        if (!meta) {
          console.log('No meta information available');
          return;
        }
      
        const preBalances = meta.preBalances;
        const postBalances = meta.postBalances;
      
        if (!preBalances || !postBalances) {
          console.log('No balance information available');
          return;
        }
      
        const balanceChanges = [];
      
        // Calculate SOL balance changes for each account
        for (let i = 0; i < preBalances.length; i++) {
          const preBalance = preBalances[i];
          const postBalance = postBalances[i];
          const solDifference = (postBalance - preBalance) / 1e9; // Convert lamports to SOL
          
          if (solDifference !== 0) {
            balanceChanges.push({
              accountIndex: i,
              preBalance: preBalance / 1e9, // Convert to SOL
              postBalance: postBalance / 1e9, // Convert to SOL
              change: solDifference
            });
          }
        }
      
        // Log the results
        if (balanceChanges.length > 0) {
          const firstChange = balanceChanges[0];
          // console.log(`Account Index ${firstChange.accountIndex} native balance change:`);
          // console.log(`Pre Balance: ${firstChange.preBalance} SOL`);
          // console.log(`Post Balance: ${firstChange.postBalance} SOL`);
          // console.log(`Change: ${firstChange.change} SOL`);
          // console.log('-----------------------------------');
          const type = firstChange.change > 0 ? 'sell' : 'buy'
          return {
            type,
            balanceChange: firstChange.change
          }
        } else {
          console.log('No balance changes found');
          return {
            type: '',
            balanceChange: ''
          }
        }
      }
    
      public formatNumber(amount: number) { // TODO: Add try catch, just return the function in case of error
          return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount);
      }
    
      public async getSolPriceGecko(): Promise<number | undefined> {
       try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')

        const data = await response.data

        const solanaPrice = data.solana.usd

         return solanaPrice
       } catch (error) {
        console.log('GET_SOL_PRICE_ERROR')
         return 
       }
      }

      public async getSolPriceNative() {
        const id = new PublicKey('8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj')

        const accountInfo = await connection.getAccountInfo(id)

        if (accountInfo === null) {
          console.log('get pool info error')
          return
        }

        const poolData = PoolInfoLayout.decode(accountInfo.data)

        const solPrice = SqrtPriceMath.sqrtPriceX64ToPrice(poolData.sqrtPriceX64, poolData.mintDecimalsA, poolData.mintDecimalsB).toFixed(2)

        // console.log('current price -> ', solPrice)

        return solPrice
      }

      public async getTokenPrice(dex: SwapType, tokenMint: string): Promise<number | undefined> {
        let globalTokenPrice = 0

        if (dex === 'raydium') {
          const response = await axios.get(`https://api.solana.fm/v0/cache/tokens/${tokenMint}/price-details`)
          if (response.data.status === 'success') {
            const tokenPrice = response?.data?.result?.tokenPriceCachedRes?.price;
            // console.log('TOKENPRICE', tokenPrice)
            globalTokenPrice += tokenPrice
          } else {
            return
          }
        } else if (dex === 'pumpfun') {
          let data = JSON.stringify({
            query: `
              query MyQuery($mintAddress: String!) {
                Solana {
                  DEXTradeByTokens(
                    where: {Trade: {Currency: {MintAddress: {is: $mintAddress}}, Dex: {ProtocolName: {is: "pump"}}}, Block: {Time: {since: "2024-06-27T06:46:00Z"}}}
                    limit: {count: 1}
                  ) {
                    Trade {
                      Currency {
                        Name
                        Symbol
                        MintAddress
                      }
                      PriceInUSD
                      Price
                      PriceAsymmetry
                      Dex {
                        ProtocolName
                        ProtocolFamily
                      }
                    }
                    TradeVolume: sum(of: Trade_Amount)
                  }
                }
              }
            `,
            variables: {
              mintAddress: tokenMint
            }
          });
         
         let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://streaming.bitquery.io/eap',
            headers: { 
               'Content-Type': 'application/json', 
               'X-API-KEY': process.env.BITQUERY_API_KEY, 
               'Authorization': 'Bearer ory_at_EONibepioHzk6eP6ldlUURLqnuOp6tFMFOL-FyIRI7Y.U8iNP1I4ekNMQCfgki1yPpLND99ZtwxPj2wAR6d5uFw'
            },
            data : data
         };
         
         try {
          const response = await axios.request(config);
          const priceInUSD = response.data?.data?.Solana?.DEXTradeByTokens?.[0]?.Trade?.PriceInUSD;
          if (priceInUSD !== undefined) {
            // console.log(response.data?.data?.Solana?.DEXTradeByTokens?.[0])
            globalTokenPrice += priceInUSD;
          } else {
            console.log('PriceInUSD is undefined');
            return
          }
        } catch (error) {
          console.log('Error fetching data:', error);
          return
        }
      }
    
        console.log('GLOBAL TOKEN PRICE', globalTokenPrice);
        return globalTokenPrice;
      }

      public async getTokenMktCap(dex: SwapType, tokenMint: string) {
         const mintPublicKey = new PublicKey(tokenMint);
         const tokenSupply = await connection.getTokenSupply(mintPublicKey);
         const supplyValue = tokenSupply.value.uiAmount;
         console.log('SUPPLY VALUE', supplyValue)

         if (!supplyValue) {
           return
         }

         const tokenPrice = await this.getTokenPrice(dex, tokenMint)

         if (!tokenPrice || tokenPrice === undefined || tokenPrice === null) {
          console.log('NO TOKEN PRICE')
           return
         }

         const tokenMarketCap = supplyValue * tokenPrice

         const formattedMarketCap = this.formatNumber(tokenMarketCap)

         console.log('TOKEN_MARKET_CAP', formattedMarketCap)
         return formattedMarketCap
      }
}