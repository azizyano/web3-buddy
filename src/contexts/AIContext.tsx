/* eslint-disable @typescript-eslint/no-unused-vars */
// contexts/AIContext.tsx
"use client";
import { useContext } from "react";
import { createContext, useState } from "react";
import { AlertMessage, AIContextType, ModeConfig } from "@/types/type";

export type AIMode = "analyst" | "trader" | "educator";



export const AIContext = createContext<AIContextType>({} as AIContextType);

export const useAIContext = () => {
    const context = useContext(AIContext);
    if (!context) {
      throw new Error("useAIContext must be used within AIContextProvider");
    }
    return context;
  };

  const MODE_CONFIGS: Record<AIMode, ModeConfig> = {
    analyst: {
      responseStyle: "technical",
      defaultPrompt: "Provide detailed technical analysis with charts",
      color: "#6366f1" // Indigo
    },
    trader: {
      responseStyle: "concise",
      defaultPrompt: "Give clear trade recommendations with risk/reward ratios",
      color: "#10b981" // Emerald
    },
    educator: {
      responseStyle: "explanatory",
      defaultPrompt: "Explain concepts simply with analogies and examples",
      color: "#8b5cf6" // Purple
    }
  };

export function AIContextProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AIMode>("analyst");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);

  const modeConfig = MODE_CONFIGS[mode];

  
  const addAlert = (alert: Omit<AlertMessage, "timestamp">) => {
    setAlerts(prev => [...prev, { ...alert, timestamp: Date.now() }]);
  };

  const dismissAlert = (timestamp: number) => {
    setAlerts(prev => prev.filter(a => a.timestamp !== timestamp));
  };

  return (
    <AIContext.Provider value={{ mode, setMode, isActive, alerts, addAlert, dismissAlert, modeConfig  }}>
      {children}
    </AIContext.Provider>
  );
}
