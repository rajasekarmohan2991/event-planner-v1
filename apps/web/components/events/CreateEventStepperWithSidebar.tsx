'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { EventStepper } from './EventStepper';
import { ImageIcon } from 'lucide-react';

export function CreateEventStepperWithSidebar() {
  const router = useRouter();
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>('');

  const handleSubmit = async (data: any) => {
    try {
      console.log('📝 Form data received:', data);

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

      // Map to backend EventRequest fields (Java API EventRequest)
      const payload = {
        name: data.title || 'Untitled Event',
        venue: data.venue || 'TBD',
        address: data.address || undefined,
        city: data.city || 'Mumbai',
        startsAt: startIso || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endsAt: endIso || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        priceInr: data.generalPrice || data.price || 0,
        description: data.description || 'Event description',
        bannerUrl: data.bannerImage || data.imageUrl || undefined,
        category: (data.category ? String(data.category).toUpperCase() : 'CONFERENCE'),
        eventMode: (data.eventMode ? String(data.eventMode).toUpperCase() : 'IN_PERSON'),
        budgetInr: data.budget ? Number(data.budget) : undefined,
        expectedAttendees: data.capacity ? Number(data.capacity) : undefined,
        latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
        longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
        termsAndConditions: data.termsAndConditions || undefined,
        disclaimer: data.disclaimer || undefined,
        eventManagerName: data.eventManagerName || undefined,
        eventManagerContact: data.eventManagerContact || undefined,
        eventManagerEmail: data.eventManagerEmail || undefined,
      }

      console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));

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

      const result = await response.json();
      console.log('✅ Event created:', result);
      toast.success('Event created successfully!');

      // Persist ticket prices if provided
      try {
        const vipPrice = Number(data.vipPrice)
        const premiumPrice = Number(data.premiumPrice)
        const generalPrice = Number(data.generalPrice)
        if (!Number.isNaN(vipPrice) || !Number.isNaN(premiumPrice) || !Number.isNaN(generalPrice)) {
          await fetch(`/api/events/${result.id}/settings/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vipPrice: Number.isFinite(vipPrice) ? vipPrice : 0,
              premiumPrice: Number.isFinite(premiumPrice) ? premiumPrice : 0,
              generalPrice: Number.isFinite(generalPrice) ? generalPrice : 0,
            }),
          })
        }
      } catch (e) {
        console.warn('Failed to save ticket pricing for event', e)
      }

      // Persist seat counts if provided (used to prefill floor plan designer)
      try {
        const vipSeats = Number(data.vipSeats) || 0
        const premiumSeats = Number(data.premiumSeats) || 0
        const generalSeats = Number(data.generalSeats) || 0
        if (vipSeats + premiumSeats + generalSeats > 0) {
          await fetch(`/api/events/${result.id}/settings/seat-counts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vipSeats, premiumSeats, generalSeats }),
          })
        }
      } catch (e) {
        console.warn('Failed to save seat counts for event', e)
      }

      // Persist sessions if provided
      if (data.sessions && Array.isArray(data.sessions) && data.sessions.length > 0) {
        try {
          console.log(`📅 saving ${data.sessions.length} sessions...`);
          await Promise.all(
            data.sessions.map((session: any) =>
              fetch(`/api/events/${result.id}/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: session.title,
                  description: session.description,
                  startTime: new Date(session.startTime).toISOString(),
                  endTime: new Date(session.endTime).toISOString(),
                  room: session.room,
                  track: session.track,
                  capacity: session.capacity,
                  speakers: [], // Speakers not yet handled in basic wizard
                  addToCalendar: true
                }),
              })
            )
          );
          console.log('✅ Sessions saved');
        } catch (e) {
          console.error('Failed to save sessions', e);
          toast.error('Event created, but some sessions could not be saved.');
        }
      }

      router.push(`/events/${result.id}`);
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast.error(error.message || 'Failed to create event');
    }
  };

  // Callback to update banner image from stepper
  const handleFormDataChange = (data: any) => {
    // Extract banner image from media step (imageUrl field)
    if (data?.media?.imageUrl) {
      setBannerImage(data.media.imageUrl);
    }

    // Extract title from basic step
    if (data?.basic?.title) {
      setEventTitle(data.basic.title);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Form card */}
          <div className="rounded-2xl border bg-card text-card-foreground shadow-sm">
            <div className="border-b px-6 py-4">
              <h1 className="text-2xl font-semibold">Create Event</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Start creating your event by providing the basic details. You can edit everything later.
              </p>
            </div>
            <div className="px-6 py-6">
              <EventStepper
                onComplete={handleSubmit}
                onFormDataChange={handleFormDataChange}
              />
            </div>
          </div>

          {/* Side panel with image preview */}
          <aside className="hidden lg:block rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="sticky top-24 space-y-4">
              {/* Banner Preview */}
              <div className="relative h-32 rounded-xl overflow-hidden bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10">
                {bannerImage ? (
                  <img
                    src={bannerImage}
                    alt="Event banner preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Event Info */}
              <div>
                <h2 className="text-lg font-semibold">
                  {eventTitle || 'Create your event'}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {bannerImage
                    ? 'Upload more images and configure your event details in the form.'
                    : 'Provide event basics now and fill in more details later like tickets, schedule and speakers.'
                  }
                </p>
              </div>

              {/* Preview Status */}
              {bannerImage && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-green-600 dark:bg-green-500"></span>
                    Banner image uploaded successfully
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
