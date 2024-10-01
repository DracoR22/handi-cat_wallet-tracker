export class UserSettingsMessages {
  constructor() {}

  public sendSettingsMessage(): string {
    const messageText = `
<b>Settings</b>

You can pause or resume Handi Cat at anytime just by clicking the button below.

If you pause Handi Cat, you will no longer get more messages until you resume the bot from this same menu
`

    return messageText
  }
}
