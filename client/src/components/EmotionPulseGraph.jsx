import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function EmotionPulseGraph({ data }) {
  return (
    <div className="w-full h-64 bg-black/80 rounded-xl p-4">
      <h2 className="text-white text-lg mb-2">Your Emotional Pulse</h2>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#ccc" />
          <YAxis domain={[0, 100]} stroke="#ccc" />
          <Tooltip contentStyle={{ backgroundColor: '#1f1f1f', color: '#fff' }} />
          <Line type="monotone" dataKey="emotion_score" stroke="#8b5cf6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}