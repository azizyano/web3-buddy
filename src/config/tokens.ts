import { ethers } from "ethers";

export interface TokenConfig {
    chainId: number;
    address: string;
    decimals: number;
    symbol: string;
    name: string;
    kyberPool?: string; // For future liquidity checks
    isNative?: boolean;
  }
  
  export const WHITELIST: TokenConfig[] = [
    // Sonic Network Tokens
    {
      chainId: 146,
      address: ethers.ZeroAddress, // Native token
      symbol: "S",
      name: "Sonic",
      decimals: 18,
      isNative: true
    },
    {
      chainId: 146,
      address: "0x50c42dEAcD8Fc9773493ED674b675bE577f2634b",
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18
    },
    {
      chainId: 146,
      address: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38",
      symbol: "WS",
      name: "Wrapped Sonic",
      decimals: 18
    },
    {
      chainId: 146,
      address: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6
    },
    {
      chainId: 146,
      address: "0x005851f943ee2957B1748957F26319e4f9EdeBC1",
      symbol: "AG",
      name: "Silver",
      decimals: 18
    },
    {
      chainId: 146,
      address: "0x79bbF4508B1391af3A0F4B30bb5FC4aa9ab0E07C",
      symbol: "ANON",
      name: "HeyAnon",
      decimals: 18
    },
    {
      chainId: 146,
      address: "0x7B0a41f0c17474e41a0c36c0Bf33b9AED06eE9f5",
      symbol: "SNS",
      name: "Sonic Name Service",
      decimals: 18
    },
    {
      chainId: 146,
      address: "0xE51EE9868C1f0d6cd968A8B8C8376Dc2991BFE44",
      symbol: "BRUSH",
      name: "Paint Swap",
      decimals: 18
    },
    // Ethereum Mainnet Tokens
    {
      chainId: 1,
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18
    },
    {
      chainId: 1,
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6
    }
  ];
  
  // Helper functions
  export const getTokenBySymbol = (chainId: number, symbol: string): TokenConfig => {
    const token = WHITELIST.find(t => 
      t.chainId === chainId && 
      t.symbol.toLowerCase() === symbol.toLowerCase()
    );
    
    if (!token) throw new Error(`Token ${symbol} not supported on chain ${chainId}`);
    return token;
  };
  
  export const getChainTokens = (chainId: number): TokenConfig[] => {
    return WHITELIST.filter(t => t.chainId === chainId);
  };
  
  export const isNativeToken = (address: string): boolean => {
    return WHITELIST.some(t => 
      t.address.toLowerCase() === address.toLowerCase() && 
      t.isNative
    );
  };