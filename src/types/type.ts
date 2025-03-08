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
    chainData: {
      liquidity: number;
      holders: number;
    };
}


export interface KyberQuote {
  routeSummary: any[];
  routerAddress: string;
  encodedSwapData: string;
  inputAmount: string;
  outputAmount: string;
  gasPriceGwei: string;
  totalGas: string;
  tokens: Record<string, TokenData>;
}

export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  price: number;
  decimals: number;
}

export interface KyberConfig {
    chainId: number;
    walletAddress: string;
    fromToken: string;
    toToken: string;
    amount: string;
  }

  export type AlertType = "market" | "wallet" | "gas" | "security";

export interface AlertMessage {
  type: AlertType;
  content: string;
  timestamp: number;
  metadata?: {
    token?: string;
    changePercentage?: number;
    gasPrice?: string;
  };
}

export type AIMode = "analyst" | "trader" | "educator";

export interface AIContextType {
  mode: AIMode;
  setMode: (mode: AIMode) => void;
  isActive: boolean;
  alerts: AlertMessage[];
  addAlert: (alert: Omit<AlertMessage, "timestamp">) => void;
  dismissAlert: (timestamp: number) => void;
  modeConfig: ModeConfig;
}

export interface ModeConfig {
  responseStyle: string;
  defaultPrompt: string;
  color: string;
}

// types/portfolio.d.ts
export interface PortfolioAsset {
  symbol: string;
  balance: number;
  valueUSD: number;
  allocation: number;
  volatility: number;
  chain: string;
}

export interface PortfolioMetrics {
  totalValue: number;
  riskScore: number;
  diversityIndex: number;
  topPerformer: string;
  worstPerformer: string;
}

export interface SwapPreview {
  fromAmount: number;
  toAmount: number;
  priceImpact: number;
  slippage: number;
  fees: number;
  route: string[];
  riskLevel: "low" | "medium" | "high";
}