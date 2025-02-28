import axios from "axios";

// Using the correct Fusion API endpoint
const FUSION_API_URL = "https://api.1inch.dev/fusion/quoter/v2.0/1";

export async function getFusionQuote(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  walletAddress: string
) {
  try {
    const fullUrl = `${FUSION_API_URL}/quote/receive`;
    console.log("Full URL:", fullUrl);
    
    const response = await axios.get(fullUrl, {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_1INCH_API_KEY}`,
      },
      params: {
        fromTokenAddress,
        toTokenAddress,
        amount,
        walletAddress,
        enableEstimate: false,
        isLedgerLive: false
      },
    });
    console.log("Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Network Error Details:", {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

// Optional method to get with fee
export async function getFusionQuoteWithFee(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  walletAddress: string,
  fee: number = 100 // default 1% fee (100 bps)
) {
  try {
    const response = await axios.get(`${FUSION_API_URL}/quote/receive`, {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_1INCH_API_KEY}`,
      },
      params: {
        fromTokenAddress,
        toTokenAddress,
        amount,
        walletAddress,
        enableEstimate: false,
        fee,
        isLedgerLive: false
      },
    });
    return response.data;
  } catch (error) {
    console.error("1inch Fusion quote error:", error);
    throw error;
  }
}

// Create a proxy version for use with Next.js API routes
export async function getFusionQuoteViaProxy(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  walletAddress: string
) {
  try {
    // Using your Next.js API route
    const response = await axios.get("/api/fusion-quote", {
      params: {
        fromTokenAddress,
        toTokenAddress,
        amount,
        walletAddress,
        enableEstimate: false,
        isLedgerLive: false
      },
    });
    return response.data;
  } catch (error) {
    console.error("Proxy API error:", error);
    throw error;
  }
}