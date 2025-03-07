import { BotMessageSquare, UserRound } from "lucide-react";

export const Message = ({ isBot, children, timestamp }: { isBot: boolean; children: React.ReactNode; timestamp?: string }) => (
  <div className={`flex gap-3 ${isBot ? 'items-start' : 'items-end'} mb-4 hover:bg-gray-700 transition-colors duration-200`}>

    <div className={`p-2 rounded-full ${isBot ? 'bg-blue-500' : 'bg-purple-500'} flex items-center`}>
      {timestamp && <span className="text-xs text-gray-300 ml-2">{timestamp}</span>}

      {isBot ? <BotMessageSquare size={20} /> : <UserRound size={20} />}
    </div>
    <div className={`max-w-[70%] p-4 rounded-xl ${
      isBot ? 'bg-gray-800 rounded-bl-none' : 'bg-purple-800 rounded-br-none'
    }`}>
      {children}
    </div>
  </div>
);
