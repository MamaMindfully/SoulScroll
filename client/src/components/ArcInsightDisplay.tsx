import React, { useState } from 'react';
import SaveReflectionButton from './SaveReflectionButton';
import DreamMirrorClusters from './DreamMirrorClusters';
import { Sparkles, Eye } from 'lucide-react';

interface ArcInsightDisplayProps {
  insight: string;
  userId?: string;
  onSave?: () => void;
}

export default function ArcInsightDisplay({ insight, userId, onSave }: ArcInsightDisplayProps) {
  const [showClusters, setShowClusters] = useState(false);

  if (!userId || !insight) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-xl border border-gray-700 shadow-lg">
      {/* Arc Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <span className="text-sm font-medium text-purple-300">Arc Insight</span>
      </div>

      {/* Insight Content */}
      <div className="bg-black/30 rounded-lg p-4 mb-4 border border-gray-800">
        <p className="text-white leading-relaxed whitespace-pre-wrap">
          {insight}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <SaveReflectionButton 
          userId={userId || ''} 
          content={insight}
          onSave={onSave}
        />
        
        <button
          onClick={() => setShowClusters(!showClusters)}
          className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <Eye className="w-4 h-4" />
          {showClusters ? 'Hide' : 'View'} Dream Mirror
        </button>
      </div>

      {/* Dream Mirror Clusters */}
      {showClusters && userId && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <DreamMirrorClusters userId={userId} />
        </div>
      )}
    </div>
  );
}