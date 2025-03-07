// contexts/TooltipContext.tsx
"use client";

import { createContext, useState } from "react";
import { useContext } from "react";

interface TooltipContextType {
  activeTerm: string | null;
  setActiveTerm: (term: string | null) => void;
}

export const TooltipContext = createContext<TooltipContextType>({
  activeTerm: null,
  setActiveTerm: () => {}
});

export const useTooltipContext = () => {
    const context = useContext(TooltipContext);
    if (!context) {
      throw new Error("useTooltipContext must be used within AIContextProvider");
    }
    return context;
  };

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  const [activeTerm, setActiveTerm] = useState<string | null>(null);

  return (
    <TooltipContext.Provider value={{ activeTerm, setActiveTerm }}>
      {children}
    </TooltipContext.Provider>
  );
}
