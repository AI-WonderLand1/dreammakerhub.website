import { motion } from 'motion/react';
import { Beaker, Monitor, Cpu, Settings } from 'lucide-react';

export function RobotAlice({ message, isWorking = false }: { message?: string, isWorking?: boolean }) {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-48">
      {/* Lab Background Elements */}
      <div className="absolute inset-0 flex items-end justify-center opacity-20 pointer-events-none">
        <div className="w-64 h-1 bg-white/50 rounded-full mb-4" /> {/* Desk */}
        <Monitor className="absolute bottom-5 left-10 w-12 h-12 text-blue-400" />
        <Beaker className="absolute bottom-5 right-12 w-8 h-8 text-green-400" />
        <Cpu className="absolute top-10 right-10 w-16 h-16 text-purple-400 opacity-10" />
      </div>

      {/* Robot Alice */}
      <motion.div 
        className="relative z-10 flex flex-col items-center"
        animate={isWorking ? { x: [-20, 20, -20] } : { y: [0, -5, 0] }}
        transition={isWorking ? { repeat: Infinity, duration: 3, ease: "easeInOut" } : { repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        {/* Antenna */}
        <div className="w-1 h-6 bg-gray-400 relative">
          <motion.div 
            className="absolute -top-2 -left-1 w-3 h-3 bg-red-500 rounded-full"
            animate={isWorking ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
            transition={{ repeat: Infinity, duration: 0.5 }}
          />
        </div>
        
        {/* Head */}
        <div className="w-16 h-14 bg-gray-200 rounded-2xl border-2 border-gray-400 flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          {/* Eyes */}
          <div className="flex gap-3">
            <motion.div 
              className="w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"
              animate={isWorking ? { scaleY: [1, 0.2, 1] } : { scaleY: [1, 1, 0.1, 1] }}
              transition={isWorking ? { repeat: Infinity, duration: 0.5 } : { repeat: Infinity, duration: 4, times: [0, 0.9, 0.95, 1] }}
            />
            <motion.div 
              className="w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"
              animate={isWorking ? { scaleY: [1, 0.2, 1] } : { scaleY: [1, 1, 0.1, 1] }}
              transition={isWorking ? { repeat: Infinity, duration: 0.5 } : { repeat: Infinity, duration: 4, times: [0, 0.9, 0.95, 1] }}
            />
          </div>
          {/* Mouth / Processing Indicator */}
          {isWorking && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              <motion.div className="w-1 h-1 bg-green-400 rounded-full" animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} />
              <motion.div className="w-1 h-1 bg-green-400 rounded-full" animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
              <motion.div className="w-1 h-1 bg-green-400 rounded-full" animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
            </div>
          )}
        </div>

        {/* Neck */}
        <div className="w-4 h-3 bg-gray-500" />

        {/* Body */}
        <div className="w-20 h-16 bg-gray-300 rounded-3xl border-2 border-gray-400 flex items-center justify-center relative shadow-lg">
          <motion.div 
            animate={isWorking ? { rotate: 360 } : { rotate: 0 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <Settings className={`w-8 h-8 ${isWorking ? 'text-blue-500' : 'text-gray-400'}`} />
          </motion.div>
        </div>
      </motion.div>

      {/* Speech Bubble */}
      {message && !isWorking && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute top-0 right-0 md:right-10 bg-white/10 backdrop-blur-md border border-white/20 text-white p-4 rounded-2xl shadow-xl max-w-[220px] text-sm z-20"
        >
          {message}
          <div className="absolute -bottom-2 left-8 w-4 h-4 bg-white/10 backdrop-blur-md border-b border-r border-white/20 rotate-45" />
        </motion.div>
      )}
    </div>
  );
}
