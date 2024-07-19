export class BotMessages {
    constructor() {}

    public sendTxMessageWithUsd(message: NativeParserInterface, solPrice: number): string {
        const owner = message.owner;
        const amountOut = message.tokenTransfers.tokenAmountOut;
        const tokenOut = message.tokenTransfers.tokenOutSymbol;
        const amountIn = message.tokenTransfers.tokenAmountIn;
        const tokenIn = message.tokenTransfers.tokenInSymbol;

        const truncatedOwner = `${owner.slice(0, 4)}...${owner.slice(-4)}`

        const solscanAddressUrl = `https://solscan.io/account/${owner}`
        const solscanTokenOutUrl = `https://solscan.io/token/${message.tokenTransfers.tokenOutMint}`
        const solscanTokenInUrl = `https://solscan.io/token/${message.tokenTransfers.tokenInMint}`
        const tokenInMint = message.tokenTransfers.tokenInMint
        const tokenOutMint = message.tokenTransfers.tokenOutMint

        const amountInUsd = message.type === 'buy' ? Number(amountOut) * solPrice : Number(amountIn) * solPrice
        const fixedUsdAmount = amountInUsd < 0.01 ? amountInUsd.toFixed(6) : amountInUsd.toFixed(2)

        const messageText = `
${message.type === 'buy' ? '🟢' : '🔴'} ${message.type?.toUpperCase()} ${message.type === 'buy' ? `<a href="${solscanTokenInUrl}">${tokenIn}</a>` : `<a href="${solscanTokenOutUrl}">${tokenOut}</a>`} on ${message.platform.toUpperCase()}\n
<b>💎 ${truncatedOwner}</b>\n
✅ <a href="${solscanAddressUrl}">${truncatedOwner}</a> swapped <b>${amountOut}</b>${message.type === 'sell' ? ` ($${fixedUsdAmount})` : ''} <a href="${solscanTokenOutUrl}">${tokenOut}</a> for <b>${amountIn}</b>${message.type === 'buy' ? ` ($${fixedUsdAmount})` : ''} <a href="${solscanTokenInUrl}">${tokenIn}</a>\n   
<code style="color: #39fa56">${message.type === 'buy' ? tokenInMint : tokenOutMint}</code>   
`
        return messageText
    }
}