import { motion } from 'framer-motion';
import { Sparkles, Quote } from 'lucide-react';
import InsightFeedback from './InsightFeedback';

export default function ArcResponse({ content, insightId, showFeedback = true }) {
  if (!content) return null;

  return (
    <motion.div
      className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-xl p-6 border border-indigo-500/30"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Arc Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          <motion.div
            className="absolute -inset-1 bg-indigo-400/20 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
        <div>
          <h3 className="text-white font-semibold">Arc's Reflection</h3>
          <p className="text-indigo-300 text-sm">Your AI guide for deeper insight</p>
        </div>
      </div>

      {/* Content with quote styling */}
      <div className="relative">
        <Quote className="absolute -top-2 -left-2 w-8 h-8 text-indigo-400/30" />
        <p className="text-white text-lg leading-relaxed pl-6 italic">
          {content}
        </p>
      </div>

      {/* Feedback section */}
      {showFeedback && insightId && (
        <InsightFeedback 
          insightId={insightId}
          insightType="arc_response"
        />
      )}

      {/* Arc signature */}
      <div className="mt-4 pt-4 border-t border-indigo-500/20">
        <p className="text-indigo-400/60 text-xs text-center">
          Generated with emotional intelligence by Arc
        </p>
      </div>
    </motion.div>
  );
}