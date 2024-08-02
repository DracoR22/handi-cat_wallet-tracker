export class FormatNumbers {
    constructor() {}

    public formatNumber(amount: number) { // TODO: Add try catch, just return the function in case of error
      let scaledAmount = amount / 1e9;
      return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(scaledAmount);
    }

    public formatMarketCap(value: number): string {
        if (value >= 1_000_000) {
          return `${(value / 1_000_000).toFixed(2)}M`;
        } else if (value >= 1_000) {
          return `${(value / 1_000).toFixed(2)}K`;
        } else {
          return value.toFixed(2);
        }
      }

    public formatAmount(amount: number): string {
      const formattedAmount = (amount / 1e6).toFixed(2);

      return formattedAmount
    }
}