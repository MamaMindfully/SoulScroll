import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { Save, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SaveReflectionButton({ content, source = 'arc', type = 'insight' }) {
  const { user, trackBehavior } = useUser();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user || !content || loading) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/save-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, source, type })
      });

      if (response.ok) {
        setSaved(true);
        
        // Track save behavior
        trackBehavior('save_reflection', {
          source,
          type,
          contentLength: content.length,
          timestamp: new Date().toISOString()
        });
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSaved(false), 3000);
      } else {
        console.error('Failed to save reflection');
      }
    } catch (error) {
      console.error('Error saving reflection:', error);
    } finally {
      setLoading(false);
    }
  };

  if (saved) {
    return (
      <motion.div
        className="flex items-center gap-2 text-green-400 text-sm mt-3"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Check className="w-4 h-4" />
        Reflection saved to your archive
      </motion.div>
    );
  }

  return (
    <button
      onClick={handleSave}
      disabled={loading || !user}
      className="flex items-center gap-2 mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          Save to Reflections
        </>
      )}
    </button>
  );
}