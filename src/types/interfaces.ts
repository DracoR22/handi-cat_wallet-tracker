interface NativeParserInterface {
    platform: 'raydium' | 'pumpfun'
    owner: string
    description: string
    type: string | undefined
    balanceChange: string | number | undefined
    signature: string
    tokenTransfers: {
      tokenInSymbol: string
      tokenOutSymbol: string
      tokenInMint: string
      tokenOutMint: string
      tokenAmountIn: string
      tokenAmountOut: string
    }
}

interface CreateUserInterface {
  id: string
  username: string
  firstName: string
  lastName: string
}
