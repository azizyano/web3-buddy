
import axios from "axios";
import { CoinGeckoData, MarketData, TokenConfig } from "@/types/type";
import { getChainTokens } from "@/config/tokens";

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

// CoinGecko ID mapping config
const COINGECKO_IDS = {
  ethereum: {
    S: "sonic",
    WETH: "weth",
    USDC: "usd-coin"
  },
  sonic: {
    S: "sonic-3",
    WS: "wrapped-sonic",
    WETH: "weth",
    USDC: "usd-coin",
    AG: "silver-2",
    ANON: "heyanon",
    SNS: "sonic-name-service",
    BRUSH: "paint-swap"
  }
} as const;

interface CoinGeckoMarketData {
  current_price: { usd: number };
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  price_change_percentage_30d: number;
  ath: { usd: number };
  ath_change_percentage: { usd: number };
  atl: { usd: number };
  atl_change_percentage: { usd: number };
  total_supply: number;
  market_cap: { usd: number };
  total_volume: { usd: number };
  circulating_supply: number;
}

export async function fetchCoinGeckoData(chainId: number, tokenSymbol: string): Promise<CoinGeckoData | null> {
  try {
    const chainName = chainId === 146 ? "sonic" : "ethereum";
    const coingeckoId = COINGECKO_IDS[chainName][tokenSymbol as keyof typeof COINGECKO_IDS[typeof chainName]];
    
    if (!coingeckoId) {
      throw new Error(`No CoinGecko ID mapped for ${tokenSymbol} on chain ${chainId}`);
    }

    const { data } = await axios.get<{ market_data: CoinGeckoMarketData }>(
      `${COINGECKO_API_URL}/coins/${coingeckoId}`,
      {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false,
        },
        timeout: 5000
      }
    );

    if (!data?.market_data) {
      throw new Error("Invalid CoinGecko response structure");
    }

    const { market_data } = data;
    console.log("CoinGecko Data:", market_data);
    return {
      priceUSD: market_data.current_price.usd.toString(),
      priceChange24hPercentage: market_data.price_change_percentage_24h.toString(),
      priceChange7dPercentage: market_data.price_change_percentage_7d.toString(),
      priceChange30dPercentage: market_data.price_change_percentage_30d.toString(),
      marketCapUSD: market_data.market_cap.usd.toString(),
      volume24hUSD: market_data.total_volume.usd.toString(),
      circulatingSupply: market_data.circulating_supply.toString(),
      athUSD: market_data.ath.usd.toString(),
      athChangePercentage: market_data.ath_change_percentage.usd.toString(),
      atlUSD: market_data.atl.usd.toString(),
      atlChangePercentage: market_data.atl_change_percentage.usd.toString(),
      totalSupply: market_data.total_supply.toString(),
      // Additional metrics for AI analysis
      dominance: (market_data.market_cap.usd / 1e9).toString(), // Market cap in billions
      liquidityScore: (market_data.total_volume.usd / market_data.market_cap.usd).toString(),
      volatility: Math.abs(market_data.price_change_percentage_24h).toString(),
    };
    
  } catch (error) {
    console.error(`CoinGecko Error (${tokenSymbol}):`, error instanceof Error ? error.message : error);
    return null;
  }
}

// Enhanced market data fetcher with fallback
export async function fetchTokenMarketData(
  chainId: number,
  tokenSymbol: string
): Promise<MarketData | null> {
  try {
    const [coingeckoData, tokens]: [CoinGeckoData | null, TokenConfig[]] = await Promise.all([
        fetchCoinGeckoData(chainId, tokenSymbol),
        getChainTokens(chainId)
    ]);
    const tokenConfig = tokens.find((t: TokenConfig) => t.symbol === tokenSymbol);

    if (!tokenConfig) {
      throw new Error("Token not supported on this network");
    }

    // Fallback to chain data if CoinGecko fails
    const baseMarketData: CoinGeckoData = {
      priceUSD: "0",
      marketCapUSD: "0",
      volume24hUSD: "0",
      priceChange24hPercentage: "0",
      priceChange7dPercentage: "0",
      priceChange30dPercentage: "0",
      circulatingSupply: "0",
      athUSD: "0",
      athChangePercentage: "0",
      atlUSD: "0",
      atlChangePercentage: "0",
      totalSupply: "0",
      dominance: "0",
      liquidityScore: "0",
      volatility: "0",
      ...coingeckoData
    };

    return {
      coingecko: baseMarketData,
      chainData: {
        liquidity:  0,
        holders:  0
      }
    };

  } catch (error) {
    console.error("Market Data Error:", error);
    return null;
  }
}

export async function fetchTokenPrice(
  chainId: number,
  tokenSymbol: string
): Promise<number | null> { // Changed return type to return price directly
  try {
    const coingeckoData = await fetchCoinGeckoData(chainId, tokenSymbol);
    return coingeckoData ? parseFloat(coingeckoData.priceUSD) : null;
  } catch (error) {
    console.error("Price fetch error:", error);
    return null;
  }
}