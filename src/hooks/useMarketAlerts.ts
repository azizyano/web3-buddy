
'use client';

import { useEffect } from "react";
import { useAIContext } from "@/contexts/AIContext";
import { fetchCoinGeckoData } from "@/lib/fetch_market_data";

export function useMarketAlerts(chainId: number, tokenSymbol: string) {
  const { addAlert } = useAIContext();

  useEffect(() => {
    const checkMarketConditions = async () => {
      const data = await fetchCoinGeckoData(chainId, tokenSymbol);
      
      if (data?.priceChange24hPercentage) {
        const change = parseFloat(data.priceChange24hPercentage);
        
        if (Math.abs(change) > 5) {
          addAlert({
            type: "market",
            content: `${tokenSymbol} price ${change > 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(1)}% in 24h`,
            metadata: {
              token: tokenSymbol,
              changePercentage: change
            }
          });
        }
      }
    };

    const interval = setInterval(checkMarketConditions, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [chainId, tokenSymbol, addAlert]);
}