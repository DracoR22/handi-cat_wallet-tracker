import { PumpDetail } from "../types/gmgn-ai-types"


export class TokenPrices {
    constructor() {}

    public async gmgnTokenInfo(addr: string): Promise<PumpDetail | undefined> {
       try {
        const res = await fetch(`https://gmgn.ai/defi/quotation/v1/tokens/sol/${addr}`)
        const data = await res.json()

        if(data.code === 0){
          return data.data.token
        }

        return
       } catch (error) {
        console.log('GMGN_API_ERROR', error)
        return
       }
    }
}