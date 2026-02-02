import { redirect } from 'next/navigation'

export default function EventDayPage({ params }: { params: { id: string } }) {
  redirect(`/events/${params.id}/event-day/check-in`)
}
