// components/AIHeader.tsx
"use client";
//import { useContext } from "react";
import { useAccount } from "wagmi";
// import { AIMode } from "@/contexts/AIContext";
// import { AIContext } from "@/contexts/AIContext";

export default function AIHeader() {
  const { chain } = useAccount();
  //const { mode, setMode } = useContext(AIContext);

  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-800">
        
      {/* Left Side - Identity */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute -inset-2 bg-blue-500 rounded-full blur opacity-30 animate-pulse" />
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full" />
        </div>
        <div>
          <h2 className="font-semibold">Sonic Sage</h2>
          {/* <p className="text-sm text-gray-400 capitalize">{mode} mode</p> */}
        </div>
      </div>

      {/* Right Side - Status */}
      <div className="flex items-center gap-4">
        {/* <div className="flex gap-1 bg-gray-900 p-1 rounded-lg">
          {(["analyst", "trader", "educator"] as AIMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-md text-sm ${
                mode === m 
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-800/50"
              }`}
            >
              {m}
            </button>
          ))}
        </div> */}
        <div className="text-sm text-gray-400">
          {chain?.name} | Gas: 32 Gwei
        </div>
      </div>
    </header>
  );
}