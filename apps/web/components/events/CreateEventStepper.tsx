'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EventStepper } from './EventStepper';

export function CreateEventStepper() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      // Build startsAt/endsAt ISO-8601 strings from date + time selections
      const toIso = (d: Date, hhmm: string) => {
        const [h, m] = hhmm.split(':').map((v: string) => parseInt(v, 10))
        const dt = new Date(d)
        dt.setHours(h || 0, m || 0, 0, 0)
        return dt.toISOString()
      }

      const startIso = data?.date ? toIso(new Date(data.date), data.startTime) : undefined
      const endBaseDate = data?.endDate ? new Date(data.endDate) : (data?.date ? new Date(data.date) : undefined)
      const endIso = endBaseDate ? toIso(endBaseDate, data.endTime) : undefined

      // Map to backend EventRequest fields
      const payload = {
        name: data.title,
        venue: data.venue,
        address: undefined,
        city: data.city,
        startsAt: startIso,
        endsAt: endIso,
        priceInr: undefined,
        description: data.description,
        bannerUrl: data.bannerImage || data.imageUrl || undefined,
        category: data.category,
        eventMode: (data.eventMode ? String(data.eventMode).toUpperCase() : 'IN_PERSON'),
        budgetInr: undefined,
        expectedAttendees: typeof data.capacity === 'number' ? data.capacity : undefined,
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create event');
      }

      const event = await response.json();
      toast.success('Event created successfully!');
      router.push(`/events/${event.id}`);
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast.error(error.message || 'Failed to create event');
    }
  };

  return <EventStepper onComplete={handleSubmit} />;
}
