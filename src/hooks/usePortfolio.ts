/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { getChainTokens } from "@/config/tokens";
import { fetchTokenPrice } from "@/lib/fetch_market_data";
import { ethers } from "ethers";
import { PortfolioAsset, PortfolioMetrics } from "@/types/type";

export function usePortfolio(chainId: number) {
  const { address } = useAccount();
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | undefined>(undefined);
  
  const provider = new ethers.JsonRpcProvider(
    chainId === 146 
      ? "https://rpc.soniclabs.com" 
      : `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`
  );

  const calculateMetrics = (assets: PortfolioAsset[]): PortfolioMetrics => {
    const validAssets = assets.filter(a => a.valueUSD > 0);
    const totalValue = validAssets.reduce((sum, asset) => sum + asset.valueUSD, 0);
    
    const weights = validAssets.map(asset => ({
      symbol: asset.symbol,
      weight: asset.valueUSD / totalValue
    }));


    const portfolioVolatility = weights.reduce((sum, asset) => {
      const assetData = validAssets.find(a => a.symbol === asset.symbol);
      return sum + (asset.weight * (assetData?.volatility || 0));
    }, 0);

    return {
      totalValue,
      diversityIndex: validAssets.length,
      topPerformer: weights.sort((a, b) => b.weight - a.weight)[0]?.symbol || "N/A",
      worstPerformer: weights.sort((a, b) => a.weight - b.weight)[0]?.symbol || "N/A",
      riskScore: Math.min(Math.round(portfolioVolatility * 100), 100)
    };
  };

  const fetchTokenBalance = async (tokenAddress: string, decimals: number) => {
    try {
      if (tokenAddress === ethers.ZeroAddress) {
        const balance = await provider.getBalance(address!);
        return ethers.formatUnits(balance, decimals);
      }
      
      const contract = new ethers.Contract(
        tokenAddress,
        ["function balanceOf(address) view returns (uint256)"],
        provider
      );
      const balance = await contract.balanceOf(address);
      return ethers.formatUnits(balance, decimals);
      
    } catch (error) {
      console.error("Balance fetch error:", error);
      return "0";
    }
  };

  const fetchBalances = async () => {
    if (!address) return;

    const tokens = getChainTokens(chainId);
    const assets = await Promise.all(
      tokens.map(async (token) => {
        try {
          const balance = await fetchTokenBalance(token.address, token.decimals);
          const price = await fetchTokenPrice(chainId, token.symbol) || 0;
          console.log(`Fetched ${token.symbol} balance:`, price, balance);
          return {
            symbol: token.symbol,
            balance: parseFloat(balance),
            valueUSD: parseFloat(balance) * price,
            volatility: 0,
            allocation: 0,
            chain: chainId.toString()
          };
        } catch (error) {
          console.error(`Failed to fetch ${token.symbol}:`, error);
          return null;
        }
      })
    );

    const validAssets = assets.filter(Boolean) as PortfolioAsset[];
    const totalValue = validAssets.reduce((sum, a) => sum + a.valueUSD, 0);
    
    const updatedAssets = validAssets.map(a => ({
      ...a,
      allocation: (a.valueUSD / totalValue) * 100
    }));

    setPortfolio(updatedAssets);
    setMetrics(calculateMetrics(updatedAssets));
  };

  useEffect(() => {
    fetchBalances();
  }, [address, chainId]);

  return { portfolio, metrics };
}