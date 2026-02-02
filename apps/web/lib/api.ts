const RAW_PUBLIC_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''
export const API_BASE_URL = RAW_PUBLIC_BASE
  ? `${RAW_PUBLIC_BASE.replace(/\/$/, '')}/api`
  : '/api'

export type ApiEvent = {
  id: number
  name: string
  startsAt: string
  endsAt: string
}

export type EventItem = {
  id: string
  title: string
  date: string
  location: string
  price: number
  image: string
  category: string
}

export async function fetchEvents(): Promise<EventItem[]> {
  // In a real app, this would be an API call to your backend
  // For now, we'll return mock data
  return [
    {
      id: '1',
      title: 'Tech Conference 2025',
      date: '2025-10-15T09:00:00',
      location: 'Bangalore',
      price: 2999,
      image: 'https://images.unsplash.com/photo-1505373877841-8d25f96d55dc?q=80&w=1200&auto=format&fit=crop',
      category: 'Conferences'
    },
    // Add more events as needed
  ];
}

export async function fetchEvent(id: string | number): Promise<ApiEvent> {
  const res = await fetch(`${API_BASE_URL}/events/${id}`, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Failed to fetch event: ${res.status}`)
  return res.json()
}
