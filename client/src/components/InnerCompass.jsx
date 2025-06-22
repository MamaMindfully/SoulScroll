import { useEffect, useState } from 'react'

export default function InnerCompass() {
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
        <button onClick={() => setExpanded(true)} className="mt-2 text-sm underline">Tap to go deeper</button>
      )}
      {expanded && <p className="mt-2 text-sm text-indigo-300">{prompt.deeper}</p>}
    </div>
  )
}