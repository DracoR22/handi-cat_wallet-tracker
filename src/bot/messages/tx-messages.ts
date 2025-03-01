import { FormatNumbers } from '../../lib/format-numbers'
import { NativeParserInterface } from '../../types/general-interfaces'

export class TxMessages {
  constructor() {}

  static txMadeMessage(
    message: NativeParserInterface,
    tokenMarketCap?: string | undefined,
    walletName?: string,
  ): string {
    const owner = message.owner
    const amountOut = message.tokenTransfers.tokenAmountOut
    const tokenOut = message.tokenTransfers.tokenOutSymbol
    const amountIn = message.tokenTransfers.tokenAmountIn
    const tokenIn = message.tokenTransfers.tokenInSymbol

    const truncatedOwner = `${owner.slice(0, 4)}...${owner.slice(-4)}`

    const solscanAddressUrl = `https://solscan.io/account/${owner}`
    const solscanTokenOutUrl = `https://solscan.io/token/${message.tokenTransfers.tokenOutMint}`
    const solscanTokenInUrl = `https://solscan.io/token/${message.tokenTransfers.tokenInMint}`
    const solscanTxUrl = `https://solscan.io/tx/${message.signature}`
    const tokenInMint = message.tokenTransfers.tokenInMint
    const tokenOutMint = message.tokenTransfers.tokenOutMint

    const solPrice = Number(message.solPrice)

    const amountInUsd = message.type === 'buy' ? Number(amountOut) * solPrice : Number(amountIn) * solPrice
    // const fixedUsdAmount = amountInUsd < 0.01 ? amountInUsd.toFixed(6) : amountInUsd.toFixed(2)
    const fixedUsdAmount = FormatNumbers.formatPrice(amountInUsd)
    // const displayPercentage =
    //   isFinite(Number(message.currenHoldingPercentage)) && Number(message.currenHoldingPercentage) > 0
    //     ? `${message.currenHoldingPercentage}%`
    //     : '0'

    const tokenMintToTrack = message.type === 'buy' ? tokenInMint : tokenOutMint

    const gmgnLink = `<a href="https://gmgn.ai/sol/token/kxPdcLKf_${tokenMintToTrack}">GMGN</a>`
    const beLink = `<a href="https://birdeye.so/token/${tokenMintToTrack}?chain=solana">BE</a>`
    const dsLink = `<a href="https://dexscreener.com/solana/${tokenMintToTrack}">DS</a>`
    const phLink = `<a href="https://photon-sol.tinyastro.io/en/lp/${tokenMintToTrack}">PH</a>`
    const bullxLink = `<a href="https://neo.bullx.io/terminal?chainId=1399811149&address=${tokenMintToTrack}">BLX</a>`
    const axiomLink = `<a href='https://axiom.trade/t/${tokenMintToTrack}/@handi'>AXI</a>`

    const marketCapText = tokenMarketCap
      ? `🔗 ${message.type === 'buy' ? `<b><a href="${solscanTokenInUrl}">#${tokenIn}</a></b>` : `<b><a href="${solscanTokenOutUrl}">#${tokenOut}</a></b>`} | <b>MC: $${tokenMarketCap}</b> | ${gmgnLink} • ${beLink} • ${dsLink} • ${phLink} • ${bullxLink} • ${axiomLink}`
      : ''

    const messageText = `
${message.type === 'buy' ? '🟢' : '🔴'} <b><a href="${solscanTxUrl}">${message.type?.toUpperCase()} ${message.type === 'buy' ? `${tokenIn}` : `${tokenOut}`}</a></b> on ${message.platform!.toUpperCase()}
<b>💎 ${walletName !== '' ? walletName : truncatedOwner}</b>\n
💎 <b><a href="${solscanAddressUrl}">${walletName !== '' ? walletName : truncatedOwner}</a></b> swapped <b>${amountOut}</b>${message.type === 'sell' ? ` ($${fixedUsdAmount})` : ''} <b><a href="${solscanTokenOutUrl}">${tokenOut}</a></b> for <b>${amountIn}</b>${message.type === 'buy' ? ` ($${fixedUsdAmount})` : ''} <b><a href="${solscanTokenInUrl}">${tokenIn}</a></b> @$${message.swappedTokenPrice?.toFixed(7)}

${Number(message.currenHoldingPercentage) > 0 ? '📈' : '📉'} <b>HOLDS: ${message.currentHoldingPrice} (${message.currenHoldingPercentage}%)</b>
${marketCapText}
<code>${tokenMintToTrack}</code>
`
    return messageText
  }

  static tokenMintedMessage(message: NativeParserInterface, walletName?: string): string {
    const owner = message.owner
    const amountOut = message.tokenTransfers.tokenAmountOut
    const tokenOut = message.tokenTransfers.tokenOutSymbol
    const amountIn = message.tokenTransfers.tokenAmountIn
    const tokenIn = message.tokenTransfers.tokenInSymbol

    const truncatedOwner = `${owner.slice(0, 4)}...${owner.slice(-4)}`

    const solscanAddressUrl = `https://solscan.io/account/${owner}`
    const solscanTokenOutUrl = `https://solscan.io/token/${message.tokenTransfers.tokenOutMint}`
    const solscanTokenInUrl = `https://solscan.io/token/${message.tokenTransfers.tokenInMint}`
    const solscanTxUrl = `https://solscan.io/tx/${message.signature}`
    const tokenInMint = message.tokenTransfers.tokenInMint

    const solPrice = Number(message.solPrice)

    const amountInUsd = message.type === 'buy' ? Number(amountOut) * solPrice : Number(amountIn) * solPrice
    const fixedUsdAmount = amountInUsd < 0.01 ? amountInUsd.toFixed(6) : amountInUsd.toFixed(2)

    const tokenMintToTrack = tokenInMint

    const gmgnLink = `<a href="https://gmgn.ai/sol/token/${tokenMintToTrack}">GMGN</a>`
    const beLink = `<a href="https://birdeye.so/token/${tokenMintToTrack}?chain=solana">BE</a>`
    const dsLink = `<a href="https://dexscreener.com/solana/${tokenMintToTrack}">DS</a>`
    const phLink = `<a href="https://photon-sol.tinyastro.io/en/lp/${tokenMintToTrack}">PH</a>`

    const messageText = `
⭐🔁 <a href="${solscanTxUrl}">SWAP</a> on PUMPFUN
<b>💎 ${walletName !== '' ? walletName : truncatedOwner}</b>\n
💎 <a href="${solscanAddressUrl}">${walletName !== '' ? walletName : truncatedOwner}</a> minted and swapped <b>${amountOut}</b><a href="${solscanTokenOutUrl}">${tokenOut}</a> for <b>${amountIn}</b>($${fixedUsdAmount}) <a href="${solscanTokenInUrl}">${tokenIn}</a> 

<b>💣 ${tokenIn}</b>| ${gmgnLink} • ${beLink} • ${dsLink} • ${phLink}

<code>${tokenMintToTrack}</code>   
`
    return messageText
  }
}
