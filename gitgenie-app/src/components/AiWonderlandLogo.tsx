import { Flower, Sparkles } from 'lucide-react';

export function AiWonderlandLogo() {
  return (
    <div className="flex items-center gap-2 text-white">
      <div className="relative">
        <Flower className="w-8 h-8 text-pink-400 animate-[spin_10s_linear_infinite]" />
        <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
      </div>
      <span className="font-bold text-xl tracking-tighter">
        Ai <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-green-400">WonderLAND</span>
      </span>
    </div>
  );
}
