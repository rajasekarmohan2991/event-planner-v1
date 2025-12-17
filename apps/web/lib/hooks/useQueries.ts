"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Query Keys
export const queryKeys = {
    events: {
        all: ['events'] as const,
        list: (filters?: any) => ['events', 'list', filters] as const,
        detail: (id: string) => ['events', 'detail', id] as const,
        registrations: (id: string) => ['events', id, 'registrations'] as const,
        team: (id: string) => ['events', id, 'team'] as const,
    },
    company: {
        dashboard: ['company', 'dashboard'] as const,
        users: (params?: any) => ['company', 'users', params] as const,
        team: ['company', 'team'] as const,
    },
    user: {
        profile: ['user', 'profile'] as const,
        registrations: ['user', 'registrations'] as const,
    },
}

// Custom Hooks

/**
 * Fetch company dashboard data with caching
 */
export function useCompanyDashboard() {
    return useQuery({
        queryKey: queryKeys.company.dashboard,
        queryFn: async () => {
            const res = await fetch('/api/company/dashboard', {
                credentials: 'include',
            })
            if (!res.ok) throw new Error('Failed to fetch dashboard')
            return res.json()
        },
        staleTime: 60 * 1000, // 1 minute
    })
}

/**
 * Fetch company users with caching
 */
export function useCompanyUsers(params?: { limit?: number; q?: string }) {
    return useQuery({
        queryKey: queryKeys.company.users(params),
        queryFn: async () => {
            const qs = new URLSearchParams()
            if (params?.limit) qs.set('limit', String(params.limit))
            if (params?.q) qs.set('q', params.q)

            const res = await fetch(`/api/company/users?${qs.toString()}`, {
                credentials: 'include',
                cache: 'no-store',
            })
            if (!res.ok) throw new Error('Failed to fetch users')
            return res.json()
        },
        staleTime: 30 * 1000, // 30 seconds
    })
}

/**
 * Fetch event details with caching
 */
export function useEvent(eventId: string) {
    return useQuery({
        queryKey: queryKeys.events.detail(eventId),
        queryFn: async () => {
            const res = await fetch(`/api/events/${eventId}`, {
                credentials: 'include',
            })
            if (!res.ok) throw new Error('Failed to fetch event')
            return res.json()
        },
        enabled: !!eventId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

/**
 * Fetch event registrations with caching
 */
export function useEventRegistrations(eventId: string, params?: any) {
    return useQuery({
        queryKey: queryKeys.events.registrations(eventId),
        queryFn: async () => {
            const qs = new URLSearchParams(params || {})
            const res = await fetch(`/api/events/${eventId}/registrations?${qs.toString()}`, {
                credentials: 'include',
            })
            if (!res.ok) throw new Error('Failed to fetch registrations')
            return res.json()
        },
        enabled: !!eventId,
        staleTime: 15 * 1000, // 15 seconds (more frequent for real-time data)
    })
}

/**
 * Fetch event team members with caching
 */
export function useEventTeam(eventId: string, params?: any) {
    return useQuery({
        queryKey: queryKeys.events.team(eventId),
        queryFn: async () => {
            const qs = new URLSearchParams(params || {})
            const res = await fetch(`/api/events/${eventId}/team?${qs.toString()}`, {
                credentials: 'include',
            })
            if (!res.ok) throw new Error('Failed to fetch team')
            return res.json()
        },
        enabled: !!eventId,
        staleTime: 60 * 1000, // 1 minute
    })
}

/**
 * Mutation: Invite team members
 */
export function useInviteTeamMembers(eventId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ emails, role }: { emails: string[]; role: string }) => {
            const res = await fetch(`/api/events/${eventId}/team/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ emails, role }),
            })
            if (!res.ok) throw new Error('Failed to invite members')
            return res.json()
        },
        onSuccess: () => {
            // Invalidate and refetch team data
            queryClient.invalidateQueries({ queryKey: queryKeys.events.team(eventId) })
        },
    })
}

/**
 * Prefetch event data (for faster navigation)
 */
export function usePrefetchEvent() {
    const queryClient = useQueryClient()

    return (eventId: string) => {
        queryClient.prefetchQuery({
            queryKey: queryKeys.events.detail(eventId),
            queryFn: async () => {
                const res = await fetch(`/api/events/${eventId}`, {
                    credentials: 'include',
                })
                if (!res.ok) throw new Error('Failed to fetch event')
                return res.json()
            },
            staleTime: 2 * 60 * 1000,
        })
    }
}
