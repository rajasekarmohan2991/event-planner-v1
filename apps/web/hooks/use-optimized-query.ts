/**
 * Optimized React Query Hooks
 * Pre-configured hooks for common data fetching patterns
 */

'use client'

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useCallback } from 'react'

/**
 * Query Keys for consistent cache management
 */
export const QueryKeys = {
    events: {
        all: ['events'] as const,
        lists: () => ['events', 'list'] as const,
        list: (filters?: any) => ['events', 'list', filters] as const,
        details: () => ['events', 'detail'] as const,
        detail: (id: string) => ['events', 'detail', id] as const,
    },
    registrations: {
        all: ['registrations'] as const,
        byEvent: (eventId: string) => ['registrations', 'event', eventId] as const,
    },
    users: {
        all: ['users'] as const,
        list: (filters?: any) => ['users', 'list', filters] as const,
    },
}

/**
 * Optimized Events Hooks
 */
export function useEvents(filters?: any) {
    return useQuery({
        queryKey: QueryKeys.events.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams(filters || {})
            const res = await fetch(`/api/events?${params}`)
            if (!res.ok) throw new Error('Failed to fetch events')
            return res.json()
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

export function useEvent(id: string) {
    return useQuery({
        queryKey: QueryKeys.events.detail(id),
        queryFn: async () => {
            const res = await fetch(`/api/events/${id}`)
            if (!res.ok) throw new Error('Failed to fetch event')
            return res.json()
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

/**
 * Optimized Registrations Hooks
 */
export function useRegistrations(eventId: string) {
    return useQuery({
        queryKey: QueryKeys.registrations.byEvent(eventId),
        queryFn: async () => {
            const res = await fetch(`/api/events/${eventId}/registrations`)
            if (!res.ok) throw new Error('Failed to fetch registrations')
            return res.json()
        },
        enabled: !!eventId,
        staleTime: 1 * 60 * 1000, // 1 minute (more dynamic data)
    })
}

/**
 * Optimized Users Hooks
 */
export function useUsers(filters?: any) {
    return useQuery({
        queryKey: QueryKeys.users.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams(filters || {})
            const res = await fetch(`/api/admin/users?${params}`)
            if (!res.ok) throw new Error('Failed to fetch users')
            return res.json()
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

/**
 * Mutation Hooks with Optimistic Updates
 */
export function useCreateEvent() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to create event')
            return res.json()
        },
        onSuccess: () => {
            // Invalidate and refetch events list
            queryClient.invalidateQueries({ queryKey: QueryKeys.events.lists() })
        },
    })
}

export function useUpdateEvent(id: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/events/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to update event')
            return res.json()
        },
        // Optimistic update
        onMutate: async (newData) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: QueryKeys.events.detail(id) })

            // Snapshot previous value
            const previousEvent = queryClient.getQueryData(QueryKeys.events.detail(id))

            // Optimistically update
            queryClient.setQueryData(QueryKeys.events.detail(id), (old: any) => ({
                ...old,
                ...newData,
            }))

            return { previousEvent }
        },
        onError: (err, newData, context) => {
            // Rollback on error
            if (context?.previousEvent) {
                queryClient.setQueryData(QueryKeys.events.detail(id), context.previousEvent)
            }
        },
        onSettled: () => {
            // Refetch after mutation
            queryClient.invalidateQueries({ queryKey: QueryKeys.events.detail(id) })
            queryClient.invalidateQueries({ queryKey: QueryKeys.events.lists() })
        },
    })
}

export function useDeleteEvent() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete event')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QueryKeys.events.all })
        },
    })
}

/**
 * Prefetch Hook for Preloading Data
 */
export function usePrefetchEvent() {
    const queryClient = useQueryClient()

    return useCallback(
        (id: string) => {
            queryClient.prefetchQuery({
                queryKey: QueryKeys.events.detail(id),
                queryFn: async () => {
                    const res = await fetch(`/api/events/${id}`)
                    if (!res.ok) throw new Error('Failed to prefetch event')
                    return res.json()
                },
                staleTime: 5 * 60 * 1000,
            })
        },
        [queryClient]
    )
}

/**
 * Infinite Query Hook for Pagination
 */
export function useInfiniteEvents(filters?: any) {
    return useQuery({
        queryKey: QueryKeys.events.list(filters),
        queryFn: async ({ pageParam = 1 }) => {
            const params = new URLSearchParams({ ...filters, page: pageParam })
            const res = await fetch(`/api/events?${params}`)
            if (!res.ok) throw new Error('Failed to fetch events')
            return res.json()
        },
        // @ts-ignore - infinite query types
        getNextPageParam: (lastPage: any) => {
            const hasMore = lastPage.number + 1 < lastPage.totalPages
            return hasMore ? lastPage.number + 2 : undefined
        },
        staleTime: 2 * 60 * 1000,
    })
}
