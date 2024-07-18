import TelegramBot from "node-telegram-bot-api";

export class SendTransactionMsgHandler {
    constructor(
        private bot: TelegramBot,
    ) {
        this.bot = bot
    }

    public send(message: NativeParserInterface, chatId: string) {
    
// Updated regex to match formatted numbers (with commas)
const regex = /(.+?) swapped ([\d,]+(\.\d+)?) (\w+) for ([\d,]+(\.\d+)?) (\w+)/;
      
        const match = message.description.match(regex);

        if (match) {
            const owner = match[1];
            const amountOut = match[2];
            const tokenOut = match[4];
            const amountIn = match[5];
            const tokenIn = match[7];

            const truncatedOwner = `${owner.slice(0, 4)}...${owner.slice(-4)}`

            const solscanAddressUrl = `https://solscan.io/account/${owner}`
            const solscanTokenOutUrl = `https://solscan.io/token/${message.tokenTransfers.tokenOutMint}`
            const solscanTokenInUrl = `https://solscan.io/token/${message.tokenTransfers.tokenInMint}`
            const tokenInMint = message.tokenTransfers.tokenInMint
            const tokenOutMint = message.tokenTransfers.tokenOutMint

            // Construct a detailed message
            const messageText = `${message.type === 'buy' ? '🟢' : '🔴'} ${message.type?.toUpperCase()} ${message.type === 'buy' ? `<a href="${solscanTokenInUrl}">${tokenIn}</a>` : `<a href="${solscanTokenOutUrl}">${tokenOut}</a>`} on ${message.platform.toUpperCase()}\n
<b>💎 ${truncatedOwner}</b>\n
✅ <a href="${solscanAddressUrl}">${truncatedOwner}</a> swapped ${amountOut} <a href="${solscanTokenOutUrl}">${tokenOut}</a> for ${amountIn} <a href="${solscanTokenInUrl}">${tokenIn}</a>\n

<code style="color: #39fa56">${message.type === 'buy' ? tokenInMint : tokenOutMint}</code>
`

            this.bot.sendMessage(chatId, messageText, { parse_mode: 'HTML', disable_web_page_preview: true });
        } else {
            console.log('REGEX FAILED')
            return
        }
    }
}