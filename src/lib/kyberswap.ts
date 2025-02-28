/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { ethers } from "ethers";

const KYBER_API_URL = "https://aggregator-api.kyberswap.com";

export async function getKyberQuote(
  chainId: string,
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  walletAddress: string
) {
  try {
    const chainName = chainId === "1" ? "ethereum" : "sonic";
    const response = await axios.get(`${KYBER_API_URL}/${chainName}/route/encode`, {
      params: {
        tokenIn: fromTokenAddress,
        tokenOut: toTokenAddress,
        amountIn: amount,
        to: walletAddress,
        saveGas: "false",
        gasInclude: "true",
      },
      headers: { "x-client-id": "web3-buddy" }, // Optional—enhances rate limits
    });
    console.log("Kyber quote response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Kyber quote error:", error);
    throw error;
  }
}

export async function createKyberSwap(
    chainId: string,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    walletAddress: string,
    quoteData: any
  ) {
    try {
      // ✅ Validate quoteData
      if (!quoteData || !quoteData.encodedSwapData || !quoteData.routerAddress) {
        console.error("❌ Kyber Quote Data is Invalid:", quoteData);
        throw new Error("Invalid quote data from Kyber.");
      }
  
      const chainName = chainId === "1" ? "ethereum" : "sonic";
  
      // ✅ Construct the transaction payload
      const transaction = {
        from: walletAddress,
        to: quoteData.routerAddress, // ✅ Must send TX to routerAddress
        data: quoteData.encodedSwapData, // ✅ Encoded swap data from quote
        value: "0", // Typically 0 unless swapping native ETH
        gasLimit: quoteData.totalGas || 210000, // ✅ Use estimated gas
        gasPrice: ethers.parseUnits(quoteData.gasPriceGwei || "55", "gwei"), // ✅ Convert gas price
      };
  
      console.log("📤 Sending Kyber Swap Transaction:", transaction);
      return transaction;
    } catch (error: any) {
      console.error("❌ Kyber swap error:", error.response?.data || error.message);
      throw error;
    }
  }
  
  
  

  

  export function parseKyberQuote(quoteData: any) {
    if (!quoteData || !quoteData.outputAmount || !quoteData.tokens) {
      throw new Error("Invalid Kyber quote data");
    }
  
    return {
      routeSummary: quoteData.swaps || [], // ✅ Store swaps path for reference
      routerAddress: quoteData.routerAddress, // ✅ Ensure we use the correct router
      encodedSwapData: quoteData.encodedSwapData, // ✅ Critical for sending transaction
      formattedToAmount: ethers.formatUnits(quoteData.outputAmount, 6), // ✅ Convert to readable amount (assume USDC with 6 decimals)
      fromToken: quoteData.tokens[Object.keys(quoteData.tokens)[0]], // ✅ Extract first token (input)
      toToken: quoteData.tokens[Object.keys(quoteData.tokens)[1]], // ✅ Extract second token (output)
      recommended_preset: "fast", // ✅ Mocked (can be improved)
    };
  }
  

// Mock AI analysis
function analyzeSwap(swapData: any, chainId: string = "1") {
  const usdcReceived = ethers.formatUnits(swapData.outputAmount, 6);
  const gasCostWei = BigInt(swapData.gasLimit) * BigInt(swapData.gasPrice || "1000000000"); // Fallback gasPrice
  const gasCostEth = Number(ethers.formatEther(gasCostWei));
  const ethPrice = chainId === "1" ? 2300 : 0.1; // Rough ETH price (Sonic TBD)

  const mockAlternative = {
    usdc: Number(usdcReceived) - 0.5,
    gasCostEth: gasCostEth + 0.0002,
  };
  const kyberValue = Number(usdcReceived) - gasCostEth * ethPrice;
  const altValue = mockAlternative.usdc - mockAlternative.gasCostEth * ethPrice;
  const savings = kyberValue - altValue;

  const explanation = savings > 0
    ? `KyberSwap offers ${usdcReceived} USDC with a gas cost of ${gasCostEth.toFixed(5)} ETH, saving $${savings.toFixed(2)} over an alternative (${mockAlternative.usdc.toFixed(2)} USDC).`
    : `An alternative might save $${Math.abs(savings).toFixed(2)}, but KyberSwap’s ${usdcReceived} USDC is reliable.`;

  return { optimizedRoute: "KyberSwap", savings, explanation };
}