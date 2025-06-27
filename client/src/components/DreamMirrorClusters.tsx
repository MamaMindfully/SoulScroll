import React, { useEffect, useState } from 'react';
import { Loader2, Mirror, Sparkles2 } from 'lucide-react';

interface DreamMirrorClustersProps {
  userId: string;
}

interface ClusterResponse {
  clusters: string;
  reflectionCount: number;
  isEmpty?: boolean;
  fallback?: boolean;
}

export default function DreamMirrorClusters({ userId }: DreamMirrorClustersProps) {
  const [clusters, setClusters] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClusters = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/dream-mirror', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ userId })
        });

        if (!response.ok) {
          throw new Error(`Failed to generate clusters: ${response.statusText}`);
        }

        const data: ClusterResponse = await response.json();
        setClusters(data.clusters);

      } catch (err) {
        console.error('Dream Mirror error:', err);
        setError('Unable to generate dream mirror clusters at this time.');
        setClusters('Your reflections create patterns like constellations in the night sky. Each saved insight is a star in your personal universe of self-discovery.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchClusters();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-5 h-5 animate-spin text-purple-400 mr-2" />
        <span className="text-sm text-gray-400">Analyzing reflections...</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-lg p-4 border border-purple-500/20">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Mirror className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-medium text-purple-300 uppercase tracking-wide">
          Dream Mirror Clusters
        </span>
        <Sparkles2 className="w-3 h-3 text-purple-400" />
      </div>

      {/* Clusters Content */}
      <div className="text-sm text-gray-300 leading-relaxed">
        {error ? (
          <div className="text-red-400 text-xs italic">
            {error}
          </div>
        ) : (
          <div className="whitespace-pre-wrap">
            {clusters}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-purple-500/10">
        <p className="text-xs text-purple-400/70 italic">
          Patterns emerge from the depths of your saved reflections
        </p>
      </div>
    </div>
  );
}