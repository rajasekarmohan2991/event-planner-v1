'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { EventStepper } from './EventStepper';
import { ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Event type illustrations mapping
const EVENT_TYPE_IMAGES: Record<string, { image: string; fact: string; color: string }> = {
  'Conference': {
    image: '/event-types/conference.svg',
    fact: 'Professional conferences see 73% higher networking success rates',
    color: 'from-blue-500/15 via-indigo-500/15 to-purple-500/15'
  },
  'Workshop': {
    image: '/event-types/workshop.svg',
    fact: 'Hands-on workshops have 89% higher participant engagement',
    color: 'from-green-500/15 via-teal-500/15 to-cyan-500/15'
  },
  'Meetup': {
    image: '/event-types/meetup.svg',
    fact: 'Community meetups build 2x stronger professional relationships',
    color: 'from-orange-500/15 via-amber-500/15 to-yellow-500/15'
  },
  'Webinar': {
    image: '/event-types/webinar.svg',
    fact: 'Webinars reach 5x more attendees than in-person events',
    color: 'from-purple-500/15 via-pink-500/15 to-rose-500/15'
  },
  'Exhibition': {
    image: '/event-types/exhibition.svg',
    fact: 'Exhibitions generate 67% more qualified leads than other formats',
    color: 'from-red-500/15 via-pink-500/15 to-fuchsia-500/15'
  },
  'Concert': {
    image: '/event-types/concert.svg',
    fact: 'Live music events create unforgettable experiences for 94% of attendees',
    color: 'from-violet-500/15 via-purple-500/15 to-indigo-500/15'
  },
  'Festival': {
    image: '/event-types/festival.svg',
    fact: 'Festivals boost local economies by an average of $2.5M per event',
    color: 'from-pink-500/15 via-rose-500/15 to-red-500/15'
  },
  'Other': {
    image: '/event-types/other.svg',
    fact: 'Custom events allow for unlimited creativity and innovation',
    color: 'from-gray-500/15 via-slate-500/15 to-zinc-500/15'
  }
};

export function CreateEventStepperWithSidebar() {
  const router = useRouter();
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventType, setEventType] = useState<string>('');
  const [eventDescription, setEventDescription] = useState<string>('');
  const [aiOverview, setAiOverview] = useState<string>('');
  const [aiGoodToKnow, setAiGoodToKnow] = useState<string[]>([]);
  const [generatingAI, setGeneratingAI] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      console.log('📝 Form data received:', data);

      const toIso = (d: Date, hhmm: string) => {
        const [h, m] = hhmm.split(':').map((v: string) => parseInt(v, 10))
        const dt = new Date(d)
        dt.setHours(h || 0, m || 0, 0, 0)
        return dt.toISOString()
      }

      const startIso = data?.date ? toIso(new Date(data.date), data.startTime) : undefined
      const endBaseDate = data?.endDate ? new Date(data.endDate) : (data?.date ? new Date(data.date) : undefined)
      const endIso = endBaseDate ? toIso(endBaseDate, data.endTime) : undefined

      const payload = {
        name: data.title || 'Untitled Event',
        venue: data.venue || 'TBD',
        address: data.address || undefined,
        city: data.city || 'Mumbai',
        startsAt: startIso || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endsAt: endIso || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        priceInr: data.generalPrice || data.price || 0,
        // Temporary truncation until database migration is applied
        description: (aiOverview || data.description || 'Event description').substring(0, 250),
        bannerUrl: (data.bannerImage && !data.bannerImage.startsWith('data:')) ? data.bannerImage : undefined,
        category: (data.category ? String(data.category).toUpperCase() : 'CONFERENCE'),
        eventMode: (data.eventMode ? String(data.eventMode).toUpperCase() : 'IN_PERSON'),
        budgetInr: data.budget ? Number(data.budget) : undefined,
        expectedAttendees: data.capacity ? Number(data.capacity) : undefined,
        latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
        longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
        termsAndConditions: data.termsAndConditions?.substring(0, 250) || undefined,
        disclaimer: data.disclaimer?.substring(0, 250) || undefined,
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
                  speakers: [],
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

  const handleFormDataChange = (data: any) => {
    if (data?.media?.imageUrl) {
      setBannerImage(data.media.imageUrl);
    }

    if (data?.basic?.title) {
      setEventTitle(data.basic.title);
    }

    if (data?.basic?.type && data.basic.type !== eventType) {
      setEventType(data.basic.type);
    }

    if (data?.basic?.description) {
      setEventDescription(data.basic.description);
    }
  };

  const generateAIContent = async () => {
    if (!eventTitle || !eventType || !eventDescription) {
      toast.error('Please fill in title, type, and description first');
      return;
    }

    setGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/generate-event-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventTitle,
          type: eventType,
          description: eventDescription
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiOverview(data.overview);
        setAiGoodToKnow(data.goodToKnow || []);
        toast.success('AI content generated!');
      } else {
        toast.error('Failed to generate AI content');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Error generating AI content');
    } finally {
      setGeneratingAI(false);
    }
  };

  const selectedEventType = EVENT_TYPE_IMAGES[eventType] || EVENT_TYPE_IMAGES['Other'];

  return (
    <div className="min-h-[calc(100vh-8rem)] w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
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

          {/* Enhanced Side panel */}
          <aside className="hidden lg:block rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="sticky top-24 space-y-4">
              {/* Banner Preview */}
              <div className={`relative h-32 rounded-xl overflow-hidden bg-gradient-to-r ${selectedEventType.color}`}>
                {bannerImage ? (
                  <img
                    src={bannerImage}
                    alt="Event banner preview"
                    className="w-full h-full object-cover"
                  />
                ) : eventType ? (
                  <div className="flex items-center justify-center h-full p-4">
                    <div className="text-center">
                      <div className="text-4xl mb-2">{getEventEmoji(eventType)}</div>
                      <p className="text-xs font-medium text-muted-foreground">{eventType}</p>
                    </div>
                  </div>
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

              {/* Event Type Fact */}
              {eventType && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-900">
                  <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide mb-1">
                    DID YOU KNOW...
                  </p>
                  <p className="text-sm text-indigo-700 dark:text-indigo-400">
                    {selectedEventType.fact}
                  </p>
                </div>
              )}

              {/* AI Content Generation */}
              {eventTitle && eventType && eventDescription && !aiOverview && (
                <Button
                  onClick={generateAIContent}
                  disabled={generatingAI}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {generatingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate AI Overview
                    </>
                  )}
                </Button>
              )}

              {/* AI Generated Overview */}
              {aiOverview && (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <h3 className="font-semibold text-sm">Overview</h3>
                      <div className="ml-auto">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {aiOverview}
                    </p>
                  </div>

                  {/* Good to Know */}
                  {aiGoodToKnow.length > 0 && (
                    <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800">
                      <h3 className="font-semibold text-sm mb-3">Good to know</h3>
                      <div className="space-y-2">
                        {aiGoodToKnow.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 flex-shrink-0"></div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

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

function getEventEmoji(type: string): string {
  const emojis: Record<string, string> = {
    'Conference': '🎤',
    'Workshop': '🛠️',
    'Meetup': '🤝',
    'Webinar': '💻',
    'Exhibition': '🎨',
    'Concert': '🎵',
    'Festival': '🎉',
    'Other': '📅'
  };
  return emojis[type] || '📅';
}
