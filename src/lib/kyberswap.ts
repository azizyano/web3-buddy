/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from "axios";
import { WHITELIST } from "@/config/tokens";
import { validateChain, validateToken, validateAmount } from "./utils";
import { KyberQuote, KyberConfig } from "@/types/type";
import { parseUnits, zeroAddress } from "viem";

const KYBER_API_URL = "https://aggregator-api.kyberswap.com";

const CHAIN_MAP: { [key: number]: string } = {
  1: "ethereum",
  146: "sonic", // Assuming Sonic is supported; verify with KyberSwap
};

export async function getKyberQuote({
  chainId,
  walletAddress,
  fromToken,
  toToken,
  amount,
}: KyberConfig): Promise<any> {
  try {
    validateChain(chainId);
    validateToken(fromToken);
    validateToken(toToken);

    const chainName = CHAIN_MAP[chainId] || "ethereum";
    const fromTokenDecimals = WHITELIST.find(t => t.address === fromToken)?.decimals || 18;
    const nativeTokenAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

    // Use native token address directly
    const sanitizedFrom = fromToken === zeroAddress ? nativeTokenAddress : fromToken;
    const sanitizedTo = toToken === zeroAddress ? nativeTokenAddress : toToken;

    // Step 1: Get routes
    const routeParams = {
      tokenIn: sanitizedFrom,
      tokenOut: sanitizedTo,
      amountIn: parseUnits(amount, fromTokenDecimals).toString(),
      to: walletAddress,
      saveGas: false,
      gasInclude: true,
    };
    console.log("Kyber route params:", routeParams);
    const routeResponse = await axios.get(`${KYBER_API_URL}/${chainName}/api/v1/routes`, {
      params: routeParams,
      headers: { "x-client-id": "web3-buddy" },
    });
    console.log("Kyber route response:", routeResponse.data);
    const { routeSummary, routerAddress } = routeResponse.data.data;

    if (!routeSummary) throw new Error("No valid route found in GET response");

    // Step 2: Build encoded swap data
    const buildParams = {
      routeSummary,
      sender: walletAddress,
      recipient: walletAddress,
      slippageTolerance: 50, // 0.5% in bps
      deadline: Math.floor(Date.now() / 1000) + 20 * 60, // 20 min from now
      enableGasEstimation: true,
    };
    console.log("Kyber build params:", buildParams);
    const buildResponse = await axios.post(`${KYBER_API_URL}/${chainName}/api/v1/route/build`, buildParams, {
      headers: { "x-client-id": "web3-buddy" },
    });
    console.log("Kyber build response:", buildResponse.data);
    const buildData = buildResponse.data.data;

    //if (!buildData?.encodedSwapData) throw new Error("No encoded swap data in build response");

    return {
      routeSummary: buildParams.routeSummary,
      encodedSwapData: buildData.data,
      routerAddress: buildData.routerAddress || routerAddress, // Fallback to GET response
      inputAmount: buildData.amountIn,
      outputAmount: buildData.amountOut,
      gas: buildParams.routeSummary.gas,
      gasPrice: buildParams.routeSummary.gasPrice,
    };
  } catch (error) {
    const err = error as any;
    console.error("Kyber quote error:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || err.message || "Failed to get quote");
  }
}

export async function createKyberSwap(
  walletClient: any,
  quoteData: any,
  config: KyberConfig
): Promise<string> {
  try {
    if (!walletClient) throw new Error("Wallet not connected");

    const isNativeSwap = config.fromToken === zeroAddress;
    const fromTokenDecimals = WHITELIST.find(t => t.address === config.fromToken)?.decimals || 18;

    const tx = {
      from: config.walletAddress,
      to: quoteData.routerAddress as `0x${string}`,
      data: quoteData.encodedSwapData as `0x${string}`,
      value: isNativeSwap ? parseUnits(config.amount, fromTokenDecimals) : BigInt(0),
      gas: BigInt(quoteData.gas || 300000),
    };
    console.log("Kyber swap tx:", tx);

    const hash = await walletClient.sendTransaction(tx);
    console.log("Transaction hash:", hash);
    return hash;
  } catch (error) {
    console.error("Swap execution error:", error);
    const err = error as any;
    throw new Error(err.shortMessage || err.message || "Transaction failed");
  }
}

export function parseKyberQuote(data: any, fromToken: string, toToken: string): KyberQuote {
  const nativeTokenAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const fromTokenSanitized = fromToken === zeroAddress ? nativeTokenAddress : fromToken;
  const toTokenSanitized = toToken === zeroAddress ? nativeTokenAddress : toToken;

  const fromTokenInfo = WHITELIST.find(t => t.address === fromTokenSanitized);
  const toTokenInfo = WHITELIST.find(t => t.address === toTokenSanitized);
  console.log("Kyber token data:", data, toTokenInfo, fromTokenInfo);

  if (!fromTokenInfo || !data?.outputAmount || !data?.encodedSwapData || !data?.routerAddress) {
    throw new Error("Invalid Kyber quote response: missing required fields");
  }

  return {
    routeSummary: data.routeSummary || [],
    routerAddress: data.routerAddress,
    encodedSwapData: data.encodedSwapData,
    inputAmount: data.inputAmount,
    outputAmount: data.outputAmount,
    gasPriceGwei: data.gasPrice || "0",
    totalGas: data.gas || "300000",
    tokens: data.tokens || [],
  };
}