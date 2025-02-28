/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError } from "axios";
import { ethers } from "ethers";

export async function getFusionQuoteViaProxy(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  walletAddress: string,
  chainId: string = "1"
) {
  try {
    console.log("Fetching quote with:", { fromTokenAddress, toTokenAddress, amount, walletAddress, chainId });
    const response = await axios.get("/api/inch-fusion", {
      params: {
        endpoint: "fusion-quote",
        fromTokenAddress,
        toTokenAddress,
        amount,
        walletAddress,
        chainId,
        enableEstimate: "true",
        isLedgerLive: "false",
      },
    });
    console.log("Quote response:", response.data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Fusion quote API error:", error.message, error.response?.data);
      throw new Error(`API Error (${error.response?.status}): ${JSON.stringify(error.response?.data)}`);
    }
    console.error("Unexpected error:", error);
    throw error;
  }
}

export async function createSwapTransaction(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  walletAddress: string,
  chainId: string = "1",
  slippage: string = "1" // Default 1% slippage
) {
  try {
    const payload = {
      fromTokenAddress,
      toTokenAddress,
      amount,
      walletAddress,
      chainId,
      slippage,
    };
    console.log("Creating swap tx with:", payload);
    const response = await axios.post("/api/inch-fusion", payload, {
      timeout: 30000,
    });
    console.log("Swap tx response:", response.data);
    return response.data;
  } catch (error: unknown) {
    const errorDetails = {
      message: error instanceof Error ? error.message : "Unknown error",
      status: error instanceof AxiosError ? error.response?.status : undefined,
      data: error instanceof AxiosError ? error.response?.data : undefined,
    };
    console.error("Error creating swap tx:", errorDetails);
    if (error instanceof AxiosError && error.response?.data) {
      throw new Error(`API Error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

export function parseFusionQuote(quoteData: any) {
  if (!quoteData) throw new Error("Invalid quote data received");
  const { quoteId, fromTokenAmount, toTokenAmount, presets, recommended_preset } = quoteData;
  if (!quoteId || !toTokenAmount) {
    console.error("Incomplete quote data:", quoteData);
    throw new Error("Incomplete quote data received from API");
  }
  return {
    quoteId,
    fromTokenAmount,
    toTokenAmount,
    presets,
    recommended_preset,
    formattedToAmount: ethers.formatUnits(toTokenAmount, 6),
  };
}