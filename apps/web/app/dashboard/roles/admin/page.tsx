'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, User, Ticket, Clock, AlertCircle, Settings, Users, Shield, Database } from 'lucide-react'
import Link from 'next/link'

// Define types inline since we're having issues with the import
type DashboardStats = {
  totalEvents: number
  upcomingEvents: number
  totalUsers: number
  recentRegistrations: number
  totalTickets: number
}

// Define the RecentActivities component inline since we're having issues with the import
function RecentActivities({ activities }: { activities: Array<{
  id: string
  eventTitle: string
  userName: string
  status: string
  createdAt: Date
}> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activity.userName} - {activity.eventTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.status} • {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

type StatCardProps = {
  title: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>({
    totalEvents: 0,
    upcomingEvents: 0,
    totalUsers: 0,
    recentRegistrations: 0,
    totalTickets: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string
    eventTitle: string
    userName: string
    status: string
    createdAt: Date
  }>>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch dashboard stats
        const [statsRes, activitiesRes] = await Promise.all([
          fetch('/api/admin/dashboard/stats'),
          fetch('/api/admin/registrations/recent')
        ])
        
        if (!statsRes.ok) {
          throw new Error('Failed to fetch dashboard stats')
        }
        
        if (!activitiesRes.ok) {
          throw new Error('Failed to fetch recent activities')
        }
        
        const [statsData, activitiesData] = await Promise.all([
          statsRes.json(),
          activitiesRes.json()
        ])
        
        setStats(statsData)
        setRecentActivities(activitiesData.data || [])
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-red-700 hover:text-red-600"
              >
                Try again <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating your first event.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Events"
            value={stats?.totalEvents || 0}
            icon={Calendar}
          />
          <StatCard
            title="Upcoming Events"
            value={stats?.upcomingEvents || 0}
            icon={Clock}
          />
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={User}
          />
          <StatCard
            title="Recent Registrations"
            value={stats?.recentRegistrations || 0}
            icon={Ticket}
          />
        </div>
      )}

      {/* Admin Settings Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Admin Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* User Management */}
            <Link href="/admin/users">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-indigo-500">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-indigo-100 rounded-full">
                      <Users className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">User Management</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Manage user roles and permissions
                      </p>
                    </div>
                    <div className="text-xs text-indigo-600 font-medium">
                      View & Edit Roles →
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Role & Privileges */}
            <Link href="/admin/roles">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-500">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Roles & Privileges</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Configure role-based access control
                      </p>
                    </div>
                    <div className="text-xs text-purple-600 font-medium">
                      Manage Permissions →
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* System Settings */}
            <Link href="/admin/settings">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Database className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">System Settings</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        View system stats and configurations
                      </p>
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      View Settings →
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <RecentActivities activities={recentActivities} />
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent activities found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, icon: Icon }, ref) => (
    <Card ref={ref}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
)
StatCard.displayName = 'StatCard'
