import { useState, useEffect } from 'react'
import EmotionPulseGraph from './EmotionPulseGraph'
import InnerCompass from './InnerCompass'
import PersonalizedInsight from './PersonalizedInsight'
import SaveReflectionButton from './SaveReflectionButton'
import { useUser } from '@/hooks/useUser'

export default function EmotionalDashboard() {
  const { trackBehavior } = useUser()
  const [emotionData, setEmotionData] = useState([])
  const [memoryInsight, setMemoryInsight] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch emotion timeline data
    fetch('/api/emotion-history')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const formattedData = data.map(entry => ({
            date: new Date(entry.createdAt || entry.date).toLocaleDateString(),
            emotion_score: entry.emotionScore || entry.emotion_score || 50
          }))
          setEmotionData(formattedData)
        } else {
          // No data available - show empty state
          setEmotionData([])
        }
      })
      .catch(err => {
        console.error('Error fetching emotion data:', err)
        // Show empty state on error
        setEmotionData([])
      })

    // Fetch memory loop insight
    fetch('/api/memory-loop')
      .then(res => res.json())
      .then(data => {
        if (data.insight) {
          setMemoryInsight(data.insight)
        }
      })
      .catch(err => console.error('Error fetching memory insight:', err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    // Track dashboard view
    trackBehavior('view_emotional_dashboard', {
      timestamp: new Date().toISOString(),
      hasEmotionData: emotionData.length > 0,
      hasMemoryInsight: !!memoryInsight
    })
  }, [trackBehavior, emotionData.length, memoryInsight])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-gray-800 rounded-xl"></div>
        <div className="h-32 bg-gray-800 rounded-xl"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Personalized Daily Insight */}
      <PersonalizedInsight />
      
      {/* Emotional Pulse Timeline */}
      {emotionData.length > 0 ? (
        <EmotionPulseGraph data={emotionData} />
      ) : (
        <div className="w-full h-64 bg-black/80 rounded-xl p-4 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-white text-lg mb-2">Your Emotional Pulse</h2>
            <p className="text-gray-400">Start journaling to see your emotional patterns over time</p>
          </div>
        </div>
      )}
      
      {/* Inner Compass */}
      <InnerCompass />
      
      {/* Memory Loop Insight */}
      {memoryInsight && (
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 text-white p-4 rounded-xl">
          <h3 className="text-lg font-semibold mb-2">30 Days Ago...</h3>
          <p className="text-purple-200 italic">{memoryInsight}</p>
          <p className="text-xs text-purple-300 mt-2">Reflection on your past self</p>
          
          {/* Add save button for memory insights */}
          <div className="mt-3">
            <SaveReflectionButton 
              content={memoryInsight}
              source="memory_loop"
              type="reflection"
            />
          </div>
        </div>
      )}
    </div>
  )
}