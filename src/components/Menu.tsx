import { motion } from 'motion/react';
import { Play, Settings, Info } from 'lucide-react';

interface MenuProps {
  onStart: () => void;
  onSelectLevel: (level: number) => void;
  onShowInfo: () => void;
}

export default function Menu({ onStart, onSelectLevel, onShowInfo }: MenuProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center z-10"
      >
        <h1 className="text-8xl font-black tracking-tighter uppercase mb-2 text-white">
          Shadow <span className="text-yellow-500">Steps</span>
        </h1>
        <p className="text-gray-500 tracking-[0.3em] uppercase text-xs mb-12">
          Light is the enemy. Darkness is the path.
        </p>

        <div className="flex flex-col gap-8 items-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="group relative px-12 py-4 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            <span className="relative z-10 flex items-center gap-2 uppercase tracking-widest">
              <Play className="w-4 h-4 fill-current" />
              Begin Journey
            </span>
          </motion.button>

          <div className="flex flex-col items-center gap-4">
            <span className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-bold">Select Level</span>
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((lvl) => (
                <motion.button
                  key={lvl}
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onSelectLevel(lvl)}
                  className="w-12 h-12 flex items-center justify-center border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors font-black italic text-lg"
                >
                  0{lvl}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <button 
              onClick={onShowInfo}
              className="p-3 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Footer Instructions */}
      <div className="absolute bottom-12 left-0 w-full flex justify-center gap-12 text-[10px] uppercase tracking-[0.2em] text-gray-600">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 border border-gray-800 rounded">WASD</span>
          <span>Move (4 Directions)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 border border-gray-800 rounded">Mouse</span>
          <span>Drag Lamp</span>
        </div>
      </div>
    </div>
  );
}
