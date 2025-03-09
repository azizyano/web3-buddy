/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/swapUtils.ts
import { SwapPreview } from "@/types/type";

export async function generateSwapPreview(
    chainId: number,
    walletAddress: string,
    fromToken: string,
    toToken: string,
    NuAmount: number,
    quote: any
  ): Promise<SwapPreview> {
    
    console.log("Quote:", quote);
    const priceImpact = ((quote.amountInUsd-quote.amountOutUsd)/quote.amountInUsd)* 100;
    const slippage = ((quote.amountOutUsd - quote.amountInUsd)/quote.amountOutUsd) * 100;
    return {
      fromAmount: quote.amountIn,
      toAmount: quote.amountOut,
      priceImpact: priceImpact,
      slippage: slippage,
      fees: quote.l1FeeUsd,
      route: quote.route,
      riskLevel: calculateRiskLevel(
        priceImpact,
        slippage
      )
    };
  }
  
  const calculateRiskLevel = (
    priceImpact: number,
    slippage: number
  ): "low" | "medium" | "high" => {
    const score = priceImpact * 2 + slippage;
    return score < 1 ? "low" : score < 3 ? "medium" : "high";
  };