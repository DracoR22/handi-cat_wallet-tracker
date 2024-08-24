export class FormatNumbers {
  constructor() {}

  public formatTokenAmount(amount: number) {
    console.log('AMOUNT', amount)
    let scaledAmount: number

    if (amount.toString().length > 10) {
      scaledAmount = amount / 1e9
    } else if (amount.toString().length === 10) {
      scaledAmount = amount / 1e8
    } else if (amount.toString().length <= 9) {
      scaledAmount = amount / 1e6
    } else {
      scaledAmount = amount
    }

    // Format the scaled amount with maximum two fraction digits
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(scaledAmount)
  }

  public formatMarketCap(value: number): string {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(2)}K`
    } else {
      return value.toFixed(2)
    }
  }
}
