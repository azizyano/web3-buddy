/* eslint-disable @typescript-eslint/no-explicit-any */
export interface KyberSwapData {
    inputAmount: string;
    outputAmount: string;
    gasCostUSD: string;
    receivedUSD: string;
    swapRoute: any[];
    tokens: Record<string, any>;
}

export interface CoinGeckoData {
    priceUSD: string;
    marketCapUSD: string;
    volume24hUSD: string;
    athUSD: string;
    athChangePercentage: string;
    atlUSD: string;
    atlChangePercentage: string;
    priceChange24hPercentage: string;
    priceChange7dPercentage: string;
    priceChange30dPercentage: string;
    circulatingSupply: string;
    totalSupply: string;
    dominance: string;
    liquidityScore: string;
    volatility: string;

}

export interface TokenConfig {
    chainId: number;
    address: string;
    decimals: number;
    symbol: string;
    name: string;
    kyberPool?: string; // For future liquidity checks
    isNative?: boolean;
  }

export interface MarketData {
    //kyber: KyberSwapData | null;
    coingecko: CoinGeckoData | null;
    aiAnalysis?: any;
}


export interface KyberQuote {
  routeSummary: any[];
  routerAddress: string;
  encodedSwapData: string;
  inputAmount: string;
  outputAmount: string;
  gasEstimate: string;
}

export interface KyberConfig {
    chainId: number;
    walletAddress: string;
    fromToken: string;
    toToken: string;
    amount: string;
  }