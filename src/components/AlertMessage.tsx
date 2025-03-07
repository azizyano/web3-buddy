// components/AlertMessage.tsx
"use client";

import { AlertMessage as AlertMessageType, AlertType } from "@/types/type";
import { ArrowUpRight, AlertTriangle, FuelIcon } from "lucide-react";

const AlertIcon = ({ type }: { type: AlertType }) => {
  const iconClass = "w-4 h-4 mr-2";
  
  switch(type) {
    case "market":
      return <ArrowUpRight className={`${iconClass} text-yellow-400`} />;
    case "security":
      return <AlertTriangle className={`${iconClass} text-red-400`} />;
    case "gas":
      return <FuelIcon className={`${iconClass} text-green-400`} />;
    default:
      return <AlertTriangle className={iconClass} />;
  }
};

export default function AlertMessage({ alert }: { alert: AlertMessageType }) {
  return (
    <div className="p-4 mb-4 border-l-4 border-yellow-400 bg-yellow-400/10 rounded-r-lg animate-fade-in">
      <div className="flex items-start">
        <AlertIcon type={alert.type} />
        <div className="flex-1">
          <p className="text-sm font-medium">{alert.content}</p>
          {alert.metadata?.token && (
            <div className="mt-2 flex gap-2">
              <button className="text-xs px-2 py-1 bg-yellow-400/20 rounded hover:bg-yellow-400/30">
                Adjust Position
              </button>
              <button className="text-xs px-2 py-1 bg-gray-800 rounded hover:bg-gray-700">
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}