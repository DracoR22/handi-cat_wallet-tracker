export class BuyCodeMessage {
  constructor() {}

  public sendBuyCodeMessage(): string {
    const messageText = `
⭐ Get your own <b>Handi Cat</b> all for yourself!

What benefits you get from <b>buying the source code</b>?

1. Full control over any of the bot features
2. Track <b>unlimited</b> wallets
3. A detailed guide of how to set up the bot

✨ How you can buy the code?

1. Transfer enough <b>SOL</b> to your <b>Handi Cat</b> wallet
2. Click below to buy

After the purchase is succesful you will get the <b>access link</b> to download the code, you can also revisit this menu to see the link any time you want
`

    return messageText
  }
}
