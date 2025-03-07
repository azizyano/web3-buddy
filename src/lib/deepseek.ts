import { MarketData } from "@/types/type";

interface AIAnalysis {
  advice: string;
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  keyFactors: string[];
  riskAssessment: string;
}

export async function fetchAiMarketData(
  marketData: MarketData,
  tokenSymbol: string,
  prompt: string
): Promise<AIAnalysis> {
  try {
    if (!marketData?.coingecko) {
      throw new Error("Market data not available");
    }

    const {
      priceUSD,
      priceChange24hPercentage,
      priceChange7dPercentage,
      priceChange30dPercentage,
      marketCapUSD,
      volume24hUSD
    } = marketData.coingecko;

        const prompt_0 = `You are a senior crypto financial advisor. Analyze the following market data for ${tokenSymbol}. Respond with a raw JSON object (no markdown, no code blocks) in this exact format:
    {
    "action": "BUY|SELL|HOLD",
    "confidence": number,
    "keyFactors": ["factor1", "factor2", "factor3"],
    "riskAssessment": "text",
    "explanation": "text"
    }

      Current Data:
      - Price: $${priceUSD}
      - 24h Change: ${priceChange24hPercentage}%
      - 7d Change: ${priceChange7dPercentage}%
      - 30d Change: ${priceChange30dPercentage}%
      - Market Cap: $${marketCapUSD}
      - 24h Volume: $${volume24hUSD}

      Consider these technical aspects:
      ${parseFloat(priceChange24hPercentage) > 0 ? "📈 Recent upward trend" : "📉 Recent downward movement"}
      ${Math.abs(parseFloat(priceChange7dPercentage)) > 15 ? "🚀 Significant weekly volatility" : "🔄 Stable weekly performance"}
      ${parseFloat(volume24hUSD) > 1000000 ? "💎 High liquidity" : "⚠️ Low liquidity"}
    `;

    const response = await fetch("/api/deepseek", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.DEEPSEEK_API_KEY!
      },
      body: JSON.stringify({
        prompt: prompt === '' ? prompt_0 : prompt,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);

    // Fallback to default response if parsing fails
    if (!aiResponse.action) {
      return {
        advice: "🔍 Current analysis suggests holding due to market uncertainty",
        action: "HOLD",
        confidence: 50,
        keyFactors: ["Insufficient data clarity"],
        riskAssessment: "Moderate risk"
      };
    }

    return {
      advice: `📊 ${aiResponse.explanation}\n\n🚦 Risk Level: ${aiResponse.riskAssessment}`,
      action: aiResponse.action,
      confidence: aiResponse.confidence,
      keyFactors: aiResponse.keyFactors,
      riskAssessment: aiResponse.riskAssessment
    };

  } catch (error) {
    console.error("AI analysis error:", error);
    return {
      advice: "⚠️ AI analysis temporarily unavailable. Please try again later.",
      action: "HOLD",
      confidence: 50,
      keyFactors: ["Service interruption"],
      riskAssessment: "Unknown risk"
    };
  }
}

  
  
