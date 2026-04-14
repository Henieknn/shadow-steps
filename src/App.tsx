/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { GameState } from './game/types';
import GameView from './components/GameView';
import Menu from './components/Menu';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [gameKey, setGameKey] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const startGame = () => {
    setCurrentLevel(1);
    setGameKey(prev => prev + 1);
    setGameState('playing');
    setShowTutorial(true);
  };

  const retryLevel = () => {
    setGameKey(prev => prev + 1);
    setGameState('playing');
    // We don't show tutorial again on retry to keep it fast
    setShowTutorial(false);
  };

  const selectLevel = (level: number) => {
    setCurrentLevel(level);
    setGameKey(prev => prev + 1);
    setGameState('playing');
    setShowTutorial(true);
  };

  const nextLevel = () => {
    if (currentLevel >= 4) {
      setGameState('winPrototype');
      return;
    }
    setCurrentLevel(prev => prev + 1);
    setGameKey(prev => prev + 1);
    setGameState('playing');
    setShowTutorial(true);
  };

  const goToMenu = () => {
    setGameState('menu');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden selection:bg-yellow-500/30">
      <AnimatePresence mode="wait">
        {gameState === 'menu' ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen"
          >
            <Menu 
              onStart={startGame} 
              onSelectLevel={selectLevel} 
              onShowInfo={() => setShowInfo(true)}
            />
            
            {/* Info Dialog */}
            <AnimatePresence>
              {showInfo && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-3xl text-center"
                  >
                    <h3 className="text-2xl font-black italic uppercase mb-4">About the Game</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-8 uppercase tracking-wider">
                      Shadow Steps is a puzzle-stealth prototype where light is your enemy. 
                      Navigate through the shadows, manipulate your light source, and avoid 
                      deadly zones to reach the exit.
                    </p>
                    <button 
                      onClick={() => setShowInfo(false)}
                      className="w-full py-3 bg-white text-black font-bold rounded-full uppercase text-[10px] tracking-widest"
                    >
                      Close
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen relative"
          >
            <GameView 
              key={gameKey}
              level={currentLevel} 
              onBackToMenu={goToMenu}
              onWin={() => setGameState('win')}
              onGameOver={() => setGameState('gameOver')}
            />
            
            {/* Tutorial Overlay */}
            <AnimatePresence>
              {showTutorial && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                >
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="max-w-sm w-full bg-black border border-white/10 p-8 rounded-3xl text-center shadow-2xl"
                  >
                    <div className="text-yellow-500 mb-4 text-[10px] font-bold uppercase tracking-[0.3em]">New Mechanics</div>
                    <h3 className="text-2xl font-black italic uppercase mb-4">
                      {currentLevel === 1 && "The Basics"}
                      {currentLevel === 2 && "Hazard Zones"}
                      {currentLevel === 3 && "The Slot"}
                      {currentLevel === 4 && "Absolute Danger"}
                    </h3>
                    <p className="text-gray-400 text-xs leading-relaxed mb-8 uppercase tracking-widest">
                      {currentLevel === 1 && "Move with WASD. Drag the lamp with your mouse. Stay in the shadows to survive. Light is deadly."}
                      {currentLevel === 2 && "Yellow zones kill the character. Red zones kill the lamp. Navigate with extreme caution."}
                      {currentLevel === 3 && "Drag the lamp into the moving turquoise slot to lock it. Once locked, the yellow zone becomes safe darkness."}
                      {currentLevel === 4 && "Orange zones are fatal to BOTH the character and the lamp. There is no margin for error."}
                    </p>
                    <button 
                      onClick={() => setShowTutorial(false)}
                      className="w-full py-4 bg-white text-black font-bold rounded-full uppercase text-[10px] tracking-widest hover:bg-yellow-500 transition-colors"
                    >
                      Understood
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Overlays for Game Over / Win / Prototype Complete */}
            <AnimatePresence>
              {(gameState === 'gameOver' || gameState === 'win' || gameState === 'winPrototype') && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
                >
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className={cn(
                      "text-center p-12 border rounded-[2rem] bg-black/40 max-w-lg w-full mx-4",
                      gameState === 'gameOver' ? "border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]" : "border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.1)]"
                    )}
                  >
                    <h2 className={cn(
                      "text-5xl font-black mb-4 tracking-tighter uppercase italic",
                      gameState === 'gameOver' ? "text-red-500" : "text-green-500"
                    )}>
                      {gameState === 'gameOver' ? "Consumed" : (gameState === 'winPrototype' ? "Complete" : "Ascended")}
                    </h2>
                    <p className="text-gray-400 mb-12 text-sm uppercase tracking-widest leading-relaxed">
                      {gameState === 'gameOver' 
                        ? "The light has found you. Retreat to the shadows and try again." 
                        : (gameState === 'winPrototype' 
                            ? "You have completed the prototype. All levels mastered. Returning to menu." 
                            : "The void welcomes you. You have mastered the geometry of darkness.")}
                    </p>
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={gameState === 'winPrototype' ? goToMenu : (gameState === 'win' ? nextLevel : (gameState === 'gameOver' ? retryLevel : startGame))}
                        className={cn(
                          "w-full py-4 font-bold rounded-full transition-all uppercase tracking-[0.2em] text-xs",
                          gameState === 'gameOver' ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-500 text-white hover:bg-green-600"
                        )}
                      >
                        {gameState === 'gameOver' ? "Try Again" : (gameState === 'winPrototype' ? "Back to Menu" : "Continue")}
                      </button>
                      {gameState !== 'winPrototype' && (
                        <button 
                          onClick={goToMenu}
                          className="w-full py-4 border border-white/10 text-gray-500 font-bold rounded-full hover:bg-white/5 hover:text-white transition-all uppercase tracking-[0.2em] text-xs"
                        >
                          Return to Menu
                        </button>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

