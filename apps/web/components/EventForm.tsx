'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, ImageIcon, PlayCircle } from 'lucide-react';
import { Player } from '@lottiefiles/react-lottie-player';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimationPicker } from './AnimationPicker';
import { AnimationConfig } from '@/lib/animations/animations';

const eventFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.date({
    required_error: 'Please select a date',
  }),
  time: z.string().min(1, 'Please select a time'),
  venue: z.string().min(3, 'Venue must be at least 3 characters'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  type: z.string().min(1, 'Please select an event type'),
  category: z.string().min(1, 'Please select a category'),
  animationConfig: z.any().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const eventTypes = [
  'Conference',
  'Workshop',
  'Meetup',
  'Webinar',
  'Exhibition',
  'Concert',
  'Festival',
  'Other',
];

const categories = [
  'Business',
  'Technology',
  'Education',
  'Entertainment',
  'Health & Wellness',
  'Arts & Culture',
  'Sports',
  'Food & Drink',
  'Other',
];

interface EventFormProps {
  initialData?: any;
  onSubmit: (data: EventFormValues) => void;
  isSubmitting: boolean;
}

export function EventForm({ initialData, onSubmit, isSubmitting }: EventFormProps) {
  const [isAnimationPickerOpen, setIsAnimationPickerOpen] = useState(false);
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationConfig | null>(
    initialData?.animationConfig || null
  );

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      time: initialData?.time || '19:00',
      venue: initialData?.venue || '',
      capacity: initialData?.capacity || 50,
      type: initialData?.type || '',
      category: initialData?.category || '',
      animationConfig: initialData?.animationConfig || null,
    },
  });

  const handleAnimationSelect = (animation: AnimationConfig | null) => {
    setSelectedAnimation(animation);
    form.setValue('animationConfig', animation);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Event Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
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
                        disabled={(date) => date < new Date()}
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
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <Input placeholder="Where is the event?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <FormLabel>Event Animation</FormLabel>
            <div
              className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setIsAnimationPickerOpen(true)}
            >
              {selectedAnimation ? (
                <div className="w-full">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <Player
                      autoplay
                      loop
                      src={typeof selectedAnimation === 'string' ? selectedAnimation : selectedAnimation.source}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-center text-gray-600">
                    {selectedAnimation.name}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <PlayCircle className="h-10 w-10 mb-2" />
                  <p className="text-sm">Select an animation</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Choose from our library of animations
                  </p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Select an animation that will be shown on your event card
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Event'}
          </Button>
        </div>

        <AnimationPicker
          open={isAnimationPickerOpen}
          onOpenChange={setIsAnimationPickerOpen}
          onSelect={handleAnimationSelect}
          selectedAnimationId={selectedAnimation?.id}
          eventCategory={form.watch('category')}
        />
      </form>
    </Form>
  );
}
