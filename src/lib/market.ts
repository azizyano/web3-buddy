// lib/market.ts
import { fetchAiMarketData } from "./deepseek";
import { fetchTokenMarketData } from "./fetch_market_data";
import { MarketData } from "@/types/type";

export async function getCompleteMarketAnalysis(
  chainId: number,
  tokenSymbol: string
) {
  const marketData = await fetchTokenMarketData(chainId, tokenSymbol);
  
  if (!marketData) {
    return {
      advice: "Market data unavailable",
      action: "HOLD",
      confidence: 50
    };
  }

  try {
    return await fetchAiMarketData(marketData, tokenSymbol);
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return {
      advice: "AI analysis failed",
      action: "HOLD",
      confidence: 50
    };
  }
}