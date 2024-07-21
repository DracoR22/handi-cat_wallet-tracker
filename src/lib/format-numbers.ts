export class FormatNumbers {
    constructor() {}

    public formatMarketCap(value: number): string {
        if (value >= 1_000_000) {
          return `${(value / 1_000_000).toFixed(2)}M`;
        } else if (value >= 1_000) {
          return `${(value / 1_000).toFixed(2)}K`;
        } else {
          return value.toFixed(2);
        }
      }
}