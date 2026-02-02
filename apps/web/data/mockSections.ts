import type { EventItem } from '@/components/EventCard'
import { DEFAULT_ANIMATION } from '@/lib/animations/animations'

const defaultDescription = 'Experience an unforgettable gathering with music, food, and great company.'

const makeEvent = (partial: Partial<EventItem> & Pick<EventItem, 'id' | 'title'>): EventItem => ({
  description: defaultDescription,
  date: '2025-09-20',
  time: '19:00',
  venue: 'Chennai',
  image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=1200&auto=format&fit=crop',
  type: 'General',
  capacity: 150,
  animationConfig: DEFAULT_ANIMATION,
  ...partial,
})

export const popularNearYou: EventItem[] = [
  makeEvent({
    id: 'p1',
    title: 'Sunset Rooftop Music Night',
    date: '2025-09-19',
    time: '19:00',
    venue: 'Skyline Terrace, Chennai',
    image: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=1200&auto=format&fit=crop',
    type: 'Music',
  }),
  makeEvent({
    id: 'p2',
    title: 'Indie Film Screening',
    date: '2025-09-19',
    time: '20:30',
    venue: 'City Arts Hub, Chennai',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop',
    type: 'Film',
  }),
  makeEvent({
    id: 'p3',
    title: 'Food Truck Fiesta',
    date: '2025-09-20',
    time: '17:00',
    venue: 'Marina Square, Chennai',
    image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?q=80&w=1200&auto=format&fit=crop',
    type: 'Food',
  }),
]

export const thisWeekend: EventItem[] = [
  makeEvent({
    id: 'w1',
    title: 'Morning Yoga by the Beach',
    date: '2025-09-21',
    time: '06:30',
    venue: 'Elliot’s Beach, Chennai',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop',
    type: 'Wellness',
  }),
  makeEvent({
    id: 'w2',
    title: 'Startup Pitch Night',
    date: '2025-09-21',
    time: '16:00',
    venue: 'Tech Park Hall, Chennai',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
    type: 'Business',
  }),
  makeEvent({
    id: 'w3',
    title: 'Stand-up Comedy Open Mic',
    date: '2025-09-21',
    time: '20:00',
    venue: 'Laugh Lounge, Chennai',
    image: 'https://images.unsplash.com/photo-1485217988980-11786ced9454?q=80&w=1200&auto=format&fit=crop',
    type: 'Comedy',
  }),
]

export const categories = [
  { id: 'all', label: 'All' },
  { id: 'music', label: 'Music' },
  { id: 'theatre', label: 'Theatre' },
  { id: 'workshops', label: 'Workshops' },
  { id: 'sports', label: 'Sports' },
  { id: 'meetups', label: 'Meetups' },
  { id: 'kids', label: 'Kids' },
  { id: 'film', label: 'Film' },
  { id: 'food', label: 'Food' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'business', label: 'Business' },
  { id: 'comedy', label: 'Comedy' },
]
