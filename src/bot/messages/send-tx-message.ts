export class TxMessages {
    constructor() {}

    public sendTxMessage(message: NativeParserInterface, solPrice: number, tokenMarketCap?: string | undefined): string {
        const owner = message.owner;
        const amountOut = message.tokenTransfers.tokenAmountOut;
        const tokenOut = message.tokenTransfers.tokenOutSymbol;
        const amountIn = message.tokenTransfers.tokenAmountIn;
        const tokenIn = message.tokenTransfers.tokenInSymbol;

        const truncatedOwner = `${owner.slice(0, 4)}...${owner.slice(-4)}`

        const solscanAddressUrl = `https://solscan.io/account/${owner}`
        const solscanTokenOutUrl = `https://solscan.io/token/${message.tokenTransfers.tokenOutMint}`
        const solscanTokenInUrl = `https://solscan.io/token/${message.tokenTransfers.tokenInMint}`
        const solscanTxUrl = `https://solscan.io/tx/${message.signature}`
        const tokenInMint = message.tokenTransfers.tokenInMint
        const tokenOutMint = message.tokenTransfers.tokenOutMint

        const amountInUsd = message.type === 'buy' ? Number(amountOut) * solPrice : Number(amountIn) * solPrice
        const fixedUsdAmount = amountInUsd < 0.01 ? amountInUsd.toFixed(6) : amountInUsd.toFixed(2)

        const tokenMintToTrack = message.type === 'buy' ? tokenInMint : tokenOutMint

        const gmgnLink = `<a href="https://gmgn.ai/sol/token/${tokenMintToTrack}">GMGN</a>`
        const beLink = `<a href="https://birdeye.so/token/${tokenMintToTrack}?chain=solana">BE</a>`
        const dsLink = `<a href="https://dexscreener.com/solana/${tokenMintToTrack}">DS</a>`
        const phLink = `<a href="https://photon-sol.tinyastro.io/en/lp/${tokenMintToTrack}">PH</a>`

        const marketCapText = tokenMarketCap ? 
`<b>💣 ${message.type === 'buy' ? tokenIn : tokenOut}</b> | <b>MC: $${tokenMarketCap}</b> | ${gmgnLink} | ${beLink} | ${dsLink} | ${phLink}` : 
"";

        const messageText = `
${message.type === 'buy' ? '🟢' : '🔴'} <a href="${solscanTxUrl}">${message.type?.toUpperCase()} ${message.type === 'buy' ? `${tokenIn}` : `${tokenOut}`}</a> on ${message.platform!.toUpperCase()}\n
<b>💎 ${truncatedOwner}</b>\n
✅ <a href="${solscanAddressUrl}">${truncatedOwner}</a> swapped <b>${amountOut}</b>${message.type === 'sell' ? ` ($${fixedUsdAmount})` : ''} <a href="${solscanTokenOutUrl}">${tokenOut}</a> for <b>${amountIn}</b>${message.type === 'buy' ? ` ($${fixedUsdAmount})` : ''} <a href="${solscanTokenInUrl}">${tokenIn}</a> 

${marketCapText}
<code>${tokenMintToTrack}</code>   
`
        return messageText
    }
}