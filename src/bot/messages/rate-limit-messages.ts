export class RateLimitMessages {
    constructor() {}

    public walletWasPaused(walletAddress: string) {
        const messageText = `
Your wallet ${walletAddress} is spamming to many txs per second and it will be paused for 20 minutes
`

       return messageText
    }

    public walletWasResumed(walletAddress: string) {
        const messageText = `
Your wallet ${walletAddress} has been resumed from sleeping after 20 minutes!
        `
        
     return messageText 
    }
}