import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const eventsFeed = [
  {
    id: 1,
    title: 'Tech Summit 2025',
    type: 'Conference',
    date: '2025-12-20',
    status: 'Upcoming',
  },
  {
    id: 2,
    title: 'Startup Expo',
    type: 'Exhibition',
    date: '2025-12-10',
    status: 'Completed',
  },
]

app.get('/api/feed', (req, res) => {
  res.json(eventsFeed)
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
