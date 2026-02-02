'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, ImageIcon, PlayCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMapLink } from '@/lib/geo/maps';
import { useToast } from '@/components/ui/use-toast';

// Schemas for each step
const basicInfoSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.string().min(1, 'Please select an event type'),
  category: z.string().min(1, 'Please select a category'),
  eventMode: z.enum(['IN_PERSON', 'VIRTUAL', 'HYBRID'], {
    required_error: 'Please select event mode',
  }),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
});

const sessionsSchema = z.object({
  sessions: z.array(z.object({
    title: z.string().min(1, 'Title is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    description: z.string().optional(),
    room: z.string().optional(),
    track: z.string().optional(),
    capacity: z.coerce.number().optional(),
  })).optional(),
});

const eventDetailsSchema = z.object({
  city: z.string().optional(), // Made optional, will validate conditionally
  venue: z.string().optional(), // Made optional, will validate conditionally
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const scheduleSchema = z.object({
  date: z.date({
    required_error: 'Please select a start date',
  }),
  endDate: z.date({
    required_error: 'Please select an end date',
  }).optional(),
  startTime: z.string().min(1, 'Please select a start time'),
  endTime: z.string().min(1, 'Please select an end time'),
  timezone: z.string().default('UTC'),
});

const mediaSchema = z.object({
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  vipPrice: z.coerce.number().min(0, 'VIP price must be 0 or greater').optional(),
  premiumPrice: z.coerce.number().min(0, 'Premium price must be 0 or greater').optional(),
  generalPrice: z.coerce.number().min(0, 'General price must be 0 or greater').optional(),
  vipSeats: z.coerce.number().min(0, 'VIP seats must be 0 or greater').optional(),
  premiumSeats: z.coerce.number().min(0, 'Premium seats must be 0 or greater').optional(),
  generalSeats: z.coerce.number().min(0, 'General seats must be 0 or greater').optional(),
});

// Types
type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;
type EventDetailsFormValues = z.infer<typeof eventDetailsSchema>;
type ScheduleFormValues = z.infer<typeof scheduleSchema>;
type MediaFormValues = z.infer<typeof mediaSchema>;

// Event type and category options
const eventTypes = [
  'Conference', 'Workshop', 'Meetup', 'Webinar', 'Exhibition', 'Concert', 'Festival', 'Other'
];

const categories = [
  'Business', 'Technology', 'Art', 'Music', 'Food', 'Sports', 'Health', 'Education', 'Other'
];

// Timezone options (simplified)
const timezones = [
  'UTC', 'PST', 'EST', 'CET', 'IST', 'JST', 'AEST'
];

// Time slots for dropdown
const timeSlots = Array.from({ length: 24 * 2 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? '00' : '30';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return {
    value: `${hours.toString().padStart(2, '0')}:${minutes}`,
    label: `${displayHours}:${minutes} ${ampm}`
  };
});

export function BasicInfoStep({ onSubmit, initialData }: { onSubmit: (data: any) => void, initialData: any }) {
  const form = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      title: '',
      description: '',
      type: '',
      category: '',
      eventMode: 'IN_PERSON',
      capacity: 50,
      ...initialData
    },
  });

  return (
    <Form {...form}>
      <form id="step-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter event title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell people what your event is about..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Event Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Type</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Event Mode */}
        <FormField
          control={form.control}
          name="eventMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Mode</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="IN_PERSON">In Person</SelectItem>
                    <SelectItem value="VIRTUAL">Virtual</SelectItem>
                    <SelectItem value="HYBRID">Hybrid (In Person + Virtual)</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">Choose how attendees will participate</p>
            </FormItem>
          )}
        />

        {/* Capacity */}
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Capacity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 100"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">This helps us suggest suitable venues</p>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

export function EventDetailsStep({ onSubmit, initialData }: { onSubmit: (data: any) => void, initialData: any }) {
  const form = useForm<EventDetailsFormValues>({
    resolver: zodResolver(eventDetailsSchema),
    defaultValues: {
      city: '',
      venue: '',
      latitude: undefined,
      longitude: undefined,
      ...initialData
    },
  });

  // Get event mode, type, category, and capacity from previous step
  const eventMode = initialData?.eventMode || 'IN_PERSON';
  const eventType = initialData?.type || '';
  const eventCategory = initialData?.category || '';
  const eventCapacity = initialData?.capacity || 50;

  // Determine if venue/city are required
  const isVirtual = eventMode === 'VIRTUAL';
  const requiresVenue = eventMode === 'IN_PERSON';

  // City autocomplete and venue suggestions
  const [cityQuery, setCityQuery] = useState<string>('');
  const [cityOptions, setCityOptions] = useState<Array<{ name: string; lat?: number; lon?: number }>>([]);
  const [venueOptions, setVenueOptions] = useState<Array<{ name: string; lat?: number; lon?: number }>>([]);
  const [venueQuery, setVenueQuery] = useState<string>('');
  const city = form.watch('city');

  // Custom validation and submission
  const handleFormSubmit = (data: EventDetailsFormValues) => {
    // For IN_PERSON events, venue and city are required
    if (requiresVenue) {
      if (!data.city || data.city.trim().length < 2) {
        form.setError('city', { message: 'City is required for in-person events' });
        return;
      }
      if (!data.venue || data.venue.trim().length < 3) {
        form.setError('venue', { message: 'Venue must be at least 3 characters for in-person events' });
        return;
      }
    }

    // For VIRTUAL events, clear venue/city data
    if (isVirtual) {
      data.city = undefined;
      data.venue = undefined;
      data.latitude = undefined;
      data.longitude = undefined;
    }

    onSubmit(data);
  };

  // Fetch city suggestions (debounced) - using mock data
  useEffect(() => {
    const q = cityQuery.trim();
    if (q.length < 2) { setCityOptions([]); return; }
    const t = setTimeout(async () => {
      try {
        const { getCityPredictions } = await import('@/lib/google-places');
        const predictions = await getCityPredictions(q);
        setCityOptions(
          predictions.map(p => ({ name: p.description, lat: 19.076, lon: 72.8777 })) // Default Mumbai coords
        );
      } catch { }
    }, 250);
    return () => clearTimeout(t);
  }, [cityQuery]);

  // Fetch venue suggestions for selected city - using OpenStreetMap with filters
  useEffect(() => {
    const c = (city || '').trim();
    if (!c) { setVenueOptions([]); return; }
    let aborted = false;
    const t = setTimeout(async () => {
      try {
        // Build query with event type, category, and capacity filters
        const params = new URLSearchParams({
          city: c,
          type: eventType.toLowerCase(),
          category: eventCategory.toLowerCase(),
          minCapacity: String(Math.floor(eventCapacity * 0.8)), // 80% of required
          maxCapacity: String(Math.ceil(eventCapacity * 1.5))   // 150% of required
        });

        const res = await fetch(`/api/venues/search?${params.toString()}`);
        if (!aborted && res.ok) {
          const data = await res.json();
          const venues = data.venues || [];

          // Sort by capacity match (closest to required capacity first)
          const sorted = venues.sort((a: any, b: any) => {
            const aDiff = Math.abs((a.capacity || 0) - eventCapacity);
            const bDiff = Math.abs((b.capacity || 0) - eventCapacity);
            return aDiff - bDiff;
          });

          setVenueOptions(
            sorted.map((v: any) => ({
              name: `${v.name}${v.capacity ? ` (Capacity: ${v.capacity})` : v.rooms ? ` (${v.rooms} rooms)` : ''}`,
              lat: v.lat,
              lon: v.lon,
              capacity: v.capacity,
              type: v.type,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch venues:', err);
        // Fallback to mock data if OSM fails
        try {
          const { getVenueSuggestions } = await import('@/lib/google-places');
          const venues = await getVenueSuggestions(c);
          if (!aborted) {
            setVenueOptions(venues.map(v => ({ name: v, lat: 19.076, lon: 72.8777 })));
          }
        } catch { }
      }
    }, 500); // Longer delay for API call
    return () => { aborted = true; clearTimeout(t); };
  }, [city, eventType, eventCategory, eventCapacity]);

  return (
    <Form {...form}>
      <form id="step-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Show event mode info */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="text-sm font-medium mb-2">Event Mode: <span className="text-primary">{eventMode === 'IN_PERSON' ? 'In Person' : eventMode === 'VIRTUAL' ? 'Virtual' : 'Hybrid'}</span></h3>
          {isVirtual && (
            <p className="text-xs text-muted-foreground">
              ✨ Virtual events don't require venue or city information
            </p>
          )}
        </div>

        {/* Only show venue/city for non-virtual events */}
        {!isVirtual && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* City with autocomplete */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City {requiresVenue && <span className="text-red-500">*</span>}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder="Type any city name (e.g., Auckland, London, Tokyo)..."
                        value={field.value || ''}
                        onChange={(e) => { field.onChange(e.target.value); setCityQuery(e.target.value); }}
                      />
                    </FormControl>
                    {cityOptions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md max-h-44 overflow-auto">
                        {cityOptions.map((opt, idx) => (
                          <button
                            key={`${opt.name}-${idx}`}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                            onClick={() => {
                              form.setValue('city', opt.name);
                              if (typeof opt.lat === 'number' && typeof opt.lon === 'number') {
                                form.setValue('latitude', opt.lat);
                                form.setValue('longitude', opt.lon);
                              }
                              setCityOptions([]);
                              setCityQuery('');
                            }}
                          >
                            {opt.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can type any city worldwide. Press Enter to use your typed city if no suggestions appear.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue {requiresVenue && <span className="text-red-500">*</span>}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input placeholder="Where is the event?" {...field} value={field.value || ''} onChange={(e) => { field.onChange(e); setVenueQuery(e.target.value); }} />
                    </FormControl>
                    {venueOptions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md max-h-44 overflow-auto">
                        {venueOptions.map((v, i) => (
                          <button
                            key={`${v.name}-${i}`}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                            onClick={() => {
                              form.setValue('venue', v.name)
                              if (typeof v.lat === 'number' && typeof v.lon === 'number') {
                                form.setValue('latitude', v.lat)
                                form.setValue('longitude', v.lon)
                              }
                              setVenueOptions([]);
                            }}
                          >
                            {v.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {form.watch('venue') &&
                    typeof form.watch('latitude') === 'number' &&
                    typeof form.watch('longitude') === 'number' &&
                    (form.watch('latitude') !== 0 || form.watch('longitude') !== 0) && (
                      <div className="mt-2">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${form.watch('latitude')},${form.watch('longitude')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Open in Google Maps ↗
                        </a>
                      </div>
                    )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Display selected event details from previous step */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="text-sm font-medium mb-2">Event Details from Step 1:</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <span className="ml-2 font-medium">{eventType || 'Not selected'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Category:</span>
              <span className="ml-2 font-medium">{eventCategory || 'Not selected'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Capacity:</span>
              <span className="ml-2 font-medium">{eventCapacity || 0}</span>
            </div>
          </div>
          {!isVirtual && (
            <p className="text-xs text-muted-foreground mt-2">
              Venues below are filtered based on these criteria
            </p>
          )}
        </div>

      </form>
    </Form>
  );
}

export function ScheduleStep({ onSubmit, initialData }: { onSubmit: (data: any) => void, initialData: any }) {
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      date: new Date(),
      endDate: undefined,
      startTime: '18:00',
      endTime: '20:00',
      timezone: 'UTC',
      ...initialData
    },
  });

  return (
    <Form {...form}>
      <form id="step-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        const startDate = form.watch('date');
                        if (!startDate) {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }
                        const start = new Date(startDate);
                        start.setHours(0, 0, 0, 0);
                        return date < start;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}

export function MediaStep({
  onSubmit,
  initialData,
  onImageUpload
}: {
  onSubmit: (data: any) => void
  initialData: any
  onImageUpload?: (imageUrl: string) => void
}) {
  const { toast } = useToast();
  const form = useForm<MediaFormValues>({
    resolver: zodResolver(mediaSchema),
    defaultValues: {
      imageUrl: '',
      videoUrl: '',
      vipPrice: 0,
      premiumPrice: 0,
      generalPrice: 0,
      vipSeats: 0,
      premiumSeats: 0,
      generalSeats: 0,
      ...initialData
    },
  });

  const capacity = initialData?.capacity || 100;

  async function uploadFile(file: File): Promise<string | null> {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/uploads', { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('❌ Image upload failed:', err);
        const errorMessage = err.message || err.error || 'Unknown upload error';
        const errorDetail = err.hint || '';

        toast({
          title: "Upload Failed",
          description: errorDetail ? `${errorMessage} ${errorDetail}` : errorMessage,
          variant: "destructive",
        });
        return null;
      }
      const data = await res.json();
      console.log('✅ Image upload success:', data);

      toast({
        title: "Image Uploaded",
        description: "Your event banner has been uploaded successfully.",
      });

      return data?.url || null;
    } catch (e: any) {
      console.error('❌ Image upload error:', e);
      toast({
        title: "Upload Error",
        description: e.message || "Network error occurred while uploading",
        variant: "destructive",
      });
      return null;
    }
  }

  const handleSubmit = (data: MediaFormValues) => {
    const eventMode = initialData?.eventMode || 'IN_PERSON';
    const isVirtual = eventMode === 'VIRTUAL';

    // Skip seat capacity validation for virtual events (they have unlimited capacity)
    if (!isVirtual) {
      const totalSeats = (data.vipSeats || 0) + (data.premiumSeats || 0) + (data.generalSeats || 0);

      if (totalSeats > capacity) {
        form.setError('vipSeats', { type: 'custom', message: `Total seats (${totalSeats}) exceeds capacity (${capacity})` });
        form.setError('premiumSeats', { type: 'custom', message: `Total seats (${totalSeats}) exceeds capacity (${capacity})` });
        form.setError('generalSeats', { type: 'custom', message: `Total seats (${totalSeats}) exceeds capacity (${capacity})` });
        // Also toast for visibility
        toast({
          title: "Capacity Exceeded",
          description: `Total allocated seats (${totalSeats}) exceeds event capacity (${capacity}). Please adjust your seat distribution.`,
          variant: "destructive"
        });
        return;
      }
    }

    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form id="step-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Image</FormLabel>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center">
                    {field.value ? (
                      <img
                        src={field.value}
                        alt="Event"
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="image-upload"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const url = await uploadFile(f);
                          if (url) {
                            const normalized = url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
                            form.setValue('imageUrl', normalized, { shouldDirty: true, shouldTouch: true });
                            onImageUpload?.(normalized); // Notify parent immediately
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    Upload Image
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="videoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video URL (Optional)</FormLabel>
                <div className="flex items-center gap-4">
                  <PlayCircle className="h-8 w-8 text-muted-foreground" />
                  <FormControl>
                    <Input placeholder="https://youtube.com/..." {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Ticket Pricing & Seat Configuration */}
        <div className="border-t pt-6 mt-6">
          {(() => {
            const eventMode = initialData?.eventMode || 'IN_PERSON';
            const isVirtual = eventMode === 'VIRTUAL';
            const attendeeLabel = isVirtual ? 'Attendees' : 'Seats';
            const ticketLabel = isVirtual ? 'Tickets' : 'Tickets';

            return (
              <>
                <h3 className="text-lg font-semibold mb-4">
                  Ticket Pricing {!isVirtual && '& Seating'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {isVirtual ? (
                    <>
                      Expected Attendees: <span className="font-semibold">{capacity}</span>
                      <span className="ml-2 text-xs text-muted-foreground">(Virtual events have unlimited capacity)</span>
                    </>
                  ) : (
                    <>
                      Total Capacity: <span className="font-semibold">{capacity}</span> seats
                    </>
                  )}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* VIP Section */}
                  <div className="border rounded-lg p-4 bg-yellow-50">
                    <h4 className="font-semibold text-yellow-800 mb-3">VIP {ticketLabel}</h4>
                    <FormField
                      control={form.control}
                      name="vipSeats"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of VIP {attendeeLabel}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vipPrice"
                      render={({ field }) => (
                        <FormItem className="mt-3">
                          <FormLabel>Price per VIP Ticket (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Premium Section */}
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h4 className="font-semibold text-blue-800 mb-3">Premium {ticketLabel}</h4>
                    <FormField
                      control={form.control}
                      name="premiumSeats"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Premium {attendeeLabel}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="premiumPrice"
                      render={({ field }) => (
                        <FormItem className="mt-3">
                          <FormLabel>Price per Premium Ticket (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* General Section */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-3">General {ticketLabel}</h4>
                    <FormField
                      control={form.control}
                      name="generalSeats"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of General {attendeeLabel}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="generalPrice"
                      render={({ field }) => (
                        <FormItem className="mt-3">
                          <FormLabel>Price per General Ticket (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  {isVirtual ? (
                    <>💡 Tip: Set ticket pricing tiers. Virtual events don't have seat limits. Leave price as 0 for free tickets.</>
                  ) : (
                    <>💡 Tip: Total seats should not exceed capacity ({capacity}). Leave price as 0 for free tickets.</>
                  )}
                </p>
              </>
            );
          })()}
        </div>
      </form>
    </Form>
  );
}

export function SessionsStep({ onSubmit, initialData }: { onSubmit: (data: any) => void, initialData: any }) {
  const [sessions, setSessions] = useState<any[]>(initialData?.sessions || []);
  const [sTitle, setSTitle] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sStart, setSStart] = useState('');
  const [sEnd, setSEnd] = useState('');
  const [sRoom, setSRoom] = useState('');
  const [sTrack, setSTrack] = useState('');
  const [sCap, setSCap] = useState('');
  const { toast } = useToast();

  const handleAddSession = () => {
    if (!sTitle.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    if (!sStart || !sEnd) {
      toast({ title: "Start and End times required", variant: "destructive" });
      return;
    }
    if (new Date(sEnd) <= new Date(sStart)) {
      toast({ title: "End time must be after start time", variant: "destructive" });
      return;
    }

    const newSession = {
      title: sTitle.trim(),
      description: sDesc || undefined,
      startTime: sStart,
      endTime: sEnd,
      room: sRoom || undefined,
      track: sTrack || undefined,
      capacity: sCap ? Number(sCap) : undefined,
    };

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);

    // Clear form
    setSTitle(''); setSDesc(''); setSStart(''); setSEnd(''); setSRoom(''); setSTrack(''); setSCap('');
  };

  const handleRemoveSession = (index: number) => {
    setSessions(sessions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ sessions });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-5 space-y-4 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <Clock className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold">Add Session</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1.5 text-slate-700">Session Title <span className="text-red-500">*</span></label>
            <Input placeholder="e.g., Opening Keynote: The Future of Events" value={sTitle} onChange={(e) => setSTitle(e.target.value)} className="bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-slate-700">Starts At <span className="text-red-500">*</span></label>
            <Input type="datetime-local" value={sStart} onChange={(e) => setSStart(e.target.value)} className="bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-slate-700">Ends At <span className="text-red-500">*</span></label>
            <Input type="datetime-local" value={sEnd} onChange={(e) => setSEnd(e.target.value)} className="bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-slate-700">Room (Optional)</label>
            <Input placeholder="e.g., Grand Ballroom A" value={sRoom} onChange={(e) => setSRoom(e.target.value)} className="bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-slate-700">Track (Optional)</label>
            <Input placeholder="e.g., Main Stage" value={sTrack} onChange={(e) => setSTrack(e.target.value)} className="bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-slate-700">Capacity (Optional)</label>
            <Input type="number" placeholder="Defaults to room capacity" value={sCap} onChange={(e) => setSCap(e.target.value)} className="bg-white" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1.5 text-slate-700">Description (Optional)</label>
            <Textarea rows={2} placeholder="Brief description of what this session covers..." value={sDesc} onChange={(e) => setSDesc(e.target.value)} className="bg-white" />
          </div>
        </div>
        <Button type="button" onClick={handleAddSession} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
          Add Session to Schedule
        </Button>
      </div>

      {sessions.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-600 flex items-center justify-between">
            <span>Scheduled Sessions</span>
            <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{sessions.length}</span>
          </h4>
          <div className="rounded-lg border bg-white divide-y overflow-hidden shadow-sm">
            {sessions.map((s, idx) => (
              <div key={idx} className="p-4 flex items-start justify-between gap-4 group hover:bg-slate-50 transition-colors">
                <div className="min-w-0 space-y-1">
                  <div className="font-semibold text-sm text-slate-900">{s.title}</div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {s.room && <span className="px-1.5 py-0.5 rounded bg-slate-100 border text-slate-600">{s.room}</span>}
                    {s.track && <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600">{s.track}</span>}
                  </div>
                  {s.description && (
                    <p className="text-xs text-slate-600 line-clamp-1">{s.description}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                  onClick={() => handleRemoveSession(idx)}
                  title="Remove session"
                >
                  <span className="sr-only">Remove</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed rounded-lg text-slate-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No sessions added yet.</p>
          <p className="text-xs">Add keynotes, workshops, or breaks above.</p>
        </div>
      )}

      <form id="step-form" onSubmit={handleSubmit}>
        {/* Hidden submit trigger for parent stepper */}
      </form>
    </div>
  );
}

export function ReviewStep({ data, onSubmit }: { data: any, onSubmit: (data: any) => void }) {
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? dateString : format(date, 'PPP');
    } catch {
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Prepare data for display
  const displayData = {
    'Event Title': data.title,
    'Description': data.description,
    'Venue': data.venue,
    'Capacity': data.capacity,
    'Event Type': data.type,
    'Category': data.category,
    'Date': formatDate(data.date),
    'Start Time': formatTime(data.startTime),
    'End Time': formatTime(data.endTime),
    'Timezone': data.timezone,
    'Image': data.imageUrl ? '✓' : 'None',
    'Video': data.videoUrl || 'None',
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Review Your Event</h3>
        <p className="text-sm text-muted-foreground">
          Please review all the information before submitting your event.
        </p>
      </div>

      <div className="border rounded-lg divide-y">
        {Object.entries(displayData).map(([key, value]) => (
          <div key={key} className="grid grid-cols-3 p-4">
            <div className="font-medium text-sm text-muted-foreground">
              {key}
            </div>
            <div className="col-span-2 text-sm">
              {value || 'Not provided'}
            </div>
          </div>
        ))}
      </div>

      {data.sessions && data.sessions.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b font-medium text-sm text-slate-700">
            Scheduled Sessions ({data.sessions.length})
          </div>
          <div className="divide-y">
            {data.sessions.map((s: any, i: number) => (
              <div key={i} className="p-4 text-sm">
                <div className="font-semibold text-slate-800">{s.title}</div>
                <div className="text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span>📅 {s.startTime ? s.startTime.replace('T', ' ') : 'TBD'}</span>
                  {s.endTime && <span>➡️ {s.endTime.replace('T', ' ')}</span>}
                  {s.room && <span>📍 {s.room}</span>}
                  {s.track && <span>🏷️ {s.track}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Legal Step Schema
const legalSchema = z.object({
  termsAndConditions: z.string().optional(),
  disclaimer: z.string().optional(),
  eventManagerName: z.string().min(2, 'Manager name must be at least 2 characters').optional().or(z.literal('')),
  eventManagerContact: z.string().optional(),
  eventManagerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
});

export function LegalStep({ onSubmit, initialData }: { onSubmit: (data: any) => void, initialData: any }) {
  const form = useForm<z.infer<typeof legalSchema>>({
    resolver: zodResolver(legalSchema),
    defaultValues: initialData || {
      termsAndConditions: '',
      disclaimer: '',
      eventManagerName: '',
      eventManagerContact: '',
      eventManagerEmail: '',
    },
  });

  return (
    <Form {...form}>
      <form id="step-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Legal & Contact Information</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Add terms, conditions, disclaimer, and event manager contact details (all optional)
          </p>
        </div>

        {/* Event Manager Section */}
        <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
          <h4 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Event Manager Contact
          </h4>

          <FormField
            control={form.control}
            name="eventManagerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manager Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="eventManagerContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1 234 567 8900" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="eventManagerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="manager@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Terms and Conditions */}
        <FormField
          control={form.control}
          name="termsAndConditions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Terms & Conditions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your event terms and conditions here..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Specify rules, policies, and conditions attendees must agree to
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Disclaimer */}
        <FormField
          control={form.control}
          name="disclaimer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Disclaimer</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter any disclaimers or liability statements..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Add liability disclaimers, health & safety notices, or other important warnings
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
