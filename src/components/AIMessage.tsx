"use client";

import { useState, useEffect } from "react"; // Added imports
import { useAIContext } from "@/contexts/AIContext"; // Corrected import path
import { BotMessageSquare } from "lucide-react";

export default function AIMessage({ content }: { content: string }) {
  // Animation for message appearance
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const { modeConfig } = useAIContext();

  return (
    <div 
      className={`p-4 rounded-lg relative transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ 
        backgroundColor: `${modeConfig.color}10`,
        borderLeft: `4px solid ${modeConfig.color}`
      }}
    >
      <div className="flex gap-3">
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: modeConfig.color }}
        >
          <BotMessageSquare className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{content}</p>
          <div 
            className="text-xs mt-2 italic opacity-70 text-gray-400"
            style={{ color: modeConfig.color }}
          >
            {modeConfig.responseStyle === "technical" && "📊 Technical Analysis"}
            {modeConfig.responseStyle === "concise" && "⚡ Quick Trade Idea"}
            {modeConfig.responseStyle === "explanatory" && "📚 Educational Breakdown"}
          </div>
        </div>
      </div>
    </div>
  );
}
