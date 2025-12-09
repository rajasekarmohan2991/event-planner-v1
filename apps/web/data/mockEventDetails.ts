export type TicketTier = { name: string; price: number; currency: string }

export type EventDetails = {
  id: string
  title: string
  subtitle?: string
  city: string
  description: string
  bannerUrl: string
  dateLabel: string
  venue: string
  address: string
  priceLabel?: string
  tags?: string[]
  tiers?: TicketTier[]
}

// Minimal mock to satisfy the Event Details page build
export const mockEventDetails: Record<string, EventDetails> = {
  "1": {
    id: "1",
    title: "Tech Meetup 2025",
    subtitle: "Learn • Network • Build",
    city: "Chennai",
    description:
      "Join developers, designers, and founders for a day of lightning talks and networking.",
    bannerUrl:
      "https://images.unsplash.com/photo-1515168833906-d2a3b82b302a?q=80&w=1200&auto=format&fit=crop",
    dateLabel: "Sat, 4 Oct • 10:00 AM",
    venue: "Tidel Park",
    address: "Taramani, Chennai",
    priceLabel: "₹499",
    tags: ["Tech", "Meetup", "Networking"],
    tiers: [
      { name: "General", price: 499, currency: "INR" },
      { name: "VIP", price: 1299, currency: "INR" },
    ],
  },
  "2": {
    id: "2",
    title: "Indie Music Night",
    city: "Bengaluru",
    description: "Experience live indie bands and a vibrant crowd.",
    bannerUrl:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop",
    dateLabel: "Sun, 5 Oct • 7:00 PM",
    venue: "Indiranagar Club",
    address: "Indiranagar, Bengaluru",
    priceLabel: "₹799",
    tags: ["Music", "Live"],
    tiers: [{ name: "General", price: 799, currency: "INR" }],
  },
}
