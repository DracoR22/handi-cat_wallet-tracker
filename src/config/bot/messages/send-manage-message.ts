export class ManageMessages {
    constructor() {}

    public sendManageMessage() {
        const messageText = `
<b>Your wallets: </b>

✅ - Wallet is active
⏸️ - You paused this wallet
⏳ - Wallet was sending too many txs and is paused
🛑 - Renew PRO to continue tracking this wallet
`

        return messageText
    }
}