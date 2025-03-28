/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import axios from "axios";
console.log("🔑 DeepSeek API Key:", process.env.DEEPSEEK_API ? "Loaded ✅" : "Missing ❌");

export async function POST(req: Request) {
  try {
    console.log("🔵 Received request at /api/deepseek");

    // ✅ Parse the request body
    const { prompt } = await req.json();
    console.log("📝 AI Prompt:", prompt);

    // ✅ Call DeepSeek API
    const response = await axios.post(
      "https://api.deepseek.com/chat/completions",
      {
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DEEPSEEK_API}`, // API Key from .env
        },
      }
    );

    console.log("✅ DeepSeek API Response:", response.data);
    return NextResponse.json(response.data, { status: response.status });

  } catch (error) {
    const err = error as any
    console.error("❌ DeepSeek API Error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });

    return NextResponse.json({ error: "Failed to fetch DeepSeek data" }, { status: err.response?.status || 500 });
  }
}
