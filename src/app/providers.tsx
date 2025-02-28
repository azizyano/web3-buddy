"use client";

import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// Sonic chain spec (from Sonic docs)
const sonic = {
  id: 146,
  name: "Sonic",
  network: "sonic",
  nativeCurrency: { name: "Sonic", symbol: "S", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.soniclabs.com"] }, public: { http: ["https://rpc.soniclabs.com"] } },
  blockExplorers: { default: { name: "Sonic Explorer", url: "https://sonicscan.org" } },
};

const config = getDefaultConfig({
  appName: "Web3 Buddy",
  projectId: "cfee1c46a7540f5a43cee18b0f4b0e36", // From walletconnect.com
  chains: [mainnet, sonic], // Add Sonic
  ssr: true,
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}