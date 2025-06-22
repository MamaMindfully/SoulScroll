import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'

export default function InnerCompass() {
  const { trackBehavior } = useUser()
  const [prompt, setPrompt] = useState(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch('/api/inner-compass')
      .then(res => res.json())
      .then(data => setPrompt(data.prompt))
      .catch(err => {
        console.error('Error fetching inner compass:', err)
        // Fallback prompt for development
        setPrompt({
          base: "What is your heart telling you right now that your mind might be overlooking?",
          deeper: "Sometimes our deepest wisdom comes not from thinking, but from feeling. What emotion is asking for your attention today?"
        })
      })
  }, [])

  if (!prompt) return null

  return (
    <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-xl">
      <p className="text-lg italic">{prompt.base}</p>
      {!expanded && (
        <button 
          onClick={() => {
            setExpanded(true)
            trackBehavior('tap_to_deepen', {
              promptType: 'inner_compass',
              timestamp: new Date().toISOString()
            })
          }} 
          className="mt-2 text-sm underline hover:text-indigo-200 transition-colors"
        >
          Tap to go deeper
        </button>
      )}
      {expanded && (
        <div className="mt-2">
          <p className="text-sm text-indigo-300">{prompt.deeper}</p>
          <button
            onClick={() => {
              setExpanded(false)
              trackBehavior('collapse_deeper_prompt', {
                promptType: 'inner_compass',
                timestamp: new Date().toISOString()
              })
            }}
            className="mt-2 text-xs text-indigo-400 underline"
          >
            Show less
          </button>
        </div>
      )}
    </div>
  )
}