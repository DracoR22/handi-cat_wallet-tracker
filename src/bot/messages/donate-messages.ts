export class DonateMessages {
  constructor() {}

  public donateMessage(userWallet?: string | undefined): string {
    const messageText = `
⭐ <b>Support the future of Handi Cat</b>

Every donation helps keep the bot running and contributes to new features 🐱✨

No donation is too small, and every bit of support is appreciated!

To donate:
1️⃣ Send any amount of <b>SOL</b> to your <b>Handi Cat wallet</b>.
2️⃣ Select one of the <b>options</b> below or simply <b>type</b> the amount you'd like to donate (e.g., for 0.01 SOL, just type "0.01").

<b>Your Handi Cat wallet:</b> <code>${userWallet ? userWallet : ''}</code>
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
