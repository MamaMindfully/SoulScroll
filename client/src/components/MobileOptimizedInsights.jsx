import { useState } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { ChevronDown, ChevronUp, BarChart3, Brain, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileOptimizedInsights({ insights = [] }) {
  const isMobile = useIsMobile();
  const [expandedInsight, setExpandedInsight] = useState(null);
  
  if (!insights.length) return null;

  const toggleExpanded = (index) => {
    setExpandedInsight(expandedInsight === index ? null : index);
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'emotional':
        return <Heart className="w-5 h-5 text-pink-400" />;
      case 'behavioral':
        return <BarChart3 className="w-5 h-5 text-blue-400" />;
      default:
        return <Brain className="w-5 h-5 text-purple-400" />;
    }
  };

  // Mobile view: Collapsible cards
  if (isMobile) {
    return (
      <div className="space-y-3">
        <h3 className="text-white font-semibold mb-4">Your Insights</h3>
        <div className="max-h-[50vh] overflow-y-auto space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="bg-black/40 rounded-lg border border-gray-700/50">
              {/* Summary card */}
              <button
                onClick={() => toggleExpanded(index)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  {getInsightIcon(insight.type)}
                  <div>
                    <h4 className="text-white font-medium text-sm">
                      {insight.title || insight.summary}
                    </h4>
                    <p className="text-gray-400 text-xs">
                      {insight.category || 'Personal insight'}
                    </p>
                  </div>
                </div>
                {expandedInsight === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {expandedInsight === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 border-t border-gray-700/30">
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {insight.content || insight.description}
                      </p>
                      {insight.recommendation && (
                        <div className="mt-3 p-3 bg-indigo-900/20 rounded-lg">
                          <p className="text-indigo-300 text-xs font-medium mb-1">
                            Suggestion:
                          </p>
                          <p className="text-indigo-200 text-sm">
                            {insight.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Desktop view: Full cards
  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold mb-4">Your Insights</h3>
      <div className="grid gap-4">
        {insights.map((insight, index) => (
          <div key={index} className="bg-black/40 rounded-lg p-6 border border-gray-700/50">
            <div className="flex items-start gap-3 mb-3">
              {getInsightIcon(insight.type)}
              <div className="flex-1">
                <h4 className="text-white font-medium mb-2">
                  {insight.title || insight.summary}
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  {insight.content || insight.description}
                </p>
                {insight.recommendation && (
                  <div className="mt-4 p-4 bg-indigo-900/20 rounded-lg">
                    <p className="text-indigo-300 text-sm font-medium mb-1">
                      Suggestion:
                    </p>
                    <p className="text-indigo-200">
                      {insight.recommendation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}