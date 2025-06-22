import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';

export default function JournalAwakening({ onAwaken }) {
  const { trackBehavior } = useUser();
  const [visible, setVisible] = useState(true);
  const [canSkip, setCanSkip] = useState(false);
  
  const greetings = [
    "Today begins where you choose to meet yourself.",
    "You are the space between silence and story.",
    "Let the page hold what the world cannot.",
    "You do not need to know. You need only to arrive.",
    "This moment is waiting for your truth.",
    "Your words have been gathering. Time to let them flow.",
    "The blank page knows your secrets before you do.",
    "Today, write from the place that remembers."
  ];

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  useEffect(() => {
    // Track awakening experience
    trackBehavior('journal_awakening_viewed', {
      greeting,
      timestamp: new Date().toISOString()
    });

    // Allow skipping after 3 seconds
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, 3000);

    // Auto-proceed after 7 seconds
    const proceedTimer = setTimeout(() => {
      handleAwaken();
    }, 7000);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(proceedTimer);
    };
  }, []);

  const handleAwaken = () => {
    setVisible(false);
    trackBehavior('journal_awakening_completed', {
      timeSpent: 7000,
      timestamp: new Date().toISOString()
    });
    onAwaken();
  };

  const handleSkip = () => {
    setVisible(false);
    trackBehavior('journal_awakening_skipped', {
      timeSpent: 3000,
      timestamp: new Date().toISOString()
    });
    onAwaken();
  };

  if (!visible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col items-center justify-center z-50 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Skip button */}
      {canSkip && (
        <motion.button
          onClick={handleSkip}
          className="absolute top-6 right-6 text-white/60 hover:text-white text-sm transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Skip →
        </motion.button>
      )}

      {/* Main greeting */}
      <motion.div
        className="text-center max-w-2xl"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        <h1 className="text-2xl md:text-4xl font-light mb-8 leading-relaxed">
          {greeting}
        </h1>
      </motion.div>

      {/* Breath guidance */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <BreathGuidance />
      </motion.div>

      {/* Soft continue hint */}
      <motion.p
        className="absolute bottom-8 text-white/40 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4 }}
      >
        Take this moment to arrive...
      </motion.p>
    </motion.div>
  );
}

function BreathGuidance() {
  const [phase, setPhase] = useState('Breathe in');
  const [scale, setScale] = useState(1);
  
  const phases = [
    { text: 'Breathe in', duration: 4000, scale: 1.2 },
    { text: 'Hold', duration: 2000, scale: 1.2 },
    { text: 'Breathe out', duration: 6000, scale: 0.8 },
    { text: 'Rest', duration: 2000, scale: 1 }
  ];

  useEffect(() => {
    let currentPhaseIndex = 0;
    
    const cycle = () => {
      const currentPhase = phases[currentPhaseIndex];
      setPhase(currentPhase.text);
      setScale(currentPhase.scale);
      
      setTimeout(() => {
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
        cycle();
      }, currentPhase.duration);
    };
    
    cycle();
  }, []);

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Breathing orb */}
      <motion.div
        className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400/30 to-purple-400/30 border border-indigo-400/40"
        animate={{ 
          scale,
          boxShadow: scale > 1 ? '0 0 30px rgba(99, 102, 241, 0.3)' : '0 0 10px rgba(99, 102, 241, 0.1)'
        }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
      
      {/* Breath instruction */}
      <motion.div
        className="text-xl font-light text-indigo-300"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {phase}
      </motion.div>
    </div>
  );
}