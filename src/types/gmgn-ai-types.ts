export interface PumpCoin {
  address: string
  associated_bonding_curve: string
  base_reserve: number
  bonding_curve: string
  complete: number
  created_timestamp: number
  creator: string
  creator_balance: number
  creator_close: boolean
  creator_token_balance: string
  description: string
  holder_count: number
  id: number
  image_uri: string
  king_of_the_hill_timestamp: number
  koth_duration: number
  last_reply: number
  last_trade_timestamp: number
  logo: string
  market_cap: number
  market_cap_1m: string
  market_cap_5m: string
  market_id: number
  message_id: number
  message_sent: number
  metadata_uri: string
  name: string
  open_timestamp: number
  price: number
  price_change_percent1m: number
  price_change_percent5m: number
  progress: number
  quote_reserve: number
  raydium_pool: string
  reply_count: number
  status: number
  swaps_1h: number
  swaps_1m: number
  swaps_5m: number
  swaps_6h: number
  swaps_24h: number
  symbol: string
  telegram: string
  time_since_koth: number
  total_supply: string
  twitter: string
  updated_at: number
  usd_market_cap: string
  virtual_sol_reserves: string
  virtual_token_reserves: string
  volume_1h: number
  volume_1m: number
  volume_5m: number
  volume_6h: number
  volume_24h: number
  website: string
}

export interface PumpDetail {
  address: string
  symbol: string
  name: string
  decimals: number
  price: number
  logo: string
  price_1m: number
  price_5m: number
  price_1h: number
  price_6h: number
  price_24h: number
  volume_24h: number
  swaps_5m: number
  swaps_1h: number
  swaps_6h: number
  swaps_24h: number
  liquidity: number
  max_supply: number
  total_supply: number
  holder_count: number
  biggest_pool_address: string
  chain: string
  creation_timestamp: number
  open_timestamp: number | null
  circulating_supply: number | null
  high_price: number | null
  high_price_timestamp: number | null
  low_price: number | null
  low_price_timestamp: number | null
  buys_5m: number
  sells_5m: number
  volume_5m: number
  buy_volume_5m: number
  sell_volume_5m: number
  net_in_volume_5m: number
  buys_1h: number
  sells_1h: number
  volume_1h: number
  buy_volume_1h: number
  sell_volume_1h: number
  net_in_volume_1h: number
  buys_6h: number
  sells_6h: number
  volume_6h: number
  buy_volume_6h: number
  sell_volume_6h: number
  net_in_volume_6h: number
  buys_24h: number
  sells_24h: number
  buy_volume_24h: number
  sell_volume_24h: number
  net_in_volume_24h: number
  swap_rank: number | null
  fdv: number
  market_cap: number
  circulating_market_cap: number | null
  link: {
    geckoterminal: string
    gmgn: string
  }
  social_links: Record<string, string>
  hot_level: number
  is_show_alert: boolean
  buy_tax: number | null
  sell_tax: number | null
  is_honeypot: boolean | null
  renounced: boolean | null
  top_10_holder_rate: number
  renounced_mint: number
  renounced_freeze_account: number
  burn_ratio: string
  burn_status: string
  pool_info: {
    address: string
    quote_address: string
    quote_symbol: string
    liquidity: number
    base_reserve: string
    quote_reserve: string
    initial_liquidity: number
    initial_base_reserve: string
    initial_quote_reserve: string
    creation_timestamp: number
    base_reserve_value: number
    quote_reserve_value: number
  }
  launchpad: string
  launchpad_status: number
  launchpad_progress: number
  rug_ratio: number
  holder_rugged_num: number
  holder_token_num: number
  rugged_tokens: {
    address: string
    name: string
    symbol: string
    logo: string
  }[]
  creator_address: string
  creator_balance: number
  creator_token_balance: string
  creator_close: boolean
  creator_percentage: string
  creator_token_status: string
  dev_token_burn_amount: number | null
  dev_token_burn_ratio: number | null
  twitter_name_change_history: string[]
  dexscr_ad: number
  dexscr_update_link: number
  cto_flag: number
}
