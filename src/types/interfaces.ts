export interface NativeParserInterface {
    platform: 'raydium' | 'pumpfun' | null
    owner: string
    description: string
    type: string | undefined
    balanceChange: string | number | undefined
    signature: string
    swappedTokenMc: number | null | undefined
    tokenTransfers: {
      tokenInSymbol: string
      tokenOutSymbol: string
      tokenInMint: string
      tokenOutMint: string
      tokenAmountIn: string
      tokenAmountOut: string
    }
}

export interface CreateUserInterface {
  id: string
  username: string
  firstName: string
  lastName: string
}

export interface ParsedTxInfo {
  info: {
    amount: string
    authority: string
    destination: string
    source: string
  }
  type: string
}