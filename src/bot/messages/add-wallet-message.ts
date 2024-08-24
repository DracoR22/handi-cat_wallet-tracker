export class AddWalletMessage {
    constructor() {}

    public sendAddWalletMessage() {
        const messageText = `
🐱 Ok, just send me a wallet address to track:

You can also give that wallet a name by following the address with the desired name, or add multiple wallets at once by sending them each on a new line for example: 

walletAddress1 walletName1
walletAddress2 walletName2
`
        
        return messageText
    }
}