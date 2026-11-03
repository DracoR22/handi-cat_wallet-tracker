// Optional token safety line under buy and sell alerts, from the free TokenGuard partner API.
// Enabled only when TOKENGUARD_PARTNER_ID is set (create one in 10 seconds at https://tokenguard-bot.vercel.app/partners/).
// Never blocks an alert: on timeout or error the line is simply left out.
const PARTNER_ID = process.env.TOKENGUARD_PARTNER_ID || ''

export class TokenSafety {
  static async getLine(mint: string): Promise<string> {
    if (!PARTNER_ID || !mint) return ''
    try {
      const res = await fetch(`https://tokenguard-bot.vercel.app/api/p/${PARTNER_ID}/${mint}`, {
        signal: AbortSignal.timeout(2500),
      })
      if (!res.ok) return ''
      const data = (await res.json()) as { display?: { html?: string } }
      return data.display?.html ?? ''
    } catch {
      return ''
    }
  }
}
