// lib/swapUtils.ts
import { SwapPreview } from "@/types/type";
import {getKyberQuote} from "./kyberswap"
export async function generateSwapPreview(
    chainId: number,
    walletAddress: string,
    fromToken: string,
    toToken: string,
    NuAmount: number
  ): Promise<SwapPreview> {
    const amount = NuAmount.toString()
    const quote = await getKyberQuote({chainId, walletAddress, fromToken, toToken, amount});
    console.log("Quote:", quote);
    const priceImpact = ((quote.amountInUsd-quote.amountOutUsd)/quote.amountInUsd)* 100;
    const slippage = ((quote.amountOutUsd - quote.receivedUsd)/quote.amountOutUsd) * 100;
    return {
      fromAmount: NuAmount,
      toAmount: quote.outputAmount,
      priceImpact: priceImpact,
      slippage: slippage,
      fees: quote.feesUSD,
      route: quote.swaps,
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