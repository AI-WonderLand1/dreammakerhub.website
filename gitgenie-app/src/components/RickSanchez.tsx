import { motion } from 'motion/react';

export function RickSanchez({ message }: { message?: string }) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Rick's Head (Stylized) */}
      <motion.div 
        className="w-16 h-16 bg-blue-100 rounded-full border-2 border-black relative"
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {/* Hair */}
        <div className="absolute -top-4 left-1 w-14 h-8 bg-blue-100 rounded-t-full" />
        {/* Eyes */}
        <div className="absolute top-4 left-3 w-4 h-4 bg-white rounded-full border border-black" />
        <div className="absolute top-4 right-3 w-4 h-4 bg-white rounded-full border border-black" />
      </motion.div>

      {/* Speech Bubble */}
      {message && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-20 left-20 bg-white text-black p-4 rounded-2xl shadow-xl max-w-[200px]"
        >
          {message}
          <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white rotate-45" />
        </motion.div>
      )}
    </div>
  );
}
