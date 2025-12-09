'use client'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Calendar, Filter, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'

interface Event {
  id: string
  title: string
  date: string
  location: string
  status: EventStatus
  attendees: number
  capacity: number
}

// Mock data - replace with real data from your API
const events: Event[] = [
  {
    id: '1',
    title: 'Tech Conference 2023',
    date: '2023-12-15',
    location: 'San Francisco, CA',
    status: 'published',
    attendees: 245,
    capacity: 500,
  },
  {
    id: '2',
    title: 'Music Festival',
    date: '2023-11-20',
    location: 'Austin, TX',
    status: 'published',
    attendees: 1200,
    capacity: 1500,
  },
  {
    id: '3',
    title: 'Product Launch',
    date: '2023-10-05',
    location: 'New York, NY',
    status: 'draft',
    attendees: 0,
    capacity: 200,
  },
  {
    id: '4',
    title: 'Workshop: Next.js 13',
    date: '2023-09-30',
    location: 'Online',
    status: 'completed',
    attendees: 85,
    capacity: 100,
  },
  {
    id: '5',
    title: 'Hackathon',
    date: '2023-10-15',
    location: 'Boston, MA',
    status: 'cancelled',
    attendees: 0,
    capacity: 50,
  },
]

const statusVariantMap: Record<EventStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  published: 'default',
  cancelled: 'destructive',
  completed: 'secondary',
}

function EventsPageContent() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            Manage your events and track their performance
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Link>
        </Button>
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="h-9">
            <Calendar className="mr-2 h-4 w-4" />
            This Month
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Events</CardTitle>
              <CardDescription>Manage your upcoming and past events</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {events.length} {events.length === 1 ? 'event' : 'events'} found
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Attendees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/events/${event.id}`} className="hover:underline">
                        {event.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {new Date(event.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>{event.location}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="mr-2 w-20">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div 
                              className="h-full bg-blue-500"
                              style={{
                                width: `${(event.attendees / event.capacity) * 100}%`,
                                maxWidth: '100%',
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {event.attendees}/{event.capacity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariantMap[event.status]}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/events/${event.id}`}>Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{events.length}</span> of{' '}
              <span className="font-medium">{events.length}</span> events
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function EventsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    }>
      <EventsPageContent />
    </Suspense>
  )
}
