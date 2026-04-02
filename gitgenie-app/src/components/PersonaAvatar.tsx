import { motion } from 'motion/react';
import { Beaker, Monitor, Cpu, Settings, FlaskConical, Zap } from 'lucide-react';

export type PersonaType = 'alice' | 'rick' | 'morty' | 'rick_and_morty';

export function PersonaAvatar({ persona, message, isWorking = false }: { persona: PersonaType, message?: string, isWorking?: boolean }) {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-48">
      {/* Background Elements */}
      <div className="absolute inset-0 flex items-end justify-center opacity-20 pointer-events-none">
        <div className="w-64 h-1 bg-white/50 rounded-full mb-4" /> {/* Desk */}
        {persona === 'alice' && (
          <>
            <Monitor className="absolute bottom-5 left-10 w-12 h-12 text-blue-400" />
            <Beaker className="absolute bottom-5 right-12 w-8 h-8 text-green-400" />
            <Cpu className="absolute top-10 right-10 w-16 h-16 text-purple-400 opacity-10" />
          </>
        )}
        {persona === 'rick' && (
          <>
            <FlaskConical className="absolute bottom-5 left-10 w-12 h-12 text-green-500" />
            <Zap className="absolute top-10 right-10 w-16 h-16 text-yellow-400 opacity-20" />
          </>
        )}
        {persona === 'morty' && (
          <>
            <Monitor className="absolute bottom-5 left-10 w-12 h-12 text-gray-400" />
          </>
        )}
        {persona === 'rick_and_morty' && (
          <>
            <FlaskConical className="absolute bottom-5 left-10 w-12 h-12 text-green-500" />
            <Monitor className="absolute bottom-5 right-10 w-12 h-12 text-gray-400" />
            <Zap className="absolute top-10 right-10 w-16 h-16 text-yellow-400 opacity-20" />
          </>
        )}
      </div>

      {/* Avatar */}
      <motion.div 
        className="relative z-10 flex flex-col items-center"
        animate={isWorking ? { x: [-5, 5, -5] } : { y: [0, -5, 0] }}
        transition={isWorking ? { repeat: Infinity, duration: 0.5, ease: "easeInOut" } : { repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        {persona === 'alice' && (
          <>
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
          </>
        )}

        {persona === 'rick' && (
          <div className="flex flex-col items-center">
            {/* Rick Hair */}
            <div className="relative w-24 h-12">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-16 bg-cyan-200 rounded-full blur-sm opacity-80" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-12 bg-cyan-300 rounded-full" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
            </div>
            {/* Rick Head */}
            <div className="w-16 h-20 bg-orange-100 rounded-[2rem] border-2 border-gray-800 flex flex-col items-center relative shadow-lg z-10">
              {/* Unibrow */}
              <div className="w-10 h-1 bg-cyan-600 mt-4 rounded-full opacity-80" />
              {/* Eyes */}
              <div className="flex gap-1 mt-1">
                <div className="w-5 h-5 bg-white rounded-full border border-gray-800 flex items-center justify-center">
                  <motion.div className="w-1 h-1 bg-black rounded-full" animate={isWorking ? { rotate: 360, x: [0, 1, -1, 0] } : {}} transition={{ repeat: Infinity, duration: 0.2 }} />
                </div>
                <div className="w-5 h-5 bg-white rounded-full border border-gray-800 flex items-center justify-center">
                  <motion.div className="w-1 h-1 bg-black rounded-full" animate={isWorking ? { rotate: -360, x: [0, -1, 1, 0] } : {}} transition={{ repeat: Infinity, duration: 0.2 }} />
                </div>
              </div>
              {/* Nose */}
              <div className="w-2 h-3 border-b-2 border-r-2 border-orange-200 rounded-br-lg mt-1" />
              {/* Mouth with drool */}
              <div className="mt-2 relative">
                <div className="w-8 h-1 bg-gray-800 rounded-full" />
                <div className="absolute -bottom-3 -right-1 w-2 h-4 bg-green-400 rounded-full opacity-80" />
              </div>
            </div>
            {/* Body */}
            <div className="w-20 h-16 bg-white rounded-t-3xl border-2 border-gray-800 mt-1 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-full flex justify-center">
                <div className="w-6 h-full bg-cyan-500" />
              </div>
            </div>
          </div>
        )}

        {persona === 'morty' && (
          <div className="flex flex-col items-center">
            {/* Morty Hair */}
            <div className="w-16 h-6 bg-yellow-700 rounded-t-full relative z-0 translate-y-2" />
            {/* Morty Head */}
            <div className="w-16 h-16 bg-orange-100 rounded-full border-2 border-gray-800 flex flex-col items-center relative shadow-lg z-10">
              {/* Eyes */}
              <div className="flex gap-2 mt-4">
                <div className="w-5 h-5 bg-white rounded-full border border-gray-800 flex items-center justify-center">
                  <motion.div className="w-1 h-1 bg-black rounded-full" animate={isWorking ? { scale: [1, 1.5, 1] } : {}} transition={{ repeat: Infinity, duration: 0.5 }} />
                </div>
                <div className="w-5 h-5 bg-white rounded-full border border-gray-800 flex items-center justify-center">
                  <motion.div className="w-1 h-1 bg-black rounded-full" animate={isWorking ? { scale: [1, 1.5, 1] } : {}} transition={{ repeat: Infinity, duration: 0.5 }} />
                </div>
              </div>
              {/* Nose */}
              <div className="w-1 h-1 bg-orange-200 rounded-full mt-1" />
              {/* Mouth */}
              <motion.div 
                className="w-4 h-2 border-b-2 border-gray-800 rounded-b-full mt-2"
                animate={isWorking ? { height: [8, 12, 8], width: [16, 20, 16] } : {}}
                transition={{ repeat: Infinity, duration: 0.3 }}
              />
            </div>
            {/* Body */}
            <div className="w-16 h-16 bg-yellow-400 rounded-t-3xl border-2 border-gray-800 mt-1" />
          </div>
        )}

        {persona === 'rick_and_morty' && (
          <div className="flex items-end gap-4">
            {/* Rick */}
            <div className="flex flex-col items-center scale-90 origin-bottom">
              {/* Rick Hair */}
              <div className="relative w-24 h-12">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-16 bg-cyan-200 rounded-full blur-sm opacity-80" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-12 bg-cyan-300 rounded-full" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
              </div>
              {/* Rick Head */}
              <div className="w-16 h-20 bg-orange-100 rounded-[2rem] border-2 border-gray-800 flex flex-col items-center relative shadow-lg z-10">
                {/* Unibrow */}
                <div className="w-10 h-1 bg-cyan-600 mt-4 rounded-full opacity-80" />
                {/* Eyes */}
                <div className="flex gap-1 mt-1">
                  <div className="w-5 h-5 bg-white rounded-full border border-gray-800 flex items-center justify-center">
                    <motion.div className="w-1 h-1 bg-black rounded-full" animate={isWorking ? { rotate: 360, x: [0, 1, -1, 0] } : {}} transition={{ repeat: Infinity, duration: 0.2 }} />
                  </div>
                  <div className="w-5 h-5 bg-white rounded-full border border-gray-800 flex items-center justify-center">
                    <motion.div className="w-1 h-1 bg-black rounded-full" animate={isWorking ? { rotate: -360, x: [0, -1, 1, 0] } : {}} transition={{ repeat: Infinity, duration: 0.2 }} />
                  </div>
                </div>
                {/* Nose */}
                <div className="w-2 h-3 border-b-2 border-r-2 border-orange-200 rounded-br-lg mt-1" />
                {/* Mouth with drool */}
                <div className="mt-2 relative">
                  <div className="w-8 h-1 bg-gray-800 rounded-full" />
                  <div className="absolute -bottom-3 -right-1 w-2 h-4 bg-green-400 rounded-full opacity-80" />
                </div>
              </div>
              {/* Body */}
              <div className="w-20 h-16 bg-white rounded-t-3xl border-2 border-gray-800 mt-1 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-full flex justify-center">
                  <div className="w-6 h-full bg-cyan-500" />
                </div>
              </div>
            </div>

            {/* Morty */}
            <div className="flex flex-col items-center scale-75 origin-bottom">
              {/* Morty Hair */}
              <div className="w-16 h-6 bg-yellow-700 rounded-t-full relative z-0 translate-y-2" />
              {/* Morty Head */}
              <div className="w-16 h-16 bg-orange-100 rounded-full border-2 border-gray-800 flex flex-col items-center relative shadow-lg z-10">
                {/* Eyes */}
                <div className="flex gap-2 mt-4">
                  <div className="w-5 h-5 bg-white rounded-full border border-gray-800 flex items-center justify-center">
                    <motion.div className="w-1 h-1 bg-black rounded-full" animate={isWorking ? { scale: [1, 1.5, 1] } : {}} transition={{ repeat: Infinity, duration: 0.5 }} />
                  </div>
                  <div className="w-5 h-5 bg-white rounded-full border border-gray-800 flex items-center justify-center">
                    <motion.div className="w-1 h-1 bg-black rounded-full" animate={isWorking ? { scale: [1, 1.5, 1] } : {}} transition={{ repeat: Infinity, duration: 0.5 }} />
                  </div>
                </div>
                {/* Nose */}
                <div className="w-1 h-1 bg-orange-200 rounded-full mt-1" />
                {/* Mouth */}
                <motion.div 
                  className="w-4 h-2 border-b-2 border-gray-800 rounded-b-full mt-2"
                  animate={isWorking ? { height: [8, 12, 8], width: [16, 20, 16] } : {}}
                  transition={{ repeat: Infinity, duration: 0.3 }}
                />
              </div>
              {/* Body */}
              <div className="w-16 h-16 bg-yellow-400 rounded-t-3xl border-2 border-gray-800 mt-1" />
            </div>
          </div>
        )}
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
