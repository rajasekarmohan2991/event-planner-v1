'use client'

import { 
  Calendar, Users, Ticket, TrendingUp, 
  DollarSign, CheckCircle, Clock, AlertCircle 
} from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { NeumorphicIcon } from '@/components/ui/neumorphic-icon'
import { MinimalIllustration } from '@/components/ui/minimal-illustration'

interface DashboardStats {
  totalEvents: number
  totalRegistrations: number
  totalRevenue: number
  activeEvents: number
  upcomingEvents: number
  completedEvents: number
  pendingApprovals: number
  ticketsSold: number
}

interface NeumorphicDashboardProps {
  stats: DashboardStats
}

export function NeumorphicDashboard({ stats }: NeumorphicDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Welcome Section with Minimal Illustration */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl p-8 border border-indigo-100 shadow-[8px_8px_24px_rgba(99,102,241,0.1),-8px_-8px_24px_rgba(255,255,255,0.9)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome to Your Dashboard
            </h1>
            <p className="text-slate-600">
              Here's what's happening with your events today
            </p>
          </div>
          <MinimalIllustration type="calendar" size="md" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Events"
          value={stats.totalEvents}
          icon={Calendar}
          variant="primary"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Registrations"
          value={stats.totalRegistrations}
          icon={Users}
          variant="success"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          variant="warning"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Tickets Sold"
          value={stats.ticketsSold}
          icon={Ticket}
          variant="info"
          trend={{ value: 5, isPositive: false }}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-3xl p-8 border border-slate-100 shadow-[8px_8px_24px_rgba(100,116,139,0.1),-8px_-8px_24px_rgba(255,255,255,0.9)]">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center gap-3">
            <NeumorphicIcon icon={Calendar} variant="primary" size="lg" />
            <span className="text-sm font-medium text-slate-700">Create Event</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <NeumorphicIcon icon={Users} variant="success" size="lg" />
            <span className="text-sm font-medium text-slate-700">View Attendees</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <NeumorphicIcon icon={TrendingUp} variant="info" size="lg" />
            <span className="text-sm font-medium text-slate-700">Analytics</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <NeumorphicIcon icon={Ticket} variant="warning" size="lg" />
            <span className="text-sm font-medium text-slate-700">Manage Tickets</span>
          </div>
        </div>
      </div>

      {/* Event Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 rounded-3xl p-6 border border-emerald-100 shadow-[8px_8px_24px_rgba(16,185,129,0.1),-8px_-8px_24px_rgba(255,255,255,0.9)]">
          <div className="flex items-center gap-4 mb-4">
            <NeumorphicIcon icon={CheckCircle} variant="success" size="md" />
            <div>
              <p className="text-sm text-slate-600">Active Events</p>
              <p className="text-2xl font-bold text-slate-900">{stats.activeEvents}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">Currently running events</p>
        </div>

        <div className="bg-gradient-to-br from-sky-50 via-white to-sky-50 rounded-3xl p-6 border border-sky-100 shadow-[8px_8px_24px_rgba(14,165,233,0.1),-8px_-8px_24px_rgba(255,255,255,0.9)]">
          <div className="flex items-center gap-4 mb-4">
            <NeumorphicIcon icon={Clock} variant="info" size="md" />
            <div>
              <p className="text-sm text-slate-600">Upcoming</p>
              <p className="text-2xl font-bold text-slate-900">{stats.upcomingEvents}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">Events starting soon</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50 rounded-3xl p-6 border border-amber-100 shadow-[8px_8px_24px_rgba(245,158,11,0.1),-8px_-8px_24px_rgba(255,255,255,0.9)]">
          <div className="flex items-center gap-4 mb-4">
            <NeumorphicIcon icon={AlertCircle} variant="warning" size="md" />
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-2xl font-bold text-slate-900">{stats.pendingApprovals}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">Awaiting approval</p>
        </div>
      </div>
    </div>
  )
}
