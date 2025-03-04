/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { fetchTokenMarketData } from "@/lib/fetch_market_data";
import { getTokenAddress } from "@/app/config/tokens";
import { useAccount } from "wagmi";
import type { MarketData } from "@/types/type"; // Updated import path

interface MarketDataProps {
  address: string;
  selectedToken: string; // Add selectedToken prop
}

export default function MarketData({ address, selectedToken }: MarketDataProps) {
  const { chain } = useAccount();
  const [marketData, setMarketData] = useState<MarketData>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chain?.id) return;
    setLoading(true);

    const tokenAddress1 = getTokenAddress(chain.id.toString(), selectedToken);
    const tokenAddress2 = getTokenAddress(chain.id.toString(), "USDC");
    const coingeckoId = chain.id === 1 ? "ethereum" : "sonic-3"; // Adjust for Sonic network

    fetchTokenMarketData(chain.id.toString(), tokenAddress1!, tokenAddress2!, "10000000000000000", coingeckoId, address)
      .then((data: MarketData | null) => { // Explicit type for data
        if (data) {
          setMarketData(data);
        } else {
          console.error("Market data is null");
        }
      })
      .catch((error: Error) => console.error("Market data fetch error:", error)) // Explicit type for error
      .finally(() => setLoading(false));
  }, [chain, address, selectedToken]);

  const handleRefresh = () => {
    if (!chain?.id) return;
    setLoading(true);

    const tokenAddress1 = getTokenAddress(chain.id.toString(), selectedToken);
    const tokenAddress2 = getTokenAddress(chain.id.toString(), "USDC");
    const coingeckoId = chain.id === 1 ? "ethereum" : "sonic-3"; // Adjust for Sonic network

    fetchTokenMarketData(chain.id.toString(), tokenAddress1!, tokenAddress2!, "10000000000000000", coingeckoId, address)
      .then((data: MarketData | null) => { // Explicit type for data
        if (data) {
          setMarketData(data);
        } else {
          console.error("Market data is null");
        }
      })
      .catch((error: Error) => console.error("Market data fetch error:", error)) // Explicit type for error
      .finally(() => setLoading(false));
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-white">
      <h2 className="text-xl font-bold mb-3">📊 Market Data</h2>
      {loading ? (
        <p>Loading market data...</p>
      ) : marketData ? (
        <div>
          <p>💰 <strong>Token Price:</strong> ${marketData?.coingecko?.priceUSD ?? "N/A"}</p>
          <p>📊 <strong>24h Change:</strong> {marketData?.coingecko?.priceChange24hPercentage ?? "N/A"}%</p>
          <p>📈 <strong>Market Cap:</strong> ${marketData?.coingecko?.marketCapUSD.toLocaleString() ?? "N/A"}</p>
          <p>💧 <strong>Kyber gasCostUSD:</strong> {marketData?.kyber?.gasCostUSD ?? "N/A"}</p>
          <p>🔺 <strong>ATH:</strong> ${marketData?.coingecko?.athUSD ?? "N/A"} ({marketData?.coingecko?.athChangePercentage ?? "N/A"}% below ATH)</p>
          <p>🔻 <strong>ATL:</strong> ${marketData?.coingecko?.atlUSD ?? "N/A"} ({marketData?.coingecko?.atlChangePercentage ?? "N/A"}% above ATL)</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          >
            Refresh Data
          </button>
          {/* AI Analysis Section */}
          <div className="mt-4 p-3 border rounded-lg bg-gray-700">
            <h3 className="text-lg font-bold mb-2">🤖 AI Recommendation</h3>
            <p>📌 <strong>Action:</strong> <span className="text-yellow-400">{marketData?.aiAnalysis?.action ?? "N/A"}</span></p>
            <p>💡 <strong>Advice:</strong> {marketData?.aiAnalysis?.advice ?? "N/A"}</p>
          </div>
        </div>
      ) : (
        <p>No market data available.</p>
      )}
    </div>
  );
}
