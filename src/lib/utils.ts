import { ethers } from "ethers";
import { WHITELIST } from "@/config/tokens";

export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function validateChain(chainId: number) {
  if (chainId !== 146 && chainId !== 1) {
    throw new Error("Unsupported network. Please switch to Sonic or Ethereum");
  }
}

export function validateToken(tokenAddress: string) {
  if (!WHITELIST.some(t => t.address === tokenAddress)) {
    throw new Error("Token not whitelisted for trading");
  }
}

export function validateAmount(amount: string, balance: string, decimals: number) {
  const amountWei = ethers.parseUnits(amount, decimals);
  const balanceWei = ethers.parseUnits(balance, decimals);
  
  if (amountWei <= 0) throw new Error("Amount must be greater than 0");
  if (amountWei > balanceWei) throw new Error("Insufficient balance");
}

