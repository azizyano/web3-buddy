// lib/web3Terms.ts
export const WEB3_GLOSSARY: Record<string, { 
    summary: string; 
    aiPrompt: string 
  }> = {
    slippage: {
      summary: "Maximum price difference you'll accept between trade start and completion",
      aiPrompt: "Explain slippage and how to calculate safe values"
    },
    gas: {
      summary: "Fee required to execute blockchain transactions",
      aiPrompt: "Explain gas fees and optimization strategies"
    },
    impermanentLoss: {
      summary: "Temporary loss when providing liquidity due to price changes",
      aiPrompt: "Explain impermanent loss with an AMM example"
    }
  };