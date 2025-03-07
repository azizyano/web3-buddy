// components/SwapPreviewCard.tsx
"use client";

import { SwapPreview } from "@/types/type";
import { Progress } from "@/components/ui/progress";
import { useAIContext } from "@/contexts/AIContext";
import { ArrowRight, PuzzleIcon, ChevronRight } from "lucide-react";
import { formatEther } from "ethers";

const RISK_COLORS = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444"
};

export default function SwapPreviewCard({ preview }: { preview: SwapPreview }) {
  const { modeConfig } = useAIContext();
  console.log('preview', preview);

  return (
    <div 
      className="p-4 border rounded-xl relative overflow-hidden"
      style={{
        borderColor: RISK_COLORS[preview.riskLevel],
        background: `linear-gradient(45deg, ${modeConfig.color}10, transparent)`
      }}
    >
      {/* Risk Ribbon */}
      <div 
        className="absolute top-0 right-0 px-3 py-1 text-xs font-medium rounded-bl-lg"
        style={{ backgroundColor: RISK_COLORS[preview.riskLevel] }}
      >
        {preview.riskLevel.toUpperCase()} RISK
      </div>

      <div className="space-y-3">
        {/* Main Swap */}
        <div className="flex items-center justify-between font-mono">
          <span>-{preview.fromAmount.toFixed(4)}</span>
          <ArrowRight className="mx-2 text-gray-400" />
          <span>+{formatEther(preview.toAmount)}</span>
        </div>

        {/* Progress Indicators */}
        <div className="space-y-2">
          <div className="text-sm">
            Price Impact: {preview.priceImpact.toFixed(2)}%
            <Progress 
              value={Math.abs(preview.priceImpact)} 
              className="h-1 mt-1"
              indicatorColor={RISK_COLORS[preview.riskLevel]}
            />
          </div>

          <div className="text-sm">
            Slippage Tolerance: {preview.slippage.toFixed(1)}%
            <Progress 
              value={preview.slippage} 
              className="h-1 mt-1"
              indicatorColor={modeConfig.color}
            />
          </div>
        </div>

        {/* Route Visualization */}
        <div className="flex items-center gap-1 text-xs text-gray-400 flex-wrap">
          {preview.route.map((token, i) => (
            <PuzzleIcon key={token}>
              <span>{token}</span>
              {i < preview.route.length - 1 && <ChevronRight className="w-3 h-3" />}
            </PuzzleIcon>
          ))}
        </div>
      </div>
    </div>
  );
}