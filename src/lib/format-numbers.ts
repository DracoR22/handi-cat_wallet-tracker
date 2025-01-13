export class FormatNumbers {
  constructor() {}

  public formatTokenAmount(amount: number) {
    // console.log('AMOUNT', amount)
    let scaledAmount: number

    if (amount >= 1e9) {
      scaledAmount = amount / 1e6
    } else if (amount >= 1e8) {
      scaledAmount = amount / 1e5
    } else if (amount >= 1e6) {
      scaledAmount = amount / 1e3
    } else {
      scaledAmount = amount
    }
    // Format the scaled amount with maximum two fraction digits
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(scaledAmount)
  }

  static formatPrice(value: number): string {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)}B`
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(2)}K`
    } else {
      return value.toFixed(2)
    }
  }

  static formatTokenPrice(price: number): string {
    return price.toFixed(8).replace(/^(0\.)(0+)(\d+)/, (_, p1, p2, p3) => {
      return `0.{${p2.length}}${p3}`
    })
  }
}
