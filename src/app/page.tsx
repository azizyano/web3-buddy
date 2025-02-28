/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAccount, useWalletClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Wallet,
  CheckCircle,
  Loader2,
  ArrowRight,
  BotMessageSquare,
  UserRound,
  NetworkIcon,
  CoinsIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getKyberQuote, createKyberSwap, parseKyberQuote } from "../lib/kyberswap";

interface QuoteData {
  routeSummary: any;
  formattedToAmount: string;
  recommended_preset: string;
  encodedSwapData: string;
  routerAddress: string;
}

export default function Home() {
  const { address, chain, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const [wethBalance, setWethBalance] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const provider = new ethers.JsonRpcProvider(
    chain?.id === 146 ? "https://rpc.soniclabs.com" : `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`
  );

  const wethAddress = chain?.id === 146 ? "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38" : "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const usdcAddress = chain?.id === 146 ? "0x29219dd400f2Bf60E5a23d13Be72B486D4038894" : "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  const wethContract = new ethers.Contract(wethAddress, ["function balanceOf(address) view returns (uint256)"], provider);

  useEffect(() => {
    if (isConnected && address) {
      wethContract.balanceOf(address).then((balance: bigint) => {
        setWethBalance(ethers.formatEther(balance));
      });
    }
  }, [isConnected, address]);

  const handleGetQuote = async () => {
    if (!isConnected || ![1, 146].includes(chain?.id || 0)) {
      alert("Connect to Ethereum or Sonic Mainnet first!");
      return;
    }
    if (!wethBalance || Number(wethBalance) < 0.01) {
      alert("Insufficient WETH balance! Wrap some tokens first.");
      return;
    }
    setLoading(true);
    setAction("Fetching Quote...");
    try {
      const quote = await getKyberQuote(chain?.id?.toString() || "", wethAddress, usdcAddress, ethers.parseEther("0.01").toString(), address!);
      setQuoteData(parseKyberQuote(quote));
      console.log("Quote data:", parseKyberQuote(quote));
      setSuccessMessage("Quote received! Ready to proceed.");
    } catch (error) {
      console.error("Quote failed:", error);
      setSuccessMessage(null);
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleApprove = async () => {
    if (!walletClient) return;
    setLoading(true);
    setAction("Approving WETH...");
    try {
      const weth = new ethers.Contract(wethAddress, ["function approve(address spender, uint256 amount) returns (bool)"], walletClient as unknown as ethers.Signer);
      const tx = await weth.approve("0x6131B5fae19EA4f9D964eAc0408E4408b66337b5", ethers.parseEther("0.01"));
      console.log("Approval tx:", tx);
      setSuccessMessage("WETH Approved! Now execute the swap.");
    } catch (error) {
      console.error("Approval failed:", error);
      setSuccessMessage(null);
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleCreateOrder = async () => {
    if (!quoteData) return;
    if (!walletClient) {
      alert("Wallet not connected! Please connect your wallet.");
      return;
    }

    console.log("📊 Checking parsed Kyber Quote Data:", quoteData);

    if (!quoteData.encodedSwapData || !quoteData.routerAddress) {
      console.error("❌ Missing encodedSwapData or routerAddress in quoteData!");
      alert("Swap cannot proceed: Invalid quote data.");
      return;
    }

    setLoading(true);
    setAction("Creating & Sending Order...");

    try {
      console.log("🚀 Requesting Kyber Swap transaction...");

      const transaction = await createKyberSwap(chain?.id?.toString() || "", wethAddress, usdcAddress, ethers.parseEther("0.01").toString(), address!, quoteData);

      console.log("📤 Sending transaction:", transaction);

      // ✅ Send Transaction
      const txHash = await walletClient.sendTransaction(transaction as any);

      console.log("✅ Transaction sent! Hash:", txHash);
      setSuccessMessage(`Swap submitted! TX: ${txHash}`);
    } catch (error) {
      console.error("❌ Swap failed:", error);
      alert("Swap failed! Check console for details.");
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const [messages, setMessages] = useState<Array<{content: string; isAI: boolean}>>([]);
  const [input, setInput] = useState("");

  const addMessage = (content: string, isAI: boolean) => {
    setMessages(prev => [...prev, { content, isAI }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Ajouter le message utilisateur
    addMessage(input, false);
    setInput("");

    // Simuler réponse AI
    setLoading(true);
    setTimeout(() => {
      addMessage("Processing your request...", true);
      handleGetQuote();
      setLoading(false);
    }, 1000);
  };

  return (
    <main className="flex flex-col h-screen bg-gradient-to-b from-gray-900 to-blue-900">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Web3 AI Assistant
            </h1>
            <ConnectButton
              label="Connect Wallet"
              chainStatus="icon"
              showBalance={false}
              accountStatus="address"
            />
          </div>

          {/* Chat Container */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
            <div className="space-y-4 mb-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.isAI ? "justify-start" : "justify-end"}`}>
                  <div className={`p-3 rounded-2xl max-w-[80%] ${
                    msg.isAI
                      ? "bg-gray-700/50 text-white"
                      : "bg-blue-600 text-white"
                  }`}>
                    <div className="flex items-center gap-2">
                      {msg.isAI && <BotMessageSquare className="w-5 h-5 text-purple-400" />}
                      <p className="leading-relaxed">{msg.content}</p>
                      {!msg.isAI && <UserRound className="w-5 h-5 text-blue-200" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulaire de chat */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me to swap tokens..."
                className="flex-1 bg-gray-700/50 text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="p-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-white disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-6 w-6" />
                ) : (
                  <ArrowRight className="h-6 w-6" />
                )}
              </button>
            </form>
          </div>

          {/* Wallet Info */}
          {isConnected && (
            <div className="mt-6 bg-gray-800/50 p-4 rounded-xl backdrop-blur-lg">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-400" />
                  <span>{address!.slice(0, 6)}...{address!.slice(-4)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <NetworkIcon className="w-5 h-5 text-purple-400" />
                  <span>{chain?.name} (ID: {chain?.id})</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <CoinsIcon className="w-5 h-5 text-green-400" />
                  <span>WETH Balance: {wethBalance ? `${wethBalance.slice(0, 6)}` : '0.00'} WETH</span>
                </div>
              </div>

              {successMessage && (
                <div className="mt-4 p-3 bg-green-900/50 text-green-400 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {quoteData && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-1 p-3 bg-yellow-600/50 hover:bg-yellow-700/50 rounded-lg text-yellow-100 disabled:opacity-50 transition-all"
                  >
                    Approve WETH
                  </button>
                  <button
                    onClick={handleCreateOrder}
                    disabled={loading}
                    className="flex-1 p-3 bg-green-600/50 hover:bg-green-700/50 rounded-lg text-green-100 disabled:opacity-50 transition-all"
                  >
                    Execute Swap
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Élément décoratif AI */}
      <div className="absolute top-0 right-0 opacity-10">
        <svg viewBox="0 0 200 200" className="w-96 h-96 text-blue-500">
          <path
            fill="currentColor"
            d="M45,-78.3C57.1,-69.9,64.1,-55.1,69.5,-40.5C74.9,-25.9,78.6,-11.5,79.8,4.1C81,19.7,79.7,39.3,71.4,53.6C63.1,67.8,47.8,76.6,33.1,78.9C18.4,81.2,4.2,77,-8.7,70.8C-21.6,64.6,-34.3,56.3,-44.5,46C-54.7,35.7,-62.5,23.4,-68.7,8.3C-74.9,-6.8,-79.5,-24.7,-74.8,-38.1C-70.1,-51.5,-56.1,-60.4,-42.2,-68.1C-28.3,-75.7,-14.1,-82.1,1.8,-84.9C17.6,-87.7,35.3,-86.8,45,-78.3Z"
            transform="translate(100 100)"
          />
        </svg>
      </div>
    </main>
  );
}
