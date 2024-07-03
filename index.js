const { Connection, PublicKey, TransactionInstruction, SystemProgram } = require('@solana/web3.js');
const { Metadata, deprecated } = require("@metaplex-foundation/mpl-token-metadata");

// Connect to Solana RPC endpoint
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

class Tracker {
    constructor(walletAddress) {
        this.walletAddress = walletAddress;
    }

    async getDecimals(mint) {
        const tokenMetaPubkey = await deprecated.Metadata.getPDA(mint);
        const metadata = await Metadata.fromAccountAddress(connection, tokenMetaPubkey);
        return metadata.data.decimals;
    }

    toReadableBalance(balance, decimals) {
        return balance / Math.pow(10, decimals);
    }

    async track() {
        try {
            const publicKey = new PublicKey(this.walletAddress);
            const transactions = await connection.getConfirmedSignaturesForAddress2(publicKey, {
                limit: 10, // Number of transactions to fetch
            });

            // CHANGE TO TEST
            // const transactionSignature = transactions[10].signature;
            // console.log('Transaction signature', transactionSignature)

            // GET FULL TRANSACTION
            const transactionDetails = await connection.getTransaction('3xvisicTYU1GSZHK2nsASwBzLmQpK8m5KTGH4bLY3jPyJd2avL3zny4aYF6MBfDjyCCqSw4k75gvYexVVaMDJ8Dt', {
                maxSupportedTransactionVersion: 0,
            });

           
             console.log('PRE_TOKEN_BALANCE', transactionDetails.meta.preTokenBalances)
             console.log('POST_TOKEN_BALANCE', transactionDetails.meta.postTokenBalances)

             const preTokenBalance = transactionDetails.meta.preTokenBalances[0]
             const postTokenBalance = transactionDetails.meta.postTokenBalances[0]

             

             if (postTokenBalance.uiTokenAmount.uiAmount > preTokenBalance.uiTokenAmount.uiAmount) {
                console.log('BUY')
             } else {
                console.log('SELL')
             }

            // const preTokenBalances = transactionDetails.meta?.preTokenBalances;
            // console.log('Pre token balances', preTokenBalances)
            // const postTokenBalances = transactionDetails.meta?.postTokenBalances;

            // if (!preTokenBalances || !postTokenBalances) {
            //     return [];
            // }
    
            // const tokenMap = new Map();

            // for (const token of preTokenBalances) {
            //     const mint = token.mint;
            //     const preBalance = token.uiTokenAmount.uiAmount;
            //     const postBalance = 0;  // Initialize postBalance to 0, will be updated later
    
            //     const mintPublicKey = new PublicKey(mint);
            //     const decimals = await this.getDecimals(mintPublicKey);
            //     const readablePreBalance = this.toReadableBalance(preBalance, decimals);
    
            //     const tokenMetaPubkey = await deprecated.Metadata.getPDA(mintPublicKey);
            //     const metadataContent = await Metadata.fromAccountAddress(connection, tokenMetaPubkey);
    
            //     tokenMap.set(mint, {
            //         mint,
            //         transactionType: 'sell',  // Default to 'sell', will be updated later
            //         preBalance,
            //         postBalance,
            //         metadata: metadataContent,
            //     });
            // }
    
            // for (const token of postTokenBalances) {
            //     const mint = token.mint;
            //     const postBalance = token.uiTokenAmount.uiAmount;
    
            //     if (tokenMap.has(mint)) {
            //         const tokenInfo = tokenMap.get(mint);
            //         if (tokenInfo) {
            //             tokenInfo.postBalance = postBalance;
            //             tokenInfo.transactionType = postBalance < tokenInfo.preBalance ? 'buy' : 'sell';
            //         }
            //     } else {
            //         const mintPublicKey = new PublicKey(mint);
            //         const decimals = await this.getDecimals(mintPublicKey);
            //         const readablePostBalance = this.toReadableBalance(postBalance, decimals);
    
            //         const tokenMetaPubkey = await deprecated.Metadata.getPDA(mintPublicKey);
            //         const metadataContent = await Metadata.fromAccountAddress(connection, tokenMetaPubkey);
    
            //         tokenMap.set(mint, {
            //             mint,
            //             transactionType: 'buy',
            //             preBalance: 0,
            //             postBalance,
            //             metadata: metadataContent,
                        
            //         });
            //     }
            // }
    
            // console.log(Array.from(tokenMap.values()))
            // GET TOKENS SWAPPED
             const token1 = transactionDetails.meta.postTokenBalances[1]
            //  const token2 = transactionDetails.meta.postBalances[1]
            //   console.log(transactionDetails.meta.innerInstructions[0].instructions)
            //  // GET MINT KEY OF FIRST TOKEN. TODO: DO FOR BOTH
            //  const mintPublicKey = new PublicKey(token1.mint);
            //  const tokenmetaPubkey = await deprecated.Metadata.getPDA(mintPublicKey);
            //  const metdadataContent =  await Metadata.fromAccountAddress(connection, tokenmetaPubkey);
            //  console.log("Metadata:", metdadataContent.pretty());
            // //  const mintAccountInfo = await connection.getParsedAccountInfo(mintPublicKey);
            //  console.log('Swaped', mintAccountInfo.value.data)

              // Find all program IDs of transaction
              const programIds = transactionDetails.transaction.message.staticAccountKeys;

              // Check if the Pump Fun program ID exists in programIds
              const pumpFunProgramId = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
              const pumpFunTransaction = programIds.some(id => id.equals(pumpFunProgramId));
  
              if (pumpFunTransaction) {
                  console.log('Transaction is related to Pump Fun program.');
                  return { transactionDetails, programIds }; // Return the transaction details or handle as needed
              } else {
                  console.log('Transaction is not related to Pump Fun program.');
                  return null; // Or handle accordingly if not related
              }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            return [];
        }
    }
}

const walletAddress = 'J2UzsEri1r8MycFwiMS2zX1u9TZqAHSWjJAeYGQuhBAa';
const tracker = new Tracker(walletAddress);

const fetchTransactions = async () => {
    const transactions = await tracker.track();
    // console.log(transactions);
};

fetchTransactions();