/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from "axios";
import { ethers } from "ethers";
import { WHITELIST, getTokenBySymbol, getChainTokens } from "@/config/tokens";
import { validateChain, validateToken, validateAmount } from "./utils";
import { KyberQuote, KyberConfig } from "@/types/type";

const KYBER_API_URL = "https://aggregator-api.kyberswap.com";



export async function getKyberQuote({
  chainId,
  walletAddress,
  fromToken,
  toToken,
  amount
}: KyberConfig) {
  try {
    validateChain(chainId);
    validateToken(fromToken);
    validateToken(toToken);

    const chainName = chainId === 146 ? "sonic" : "ethereum";
    const fromTokenDecimals = WHITELIST.find(t => t.address === fromToken)?.decimals || 18;
      // Get wrapped token address
    const wrappedSonic = WHITELIST.find(t => t.chainId === chainId && t.symbol === "WS")!;

    // Replace native address with wrapped address
    const sanitizedFrom = fromToken === ethers.ZeroAddress ? wrappedSonic.address : fromToken;
    const sanitizedTo = toToken === ethers.ZeroAddress ? wrappedSonic.address : toToken;
    
    const params = {
      tokenIn: sanitizedFrom,
      tokenOut: sanitizedTo,
      amountIn: ethers.parseUnits(amount, fromTokenDecimals).toString(),
      to: walletAddress,
      saveGas: "false", // "0",
      gasInclude: "true",// "1",
      // chargeFeeBy: "currency_in",
      // feeReceiver: "0x",
      // isInBps: "true",
      // feeAmount: "0"
    };
    console.log("Kyber quote params:", params)

    const { data } = await axios.get(`${KYBER_API_URL}/${chainName}/route/encode`, {
      params,
      headers: { "x-client-id": "web3-buddy" }
    });
    console.log("Kyber quote response:", data);
    if (!data?.encodedSwapData) throw new Error("No valid route found");
    return data;
  } catch (error) {
    const err= error as any;
    console.error("Kyber quote error:", err.response?.data || err.message);
    throw new Error(err.response?.data?.error || "Failed to get quote");
  }
}

export async function createKyberSwap(
  walletClient: any,
  quoteData: any,
  config: KyberConfig
) {
  try {
    if (!walletClient) throw new Error("Wallet not connected");

    const tx = {
      from: config.walletAddress,
      to: quoteData.routerAddress,
      data: quoteData.encodedSwapData,
      value: "0",
      gas: BigInt(quoteData.gas || 300000),
      chain: {
        id: config.chainId,
        name: config.chainId === 146 ? "sonic" : "ethereum"
      }
    };
    console.log("Kyber swap tx:", tx)

    const hash = await walletClient.sendTransaction(tx);
    return hash;
  } catch (error) {
    const err = error as any;
    console.error("Swap execution error:", error);
    throw new Error(err.shortMessage || "Transaction failed");
  }
}

export function parseKyberQuote(data: any, fromToken: string, toToken: string): KyberQuote {
  // Handle native token by replacing with wrapped token address if needed
  const fromTokenSanitized = fromToken === ethers.ZeroAddress 
    ? WHITELIST.find(t => t.symbol === "WS")!.address 
    : fromToken;
  
  const fromTokenInfo = WHITELIST.find(t => t.address === fromTokenSanitized);
  const toTokenInfo = WHITELIST.find(t => t.address === toToken);
  console.log("Kyber token data:",data,  toTokenInfo,fromTokenInfo);
  if (!fromTokenInfo || !data?.outputAmount) {
    throw new Error("Invalid Kyber quote response");
  }

  return {
    routeSummary: data.swaps || [],
    routerAddress: data.routerAddress,
    encodedSwapData: data.encodedSwapData,
    inputAmount: ethers.formatUnits(
      data.inputAmount,
      fromTokenInfo.decimals
    ),
    outputAmount: ethers.formatUnits(
      data.outputAmount,
      toTokenInfo?.decimals || 18
    ),
    gasEstimate: ethers.formatUnits(data.gas || "0", "gwei")
  };
}