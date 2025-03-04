import { BotMessageSquare, UserRound } from "lucide-react";

export const Message = ({ isBot, children }: { isBot: boolean; children: React.ReactNode }) => (
  <div className={`flex gap-3 ${isBot ? 'items-start' : 'items-end'} mb-4`}>
    <div className={`p-2 rounded-full ${isBot ? 'bg-blue-500' : 'bg-purple-500'}`}>
      {isBot ? <BotMessageSquare size={20} /> : <UserRound size={20} />}
    </div>
    <div className={`max-w-[70%] p-4 rounded-xl ${
      isBot ? 'bg-gray-800 rounded-bl-none' : 'bg-purple-800 rounded-br-none'
    }`}>
      {children}
    </div>
  </div>
);