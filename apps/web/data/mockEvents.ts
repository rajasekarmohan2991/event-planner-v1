import type { EventItem } from '@/components/EventCard'
import { DEFAULT_ANIMATION } from '@/lib/animations/animations'

const defaultDescription = 'Join us for an unforgettable experience packed with engaging sessions, networking, and entertainment.'

export const mockEvents: EventItem[] = [
  {
    id: '1',
    title: 'Strangers Meetup',
    description: defaultDescription,
    date: '2025-09-20',
    time: '14:30',
    venue: 'Halt, Chennai',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop',
    type: 'Social',
    capacity: 120,
    animationConfig: DEFAULT_ANIMATION
  },
  {
    id: '2',
    title: 'KALAKKI – Stage Play & Live Performance',
    description: defaultDescription,
    date: '2025-09-20',
    time: '18:00',
    venue: 'IDAM - The Art & Cultural Space, Chennai',
    image: 'https://images.unsplash.com/photo-1515168833906-d2a3b82b302a?q=80&w=1200&auto=format&fit=crop',
    type: 'Theater',
    capacity: 200,
    animationConfig: DEFAULT_ANIMATION
  },
  {
    id: '3',
    title: 'Collective Culture Festival ft. Ivan',
    description: defaultDescription,
    date: '2025-09-20',
    time: '20:00',
    venue: 'Leela Palace, Chennai',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
    type: 'Music',
    capacity: 500,
    animationConfig: DEFAULT_ANIMATION
  },
  {
    id: '4',
    title: 'Tech Conference 2025',
    description: defaultDescription,
    date: '2025-09-21',
    time: '09:00',
    venue: 'Chennai Trade Center, Chennai',
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1200&auto=format&fit=crop',
    type: 'Technology',
    capacity: 800,
    animationConfig: DEFAULT_ANIMATION
  },
  {
    id: '5',
    title: 'Food Festival',
    description: defaultDescription,
    date: '2025-09-20',
    time: '11:00',
    venue: 'Bessy Beach, Chennai',
    image: 'https://images.unsplash.com/photo-1504674900247-087703934569?q=80&w=1200&auto=format&fit=crop',
    type: 'Food',
    capacity: 1000,
    animationConfig: DEFAULT_ANIMATION
  },
  {
    id: '6',
    title: 'Startup Pitch Night',
    description: defaultDescription,
    date: '2025-09-19',
    time: '18:00',
    venue: 'T-Hub, Chennai',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1200&auto=format&fit=crop',
    type: 'Business',
    capacity: 300,
    animationConfig: DEFAULT_ANIMATION
  }
]
