// components/PortfolioDashboard.tsx
"use client";

import { PieChart, Pie, Cell } from "recharts";
import { useAIContext } from "@/contexts/AIContext";
import { PortfolioMetrics, PortfolioAsset } from "@/types/type";

const COLORS = ["#6366f1", "#10b981", "#8b5cf6", "#f59e0b"];

export default function PortfolioDashboard({ 
  portfolio,
  metrics 
}: {
  portfolio: PortfolioAsset[];
  metrics?: PortfolioMetrics;
}) {
  const { modeConfig } = useAIContext();

  return (
    <div className="p-4 bg-gray-800/50 rounded-xl">
      <div className="grid grid-cols-3 gap-4">
        {/* Risk Meter */}
        <div className="col-span-1">
          <div className="text-sm mb-2">Portfolio Risk</div>
          <div 
            className="h-24 w-24 rounded-full border-4 flex items-center justify-center mx-auto"
            style={{ 
              borderColor: modeConfig.color,
              boxShadow: `0 0 15px ${modeConfig.color}20`
            }}
          >
            <span className="text-2xl font-bold">{metrics?.riskScore || 0}</span>
          </div>
        </div>

        {/* Diversity Chart */}
        <div className="col-span-2">
          <PieChart width={200} height={150}>
            <Pie
              data={portfolio}
              cx={100}
              cy={75}
              innerRadius={40}
              outerRadius={60}
              paddingAngle={2}
              dataKey="allocation"
            >
              {portfolio.map((entry, index) => (
                <Cell 
                  key={index} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
          </PieChart>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
        <div className="p-2 bg-green-500/10 rounded">
          🚀 {metrics?.topPerformer || "-"} (Best)
        </div>
        <div className="p-2 bg-red-500/10 rounded">
          📉 {metrics?.worstPerformer || "-"} (Worst)
        </div>
      </div>
    </div>
  );
}