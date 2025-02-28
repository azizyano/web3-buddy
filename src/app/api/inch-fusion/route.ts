/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// POST handler

// ✅ 1inch API Base URL
const BASE_URL = "https://api.1inch.dev/swap/v5.2";

// ✅ API Key from Environment Variables
const API_KEY = process.env.INCH_API_KEY || process.env.NEXT_PUBLIC_1INCH_API_KEY;

if (!API_KEY) {
  console.error("❌ 1inch API Key is missing! Set it in .env.local");
}

// ✅ POST: Create a swap transaction
export async function POST(request: NextRequest) {
  console.log("📨 Received POST request to /api/1inch-fusion");

  try {
    // ✅ Parse JSON Body
    const body = await request.json();
    console.log("📊 Request Payload:", body);

    // ✅ Extract required fields
    const { fromTokenAddress, toTokenAddress, amount, walletAddress, chainId = "1", slippage = "1" } = body;

    if (!fromTokenAddress || !toTokenAddress || !amount || !walletAddress) {
      return NextResponse.json({ error: "Missing required fields!" }, { status: 400 });
    }

    // ✅ Construct API URL
    const apiUrl = `${BASE_URL}/${chainId}/swap?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&fromAddress=${walletAddress}&slippage=${slippage}`;

    console.log("🔗 Sending request to 1inch API:", apiUrl);

    // ✅ Send Request to 1inch Swap API
    const response = await axios.get(apiUrl, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    console.log("✅ 1inch API Response:", response.data);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("❌ Error in POST /api/1inch-fusion:", error.message);

    return NextResponse.json(
      { error: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
}


// GET handler
export async function GET(request: NextRequest) {
  console.log("GET request received at /api/1inch-fusion");
  
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");
    const chainId = searchParams.get("chainId") || "1";
    
    const apiUrl = endpoint === "fusion-quote"
      ? `https://api.1inch.dev/fusion/quoter/v2.0/${chainId}/quote/receive`
      : `https://api.1inch.dev/swap/v5.2/${chainId}/quote`;

    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (key !== "endpoint" && key !== "chainId") params.append(key, value);
    });

    const fullUrl = `${apiUrl}?${params.toString()}`;
    console.log("Proxying GET to:", fullUrl);

    // Get API key - try multiple environment variable names
    const apiKey = process.env.INCH_API_KEY || 
                   process.env.ONE_INCH_API_KEY || 
                   process.env.NEXT_PUBLIC_1INCH_API_KEY;
    
    if (!apiKey) {
      console.error("API key not found in environment variables");
      return NextResponse.json(
        { error: "Server configuration error: API key not found" },
        { status: 500 }
      );
    }

    const response = await axios.get(fullUrl, {
      headers: { 
        Authorization: `Bearer ${apiKey}` 
      },
    });
    
    return NextResponse.json(response.data);
    
  } catch (error: any) {
    console.error("GET Proxy Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    return NextResponse.json(
      { error: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
}

