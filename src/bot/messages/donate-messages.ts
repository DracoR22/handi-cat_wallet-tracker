export class DonateMessages {
  constructor() {}

  public donateMessage(userWallet?: string | undefined): string {
    const messageText = `
⭐ <b>Support the future of Handi Cat</b>

With your support, we can continue improving, expanding our features, and ensuring the best experience possible for all users.

Every donation helps keep the bot running and contributes to new features 🐱✨

No donation is too small, and every bit of support is appreciated!

You can make a donation just by transfering sufficient <b>SOL</b> to your Handi Cat wallet and selecting one of the options below

Your wallet: <code>${userWallet ? userWallet : ''}</code>
`

    return messageText
  }

  public sendDonationMadeMessage(): string {
    const messageText = `
😸 <b>Success!</b> Thank you for your generous donation! 🎉

Your support helps keep Handi Cat growing and improving, allowing us to bring you exciting new features and better services.

Every donation makes a difference, and we are incredibly grateful for your contribution. 💖

🚀 Stay tuned for more updates and features, and thank you for being a part of our journey! 🐾
`

    return messageText
  }
}
