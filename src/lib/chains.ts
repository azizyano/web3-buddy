export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  contracts: {
    weth: string;
    usdc: string;
    router: string;
  };
}

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    id: 1,
    name: "Ethereum",
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`,
    explorerUrl: "https://etherscan.io",
    contracts: {
      weth: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38",
      usdc: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
      router: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5"
    }
  },
  {
    id: 146,
    name: "Sonic",
    rpcUrl: "https://rpc.sonic.network",
    explorerUrl: "https://explorer.sonic.network",
    contracts: {
      weth: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38",
      usdc: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894", 
      router: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5"
    }
  }
];

export const getChainConfig = (chainId?: number): ChainConfig | undefined => {
  return SUPPORTED_CHAINS.find(c => c.id === chainId);
};