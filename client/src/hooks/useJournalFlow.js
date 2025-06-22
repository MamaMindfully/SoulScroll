import { useState } from 'react'

export function useJournalFlow() {
  const [status, setStatus] = useState('idle') // 'idle' | 'submitting' | 'processing' | 'done'
  const [insight, setInsight] = useState(null)

  const submitJournal = async (entryText) => {
    setStatus('submitting')
    const userId = localStorage.getItem('userId')

    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, entryText })
    })

    if (res.ok) {
      setStatus('processing')

      const poll = async () => {
        const statusRes = await fetch(`/api/insight-latest?userId=${userId}`)
        const data = await statusRes.json()
        if (data.insight) {
          setInsight(data.insight)
          setStatus('done')
        } else {
          setTimeout(poll, 3000)
        }
      }

      poll()
    } else {
      setStatus('idle')
    }
  }

  return { status, insight, submitJournal }
}