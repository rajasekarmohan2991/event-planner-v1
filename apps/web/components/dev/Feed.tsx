'use client'

import { useEffect, useState } from 'react'

interface Item {
  id: number
  title: string
  type: string
  date: string
  status: string
}

export default function Feed() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadFeed() {
      try {
        const res = await fetch('http://localhost:4000/api/feed')
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json()
        setItems(data)
      } catch (err: any) {
        console.error('Feed error:', err)
        setError(err?.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    loadFeed()
  }, [])

  if (loading) return <p>Loading feed...</p>
  if (error) return <p>Error: {error}</p>
  if (!items.length) return <p>No events in feed.</p>

  return (
    <div>
      <h2>Event Feed</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong> – {item.type} – {item.date} ({item.status})
          </li>
        ))}
      </ul>
    </div>
  )
}
