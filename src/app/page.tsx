/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAccount, useBalance , useWalletClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Wallet,
  CheckCircle,
  Loader2,
  ArrowRight,
  BotMessageSquare,
  UserRound,
  NetworkIcon,
  CoinsIcon, AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getKyberQuote, createKyberSwap, parseKyberQuote } from "../lib/kyberswap";
import MarketData from "@/components/Wallet/MarketData";
import { Message } from "@/components/Chat/Message";
import { getChainTokens, getTokenBySymbol, TokenConfig } from "@/config/tokens";
import { QuoteDetails } from "@/components/Swap/QuoteDetails";
import { validateAmount } from "@/lib/utils";
import { waitForTransactionReceipt } from "@wagmi/core";
import {config} from "@/app/providers";
import { getCompleteMarketAnalysis } from "@/lib/market";

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
  const nativeToken = getChainTokens(chain? chain.id: 148 ).find(t => t.isNative)!;
  const provider = new ethers.JsonRpcProvider(
    chain?.id === 146 ? "https://rpc.soniclabs.com" : `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`
  );
  


  type MessageType = {
    content: string | React.ReactNode;
    isBot: boolean;
    status?: 'loading' | 'complete';
  };
  
  type FlowStep = 
    | 'connect'
    | 'token_selection'
    | 'action_selection'
    | 'amount_input'
    | 'confirmation';
  
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
  const [balance, setBalance] = useState<bigint >(BigInt(0));
  const [inputError, setInputError] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [balances, setBalances] = useState<{
    native: bigint;
    tokens: { [address: string]: bigint };
  }>({
    native: BigInt(0),
    tokens: {}
  });

  const fetchBalance = useBalance({ address: address ? address : '0x' });

  useEffect(() => {
    const fetchBalances = async () => {
      if (!address || !chain) return;
  
      // Fetch native balance
      const nativeBalance = await provider.getBalance(address);
      
      // Fetch token balances
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
      const interval = setInterval(fetchBalances, 15000);
      return () => clearInterval(interval);
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
    setBalance(fetchBalance.data?.value || BigInt(0));
    
  }, [isConnected, address, chain]);

  async function fetchTokenBalance(tokenAddress: string) {
  
    if (tokenAddress === ethers.ZeroAddress) {
      return fetchBalance.data?.value || BigInt(0);
    }
  
    const wethContract = new ethers.Contract(tokenAddress, ["function balanceOf(address) view returns (uint256)"], provider);
    return wethContract.balanceOf(address)
  }
  
  const handleSwapConfirmation = async () => {
    if (!quoteData || !walletClient || !address || !chain ||!selectedToken || !swapAction ) return;
  
    setChatHistory(prev => [...prev, {
      content: `Confirming ${swapAction} of ${amount} SONIC...`,
      isBot: false
    }]);

    const swapConfig = {
      chainId: chain.id,
      walletAddress: address,
      fromToken: swapAction === 'sell' ? selectedToken.address : nativeToken.address,
      toToken: swapAction === 'buy' ? selectedToken.address : nativeToken.address,
      amount
    };
    
    try {
      const txHash = await createKyberSwap(walletClient, quoteData.encodedSwapData, swapConfig );
      setChatHistory(prev => [...prev, {
        content: `Transaction successful! Hash: ${txHash}`,
        isBot: true,
        status: 'complete'
      }]);
    } catch (error) {
      const err = error as any 
      setChatHistory(prev => [...prev, {
        content: `Swap failed: ${err.message}`,
        isBot: true,
        status: 'complete'
      }]);
    }
  };

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
    const analysis = await getCompleteMarketAnalysis(chain?.id || 146, tokenSymbol);
    
    setChatHistory(prev => [...prev, {
      content: (
        <div className="p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-bold mb-2">🤖 AI Analysis</h3>
          <p className="mb-2">{analysis.advice}</p>
          <div className="flex gap-4 text-sm">
            <span>Confidence: {analysis.confidence}%</span>
           {/* <span>Risk: {analysis.riskAssessment}</span> */ }
          </div>
        </div>
      ),
      isBot: true,
      status: 'complete'
    }]);
  };

  const handleSwap = async () => {
    
    if (!amount || isNaN(Number(amount))) {
      throw new Error("Please enter a valid amount");
    }
    
    if (!selectedToken || !swapAction || !address || !chain) return;
    
    try {
      setInputError(null);
      
      
      const wrappedSonic = getChainTokens(chain.id).find(t => t.symbol === "WS")!;

    const swapConfig = {
      chainId: chain.id,
      walletAddress: address,
      fromToken: swapAction === 'sell' ? 
        selectedToken.address : 
        (selectedToken.isNative ? wrappedSonic.address : nativeToken.address),
      toToken: swapAction === 'buy' ? 
        selectedToken.address : 
        wrappedSonic.address,
      amount
    };
  
      // Validate balance
      const balance = await fetchTokenBalance(
        swapAction === 'sell' ? selectedToken.address : wrappedSonic.address
      );
      console.log(balance, swapConfig)
      validateAmount(
        amount, 
        ethers.formatUnits(balance, selectedToken.decimals),
        selectedToken.decimals
      );
  
      // Get and process quote
      const quote = await getKyberQuote(swapConfig);
      const parsedQuote = parseKyberQuote(quote, swapConfig.fromToken, swapConfig.toToken);
      console.log(parsedQuote, quote )
      
      setQuoteData({
        routeSummary: parsedQuote.routeSummary,
        formattedToAmount: parsedQuote.outputAmount,
        recommended_preset: parsedQuote.gasEstimate,
        encodedSwapData: parsedQuote.encodedSwapData,
        routerAddress: parsedQuote.routerAddress
      });
      setFlowStep('confirmation');
  
      setChatHistory(prev => [...prev, {
        content: <QuoteDetails quote={parsedQuote} />,
        isBot: true,
        status: 'complete'
      }, {
        content: "Review swap details and confirm",
        isBot: true,
        status: 'complete'
      }]);
  
    } catch (error) {
      const err= error as any
      setInputError(err.message);
      setChatHistory(prev => [...prev, {
        content: err.message,
        isBot: true,
        status: 'complete'
      }]);
    }
  };
  
  const executeSwap = async () => {
    if (!quoteData || !walletClient || !selectedToken || !chain || !address) return;
  
    try {
      setIsSwapping(true);
      const chainTokens = getChainTokens(chain.id);
      const nativeToken = chainTokens.find(t => t.isNative)!;
      const wrappedToken = chainTokens.find(t => t.symbol === "WS")!;
  
      // Sanitize token addresses: use wrapped token address instead of native address
      const fromTokenAddress = swapAction === 'sell' 
        ? selectedToken.address 
        : (nativeToken.address === ethers.ZeroAddress ? wrappedToken.address : nativeToken.address);
      const toTokenAddress = swapAction === 'buy' 
        ? selectedToken.address 
        : (nativeToken.address === ethers.ZeroAddress ? wrappedToken.address : nativeToken.address);
  
      const txHash = await createKyberSwap(
        walletClient,
        quoteData,
        {
          chainId: chain.id,
          walletAddress: address,
          fromToken: fromTokenAddress,
          toToken: toTokenAddress,
          amount
        }
      );
  
      setChatHistory(prev => [...prev, {
        content: `Transaction submitted: ${txHash}`,
        isBot: true,
        status: 'complete'
      }]);
  
      const receipt = await waitForTransactionReceipt(config,{ hash: txHash });
  
      setChatHistory(prev => [...prev, {
        content: `Confirmed in block ${receipt.blockNumber}`,
        isBot: true,
        status: 'complete'
      }]);
  
    } catch (error) {
      const err = error as Error;
      setChatHistory(prev => [...prev, {
        content: `Swap failed: ${err.message}`,
        isBot: true,
        status: 'complete'
      }]);
    } finally {
      setIsSwapping(false);
    }
  };

  
  return (
    <main className="flex flex-col h-screen bg-gradient-to-b from-gray-900 to-blue-900">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-4xl mx-auto">
            <button
              onClick={() => selectedToken && handleAnalysis(selectedToken.symbol)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center gap-2"
              disabled={!selectedToken}
            >
              <BotMessageSquare size={16} />
              Analyze Token
            </button>

            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Web3 AI Assistant
            </h1>
            <ConnectButton
              label="Connect Wallet"
              chainStatus="icon"
              showBalance={false}
              accountStatus="address"
            />
       

          {/* Wallet Info */}
          {isConnected && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-8">
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
              <div className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-lg">
                {/* Chat Messages */}
                {chatHistory.map((msg, index) => (
                  <Message key={index} isBot={msg.isBot}>
                    {msg.content}
                    {msg.status === 'loading' && (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin inline-block" />
                    )}
                  </Message>
                ))}
          
                {/* Token Selection */}
                {flowStep === 'token_selection' && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
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
                            content: `Would you like to Buy or Sell ${token.symbol}?`,
                            isBot: true,
                            status: 'complete'
                          }]);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg flex items-center gap-2 justify-center"
                      >
                        <CoinsIcon size={16} />
                        {/* In your token selection buttons */}
                        <div className="text-left">
                          <div className="font-medium">{token.symbol}</div>
                          <div className="text-xs opacity-75">
                            Balance: {ethers.formatUnits(
                              token.isNative 
                                ? balances.native 
                                : balances.tokens[token.address] || BigInt(0),
                              token.decimals
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
          
                

            {flowStep === 'amount_input' && selectedToken && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Available:</span>
                  <span className="font-mono">
                    {ethers.formatUnits(
                      swapAction === 'sell' 
                        ? balances.tokens[selectedToken.address] 
                        : balances.native,
                      swapAction === 'sell' 
                        ? selectedToken.decimals 
                        : nativeToken.decimals
                    )} {swapAction === 'sell' ? selectedToken.symbol : nativeToken.symbol}
                  </span>
                </div>

                {inputError && (
                  <div className="text-red-400 text-sm mt-2">
                    <AlertCircle className="inline mr-1 h-4 w-4" />
                    {inputError}
                  </div>
                )}

                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Enter ${swapAction === 'sell' ? selectedToken.symbol : nativeToken.symbol} amount`}
                    className="w-full p-3 bg-gray-700 rounded-lg pr-24"
                    step="any"
                  />
                  <div className="absolute right-3 top-3 flex gap-2">
                    <button
                      onClick={() => {
                        const maxBalance = swapAction === 'sell'
                          ? ethers.formatUnits(
                              balances.tokens[selectedToken.address], 
                              selectedToken.decimals
                            )
                          : ethers.formatUnits(balances.native, nativeToken.decimals);
                        setAmount(maxBalance);
                      }}
                      className="px-2 py-1 text-xs bg-gray-600 rounded hover:bg-gray-500"
                    >
                      MAX
                    </button>
                    <span className="text-gray-400">
                      {swapAction === 'sell' ? selectedToken.symbol : nativeToken.symbol}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFlowStep('action_selection')}
                    className="p-2 bg-gray-600 rounded-lg hover:bg-gray-500"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSwap}
                    disabled={!amount}
                    className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            
            {flowStep === 'confirmation' && quoteData && (
              <div className="mt-4 space-y-4">
                <QuoteDetails quote={quoteData} />
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFlowStep('amount_input')}
                    className="p-2 bg-gray-600 rounded-lg hover:bg-gray-500"
                  >
                    Back
                  </button>
                  <button
                    onClick={executeSwap}
                    disabled={isSwapping}
                    className="p-2 bg-green-600 rounded-lg hover:bg-green-500 disabled:opacity-50"
                  >
                    {isSwapping ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      'Confirm Swap'
                    )}
                  </button>
                </div>
              </div>
            )}

                {/* Action Selection */}
                {flowStep === 'action_selection' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleActionSelect('buy')}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => handleActionSelect('sell')}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
                    >
                      Sell
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

    </main>
  );
}
