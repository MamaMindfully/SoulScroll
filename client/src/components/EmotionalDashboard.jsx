import { useState, useEffect } from 'react'
import EmotionPulseGraph from './EmotionPulseGraph'
import InnerCompass from './InnerCompass'

export default function EmotionalDashboard() {
  const [emotionData, setEmotionData] = useState([])
  const [memoryInsight, setMemoryInsight] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch emotion timeline data
    fetch('/api/emotion-history')
      .then(res => res.json())
      .then(data => {
        const formattedData = data.map(entry => ({
          date: new Date(entry.createdAt).toLocaleDateString(),
          emotion_score: entry.emotionScore || 50
        }))
        setEmotionData(formattedData)
      })
      .catch(err => {
        console.error('Error fetching emotion data:', err)
        // Fallback data for development
        setEmotionData([
          { date: '12/18', emotion_score: 65 },
          { date: '12/19', emotion_score: 72 },
          { date: '12/20', emotion_score: 58 },
          { date: '12/21', emotion_score: 81 },
          { date: '12/22', emotion_score: 69 }
        ])
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
      {/* Emotional Pulse Timeline */}
      <EmotionPulseGraph data={emotionData} />
      
      {/* Inner Compass */}
      <InnerCompass />
      
      {/* Memory Loop Insight */}
      {memoryInsight && (
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 text-white p-4 rounded-xl">
          <h3 className="text-lg font-semibold mb-2">30 Days Ago...</h3>
          <p className="text-purple-200 italic">{memoryInsight}</p>
          <p className="text-xs text-purple-300 mt-2">Reflection on your past self</p>
        </div>
      )}
    </div>
  )
}