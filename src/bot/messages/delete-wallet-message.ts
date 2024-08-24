export class DeleteWalletMessage {
    constructor() {}

    public sendDeleteWalletMessage() {
        const messageText = `
Send me the wallet address you want to remove 🗑️

You can also delete multiple wallets at once if you send them each on a new line, for example:

walletAddress1
walletAddress2
        `

        return messageText
    }
}