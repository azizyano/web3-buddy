/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAccount, useBalance, useWalletClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Wallet,
  CheckCircle,
  Loader2,
  ArrowRight,
  BotMessageSquare,
  UserRound,
  ArrowUp,
  ArrowDown,
  NetworkIcon,
  CoinsIcon,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getKyberQuote, createKyberSwap, parseKyberQuote } from "../lib/kyberswap";
import { getChainTokens, getTokenBySymbol, TokenConfig } from "@/config/tokens";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/app/providers";
import { getCompleteMarketAnalysis } from "@/lib/market";
import AIHeader from "@/components/AIHeader";
import { useMarketAlerts } from "@/hooks/useMarketAlerts";
import { usePortfolio } from "@/hooks/usePortfolio";
import PortfolioDashboard from "@/components/PortfolioDashboard";
import SwapPreviewCard from "@/components/SwapPreviewCard";
import { generateSwapPreview } from "@/lib/swapUtils";
import { useContractInteraction } from '@/hooks/useContract';
// ERC-20 ABI snippet for approval
const ERC20_ABI = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  }
];



interface QuoteData {
  routeSummary: any;
  formattedToAmount: string;
  recommended_preset: string;
  encodedSwapData: string;
  routerAddress: string;
}

export default function Home() {
  const { address, chain, isConnected } = useAccount();
  const { readFromContract, writeToContract, isLoading } = useContractInteraction();
  const { data: walletClient } = useWalletClient();
  const nativeToken = getChainTokens(chain ? chain.id : 146).find(t => t.isNative)!;
  const provider = new ethers.JsonRpcProvider(
    chain?.id === 146 ? "https://rpc.soniclabs.com" : `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`
  );

  const { portfolio, metrics } = usePortfolio(chain?.id || 146);

  type MessageType = {
    content: string | React.ReactNode;
    isBot: boolean;
    status?: 'loading' | 'complete';
    actions?: { label: string; onClick: () => void }[];
  };

  type FlowStep =
    | 'connect'
    | 'token_selection'
    | 'action_selection'
    | 'amount_input'
    | 'approval'
    | 'confirmation';

  const handleRestart = () => {
    setFlowStep('token_selection');
    setChatHistory([{
      content: `Connected to ${address?.slice(0, 6)}...${address?.slice(-4)} on ${chain?.name}`,
      isBot: true,
      status: 'complete'
    }]);
    setSelectedToken(null);
    setSwapAction(null);
    setAmount('');
    setQuoteData(null);
    setInputError(null);
    setIsSwapping(false);
    setPreview(null);
  };

  const [chatHistory, setChatHistory] = useState<MessageType[]>([{
    content: "Welcome! I'm your Web3 trading assistant. Let's start by selecting a token to analyze.",
    isBot: true,
    status: 'complete'
  }]);
  const [flowStep, setFlowStep] = useState<FlowStep>('connect');
  const [selectedToken, setSelectedToken] = useState<TokenConfig | null>(null);
  const [swapAction, setSwapAction] = useState<'buy' | 'sell' | null>(null);
  const [amount, setAmount] = useState('');
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [balances, setBalances] = useState<{
    native: bigint;
    tokens: { [address: string]: bigint };
  }>({
    native: BigInt(0),
    tokens: {}
  });

  useMarketAlerts(chain?.id || 146, selectedToken?.symbol || "SONIC");

  useEffect(() => {
    const fetchBalances = async () => {
      if (!address || !chain) return;

      const nativeBalance = await provider.getBalance(address);
      const tokenBalances: { [address: string]: bigint } = {};
      for (const token of getChainTokens(chain.id)) {
        if (token.isNative) continue;

        const contract = new ethers.Contract(
          token.address,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        tokenBalances[token.address] = await contract.balanceOf(address);
      }

      setBalances({
        native: nativeBalance,
        tokens: tokenBalances
      });
    };

    if (isConnected) {
      fetchBalances();
    }
  }, [isConnected, address, chain]);

  useEffect(() => {
    if (isConnected) {
      setFlowStep('token_selection');
      setChatHistory(prev => [...prev, {
        content: `Connected to ${address?.slice(0, 6)}...${address?.slice(-4)} on ${chain?.name}`,
        isBot: true,
        status: 'complete'
      }]);
    }
  }, [isConnected, address, chain]);

  async function fetchApproval(
    tokenAddress: `0x${string}`,
    owner: string,
    spender: string,
    amount: string,
    decimals: number
  ): Promise<boolean> {
    try {
      if (tokenAddress === ethers.ZeroAddress) return true; // Native token, no approval needed
      console.log("Checking approval for:", tokenAddress, owner, spender, amount, decimals);
      const allowanceResult = await readFromContract(
        tokenAddress,
        ERC20_ABI,
        'allowance',
        [owner, spender]
      );
      console.log("Allowance result:", allowanceResult);
      
      const allowance = BigInt(allowanceResult as unknown as string);
      const requiredAmount = ethers.parseUnits(amount, decimals);
      if(!allowance) return false;
      return allowance >= requiredAmount;
    } catch (error) {
      console.error("Fetch approval error:", error);
      throw new Error("Failed to check token approval");
    }
  }

  async function approve(
    tokenAddress: `0x${string}`,
    spender: string,
    amount: string,
    decimals: number
  ): Promise<`0x${string}`| null> {
    try {
      const Tx = await writeToContract(
        tokenAddress,
        ERC20_ABI,
        'approve',
        [spender, ethers.parseUnits(amount, decimals)],
        BigInt(0)
      );
      if(Tx) return Tx;
    } catch (error) {
      console.error("Approve error:", error);
      throw new Error("Failed to approve token");
    }
    return null;
  }

  const handleActionSelect = async (action: 'buy' | 'sell') => {
    setSwapAction(action);
    setFlowStep('amount_input');

    setChatHistory(prev => [...prev, {
      content: action.charAt(0).toUpperCase() + action.slice(1),
      isBot: false
    }, {
      content: `Enter the amount you want to ${action} in ${selectedToken?.symbol}`,
      isBot: true,
      status: 'complete'
    }]);
  };

  const handleAnalysis = async (tokenSymbol: string) => {
    setLoading(true);
   
    const analysis = await getCompleteMarketAnalysis(chain?.id || 146, tokenSymbol);
    
    setChatHistory(prev => [...prev, {
      content: (
        <div className="p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-bold mb-2">🤖 AI Analysis</h3>
          <p className="mb-2">{analysis.advice}</p>
          <div className="flex gap-4 text-sm">
            <span>Confidence: {analysis.confidence}%</span>
          </div>
        </div>
      ),
      isBot: true,
      status: 'complete'
    }]);
    setLoading(false);
  };

  const handleSwap = async () => {
    if (!chain || !address || !selectedToken || !walletClient) return;

    try {
      setInputError(null);

      if (!amount || isNaN(Number(amount))) {
        throw new Error("Please enter a valid amount");
      }

      const wrappedSonic = getChainTokens(chain.id).find(t => t.symbol === "WS");
      if (!wrappedSonic) throw new Error("Wrapped token not configured");

      const isSell = swapAction === 'sell';
      const fromToken = isSell 
        ? selectedToken.isNative ? wrappedSonic.address : selectedToken.address
        : wrappedSonic.address;
      const toToken = isSell
        ? wrappedSonic.address
        : selectedToken.isNative ? wrappedSonic.address : selectedToken.address;

      const swapConfig = {
        chainId: chain.id,
        walletAddress: address,
        fromToken,
        toToken,
        amount
      };

      // Check balance
      const fromBalance = fromToken === wrappedSonic.address 
        ? balances.native 
        : balances.tokens[fromToken] || BigInt(0);
      const fromTokenDecimals = getChainTokens(chain.id).find(t => t.address === fromToken)?.decimals || 18;
      const formattedBalance = ethers.formatUnits(fromBalance, fromTokenDecimals);
      if (parseFloat(amount) > parseFloat(formattedBalance)) {
        throw new Error(`Insufficient balance: ${formattedBalance} available`);
      }

            // Get and process quote
            const quote = await getKyberQuote(swapConfig);
            const parsedQuote = parseKyberQuote(quote, fromToken, toToken);
            console.log("parsedQuote", parsedQuote);
            setQuoteData({
              routeSummary: parsedQuote.routeSummary,
              formattedToAmount: parsedQuote.outputAmount,
              recommended_preset: parsedQuote.gasPriceGwei,
              encodedSwapData: parsedQuote.encodedSwapData,
              routerAddress: parsedQuote.routerAddress
            });

      // Check approval for ERC-20 fromToken
      if (fromToken !== ethers.ZeroAddress) {
        const isApproved = await fetchApproval(
          fromToken as `0x${string}`,
          address,
          parsedQuote.routerAddress || "0x0000000000000000000000000000000000000000", // Placeholder until quote is fetched
          amount,
          fromTokenDecimals
        );

        if (!isApproved) {
          setChatHistory(prev => [...prev, {
            content: `Approval required for ${selectedToken.symbol}. Approve now?`,
            isBot: true,
            status: 'complete',
            actions: [
              {
                label: "✅ Approve",
                onClick: async () => {
                  try {
                    const txHash = await approve(
                      fromToken as `0x${string}`,
                      parsedQuote.routerAddress || "0x0000000000000000000000000000000000000000", // Will be updated later
                      amount,
                      fromTokenDecimals
                    );
                    setChatHistory(prev => [...prev, {
                      content: `Approval successful: ${txHash}`,
                      isBot: true,
                      status: 'complete'
                    }]);
                    await handleSwap(); // Re-run after approval
                  } catch (error) {
                    handleSwapError(error);
                  }
                }
              },
              {
                label: "✖️ Cancel",
                onClick: () => setFlowStep('amount_input')
              }
            ]
          }]);
          setFlowStep('approval');
          return;
        }
      }

      // Generate preview
      const preview = await generateSwapPreview(
        chain.id,
        address,
        fromToken,
        toToken,
        parseFloat(amount),
        parsedQuote.routeSummary
      );
      setPreview(preview);



      // Update chat history
      setChatHistory(prev => [
        ...prev,
        {
          content: <SwapPreviewCard preview={preview} />,
          isBot: true,
          status: 'complete'
        },
        {
          content: "Confirm this swap?",
          isBot: true,
          status: 'complete',
          actions: [
            { label: "✅ Confirm", onClick: () => executeSwap() },
            { label: "✖️ Cancel", onClick: () => setFlowStep('amount_input') }
          ]
        }
      ]);

      setFlowStep('confirmation');
    } catch (error) {
      handleSwapError(error);
    }
  };

  const executeSwap = async () => {
    if (!walletClient || !selectedToken || !chain || !quoteData) return;

    try {
      setIsSwapping(true);

      const wrappedSonic = getChainTokens(chain.id).find(t => t.symbol === "WS");
      if (!wrappedSonic) throw new Error("Wrapped token not configured");

      const isSell = swapAction === 'sell';
      const fromToken = isSell 
        ? selectedToken.isNative ? wrappedSonic.address : selectedToken.address
        : wrappedSonic.address;
      const toToken = isSell
        ? wrappedSonic.address
        : selectedToken.isNative ? wrappedSonic.address : selectedToken.address;

      const swapConfig = {
        chainId: chain.id,
        walletAddress: address!,
        fromToken,
        toToken,
        amount
      };

      // Final approval check (safety net)
      if (fromToken !== ethers.ZeroAddress) {
        const fromTokenDecimals = getChainTokens(chain.id).find(t => t.address === fromToken)?.decimals || 18;
        const isApproved = await fetchApproval(
          fromToken as `0x${string}`,
          address!,
          quoteData.routerAddress,
          amount,
          fromTokenDecimals
        );
        if (!isApproved) {
          throw new Error("Token approval revoked. Please approve again.");
        }
      }

      const txHash = await createKyberSwap(walletClient, quoteData, swapConfig) as `0x${string}`;

      setChatHistory(prev => [...prev, {
        content: `Transaction submitted: ${txHash}`,
        isBot: true,
        status: 'complete'
      }]);

      const receipt = await waitForTransactionReceipt(config, { hash: txHash });

      setChatHistory(prev => [...prev, {
        content: `Confirmed in block ${receipt.blockNumber}`,
        isBot: true,
        status: 'complete'
      }]);
    } catch (error) {
      handleSwapError(error);
    } finally {
      setIsSwapping(false);
    }
  };

  const handleSwapError = (error: unknown) => {
    const err = error instanceof Error ? error : new Error("Swap failed");
    setInputError(err.message);
    setChatHistory(prev => [...prev, {
      content: err.message,
      isBot: true,
      status: 'complete'
    }]);
  };

  return (
    <main className="flex flex-col h-screen bg-gray-900">
      <AIHeader />
      
      <div className="flex-1 flex gap-6 p-4">
        {isConnected && (
          <div className="w-80 bg-gray-800/50 rounded-xl p-4 backdrop-blur-lg h-fit">
            <PortfolioDashboard portfolio={portfolio} metrics={metrics} />
            <button
              onClick={() => handleRestart()}
              className="w-full mt-4 bg-purple-600 hover:bg-purple-700 p-3 rounded-lg flex items-center justify-center gap-2"
            >
              <BotMessageSquare size={18} />
              New Chat
            </button>
            {selectedToken && (
              <button
                onClick={() => selectedToken && handleAnalysis(selectedToken.symbol)}
                className="w-full mt-4 bg-purple-600 hover:bg-purple-700 p-3 rounded-lg flex items-center justify-center gap-2"
                disabled={!selectedToken}
              >
                <BotMessageSquare size={18} />
                Analyze {selectedToken.symbol} Market
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                
              </button>
            )}
          </div>
        )}

        <div className="flex-1 max-w-2xl bg-gray-800/50 rounded-xl backdrop-blur-lg h-[calc(100vh-8rem)] overflow-hidden">
          <div className="p-4 space-y-6 h-full flex flex-col">
            <div className="space-y-4 flex-1 overflow-y-auto">
              {!isConnected ? (
                <div className="text-center text-white mb-4">
                  <p>Please connect your wallet to continue.</p>
                  <ConnectButton />
                </div>
              ) : (
                <>
                  {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex gap-3 ${msg.isBot ? 'items-start' : 'items-end'}`}>
                      <div className={`p-2 rounded-full ${msg.isBot ? 'bg-blue-500' : 'bg-purple-500'}`}>
                        {msg.isBot ? (
                          <BotMessageSquare className="w-5 h-5 text-white" />
                        ) : (
                          <UserRound className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className={`max-w-[85%] p-4 rounded-xl ${
                        msg.isBot ? 'bg-gray-700' : 'bg-purple-700'
                      }`}>
                        {msg.content}
                        {msg.status === 'loading' && (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin inline-block" />
                        )}
                        {msg.actions && (
                          <div className="mt-2 flex gap-2">
                            {msg.actions.map((action, idx) => (
                              <button
                                key={idx}
                                onClick={action.onClick}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-lg"
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {flowStep === 'token_selection' && (
              <div className="grid grid-cols-2 gap-3">
                {getChainTokens(chain?.id || 146).map(token => (
                  <button
                    key={token.address}
                    onClick={() => {
                      setSelectedToken(token);
                      setFlowStep('action_selection');
                      setChatHistory(prev => [...prev, {
                        content: `Selected ${token.symbol}`,
                        isBot: false
                      }, {
                        content: `What would you like to do with ${token.symbol}?`,
                        isBot: true,
                        status: 'complete'
                      }]);
                    }}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-3 transition-all"
                  >
                    <CoinsIcon className="w-6 h-6 text-yellow-400" />
                    <div className="text-left">
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-sm text-gray-400">
                        Balance: {ethers.formatUnits(
                          token.isNative ? balances.native : balances.tokens[token.address] || BigInt(0),
                          token.decimals
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {flowStep === 'action_selection' && (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => handleActionSelect('buy')}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
                >
                  <ArrowUp className="w-5 h-5" />
                  Buy Token
                </button>
                <button
                  onClick={() => handleActionSelect('sell')}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
                >
                  <ArrowDown className="w-5 h-5" />
                  Sell Token
                </button>
              </div>
            )}

            {flowStep === 'amount_input' && selectedToken && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm px-2">
                  <span className="text-gray-400">Available Balance</span>
                  <span className="font-mono">
                    {ethers.formatUnits(
                      swapAction === 'sell' ? 
                        balances.tokens[selectedToken.address] || BigInt(0) : 
                        balances.native,
                      swapAction === 'sell' ? 
                        selectedToken.decimals : 
                        nativeToken.decimals
                    )} {swapAction === 'sell' ? selectedToken.symbol : nativeToken.symbol}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Enter ${swapAction === 'sell' ? selectedToken.symbol : nativeToken.symbol} amount`}
                    className="w-full p-4 bg-gray-700 rounded-lg pr-28 focus:ring-2 focus:ring-purple-500"
                    step="any"
                  />
                  <div className="absolute right-4 top-4 flex gap-2">
                    <button
                      onClick={() => {
                        const maxBalance = swapAction === 'sell'
                          ? ethers.formatUnits(balances.tokens[selectedToken.address] || BigInt(0), selectedToken.decimals)
                          : ethers.formatUnits(balances.native, nativeToken.decimals);
                        setAmount(maxBalance);
                      }}
                      className="px-3 py-1.5 text-sm bg-gray-600 rounded-lg hover:bg-gray-500"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFlowStep('action_selection')}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSwap}
                    disabled={!amount}
                    className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {flowStep === 'confirmation' && quoteData && (
              <div className="space-y-6">
                <SwapPreviewCard preview={preview} />
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFlowStep('amount_input')}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    ← Adjust Amount
                  </button>
                  <button
                    onClick={executeSwap}
                    disabled={isSwapping}
                    className="p-3 bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSwapping ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Confirm Transaction
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}