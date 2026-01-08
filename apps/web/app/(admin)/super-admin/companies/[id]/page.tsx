"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Users, Wallet, Settings, BookOpen, Clock, UserCheck, FileText, Bell, Star, ChevronRight, Building2, RefreshCw, Ticket, Percent } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AppHighlight {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: 'active' | 'inactive' | 'coming_soon';
  color: string;
}

interface CompanyDetails {
  id: string;
  name: string;
  plan: string;
  status: string;
  billingEmail: string;
  maxEvents: number;
  maxUsers: number;
  maxStorage: number;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  events: Array<{
    id: number;
    name: string;
    start_date: string;
    end_date?: string;
    location: string;
    status: string;
    priceInr?: number;
    capacity?: number;
    _count: { registrations: number };
  }>;
  members: Array<{
    id: string;
    role: string;
    user: { name: string; email: string };
  }>;
}

interface DashboardAnalytics {
  overview: {
    totalEvents: number;
    totalUsers: number;
    totalRegistrations: number;
    totalRevenue: number;
    totalCompanies: number;
  };
  registrationsByMonth: Array<{ month: string; count: number }>;
  topEvents: Array<{
    id: number;
    name: string;
    companyName: string;
    seats: number;
    registrations: number;
    startDate: string;
    endDate: string;
    rating: number;
    rsvps: number;
  }>;
  trends: {
    revenueGrowth: number;
    registrationsGrowth: number;
  };
}

export default function CompanyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isSuperAdminCompany, setIsSuperAdminCompany] = useState(false);

  useEffect(() => {
    if (params?.id) fetchData();
  }, [params?.id]);

  async function fetchData() {
    if (!params?.id) return;
    try {
      const promises = [
        fetch(`/api/super-admin/companies/${params.id}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
      ];

      const results = await Promise.all(promises);
      const companyRes = results[0];

      if (companyRes.ok) {
        const data = await companyRes.json();
        setCompany(data.company);

        // Check if this is the super-admin company
        const isSuper = data.company?.slug === 'super-admin';
        setIsSuperAdminCompany(isSuper);

        // Fetch analytics only for super-admin company
        if (isSuper) {
          const [analyticsRes, statsRes] = await Promise.all([
            fetch('/api/admin/analytics', { credentials: 'include' }),
            fetch('/api/admin/dashboard/stats', { credentials: 'include' })
          ]);

          if (analyticsRes.ok) {
            const analyticsData = await analyticsRes.json();
            setAnalytics(analyticsData);
          }

          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats(statsData);
          }
        }
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }


  const apps: AppHighlight[] = [
    {
      id: 'events',
      name: 'Events',
      description: 'Manage events, tickets, and registrations',
      icon: Calendar,
      status: 'active',
      color: 'text-purple-600'
    }
  ];

  const createEvent = () => {
    router.push(`/super-admin/companies/${company?.id}/events/create`)
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (!company) return <div className="p-8">Company not found</div>;

  // For default-tenant, show full dashboard with analytics
  if (isSuperAdminCompany && analytics) {
    return (
      <div className="p-6 space-y-6">
        {/* Live Updates Bar */}
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Live Updates</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Events</span>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold">{analytics.overview.totalEvents}</div>
            <div className="text-xs text-gray-500 mt-1">All events created</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Upcoming Events</span>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold">{stats?.upcomingEvents || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Events starting soon</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Users</span>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold">{stats?.totalUsers || analytics.overview.totalUsers || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Registered users</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Registered Companies</span>
              <Building2 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold">{analytics.overview.totalCompanies}</div>
            <div className="text-xs text-gray-500 mt-1">Active tenant companies</div>
          </div>
        </div>

        {/* Ticket Sales Section */}
        <div className="grid gap-6 grid-cols-1">
          {/* Ticket Sales Pie Chart */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🎫 Ticket Sales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Male', value: 8 },
                        { name: 'Female', value: 3 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#ec4899" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">{analytics.overview.totalRegistrations || 24}</div>
                  <div className="text-sm text-gray-600">Tickets Sold</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">8</div>
                    <div className="text-xs text-gray-600">Male</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-pink-600">3</div>
                    <div className="text-xs text-gray-600">Female</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Events Table */}
        {analytics.topEvents && analytics.topEvents.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b px-6 py-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                🏆 Top 5 Events
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Event Name</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4 text-center">Seats</th>
                    <th className="px-6 py-4 text-center">Registered</th>
                    <th className="px-6 py-4">Start Date</th>
                    <th className="px-6 py-4">End Date</th>
                    <th className="px-6 py-4 text-center">Rating</th>
                    <th className="px-6 py-4 text-center">RSVPs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {analytics.topEvents.slice(0, 5).map((event, idx) => (
                    <tr key={event.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                          {idx + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{event.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          {event.companyName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600 font-mono">{event.seats || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {event.registrations}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(event.startDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{event.endDate ? new Date(event.endDate).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-amber-500 font-medium">
                          <span>★</span> {event.rating}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{event.rsvps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // For other companies, show original view
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <p className="text-gray-600">{company.billingEmail}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {company.plan}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {company.status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Events Card - Blue Gradient */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 p-6 rounded-lg shadow-lg border border-blue-400/20 h-full">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{company.events.length}</div>
                  <div className="text-blue-100 font-medium">Total Events</div>
                </div>
              </div>
            </div>

            {/* Team Members Card - Green Gradient */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 p-6 rounded-lg shadow-lg border border-green-400/20 h-full">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{company.members.length}</div>
                  <div className="text-green-100 font-medium">Team Members</div>
                </div>
              </div>
            </div>

            {/* Total Registrations Card - Purple Gradient */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 p-6 rounded-lg shadow-lg border border-purple-400/20 h-full">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {company.events.reduce((sum, event) => sum + event._count.registrations, 0)}
                  </div>
                  <div className="text-purple-100 font-medium">Total Registrations</div>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription & Billing Details */}
          <div className="bg-white rounded-lg shadow border overflow-hidden mb-8">
            <div className="p-6 border-b flex justify-between items-center bg-green-50/50">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Subscription & Limits</h2>
              </div>
              <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                {company.plan} Plan
              </Badge>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-4">Plan Usage Limits</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Events Created</span>
                      <span className="text-gray-500">{company.events.length} / {company.maxEvents}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (company.events.length / company.maxEvents) * 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Team Members</span>
                      <span className="text-gray-500">{company.members.length} / {company.maxUsers}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (company.members.length / company.maxUsers) * 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Storage (MB)</span>
                      <span className="text-gray-500">0 / {company.maxStorage}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-400 rounded-full" style={{ width: `0%` }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Billing Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Status</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${company.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {company.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Billing Email</span>
                    <span className="font-medium">{company.billingEmail?.replace(/[<>]/g, '') || 'Not set'}</span>
                  </div>
                  {company.trialEndsAt && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Trial Ends</span>
                      <span className="font-medium">{new Date(company.trialEndsAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {company.subscriptionEndsAt && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Renews On</span>
                      <span className="font-medium">{new Date(company.subscriptionEndsAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Events List */}
          <div id="events" className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Events</h2>
              <Badge variant="secondary" className="ml-2">
                {company.events.length} Total
              </Badge>
            </div>
            <div className="p-0">
              {company.events.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No events created yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Registrations</TableHead>
                      <TableHead>Tickets Remaining</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {company.events.map((event) => {
                      const capacity = event.capacity || 0;
                      const registrations = event._count?.registrations || 0;
                      const ticketsRemaining = Math.max(0, capacity - registrations);

                      return (
                        <TableRow key={event.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {event.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-sm">
                              <span>{new Date(event.start_date).toLocaleDateString()}</span>
                              {event.end_date && (
                                <span className="text-gray-500 text-xs">
                                  to {new Date(event.end_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{event.location || 'Online'}</TableCell>
                          <TableCell>
                            {(event.priceInr ?? 0) > 0 ? `₹${event.priceInr}` : 'Free'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>{registrations} / {capacity > 0 ? capacity : '∞'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={ticketsRemaining < 10 && capacity > 0 ? "text-red-600 font-medium" : ""}>
                              {capacity > 0 ? ticketsRemaining : 'Unlimited'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={
                              event.status === 'LIVE' || event.status === 'PUBLISHED' ? 'default' :
                                event.status === 'DRAFT' ? 'secondary' : 'outline'
                            }>
                              {event.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Company Management & Featured Apps */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          {/* Company Management Options / Super Admin Modules */}
          <div className="bg-white rounded-lg shadow border overflow-hidden sticky top-6">
            <div className="p-4 border-b bg-indigo-50/50 flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold text-gray-900">
                {isSuperAdminCompany ? 'Super Admin Modules' : 'Company Management'}
              </h2>
            </div>
            <div className="divide-y">
              {isSuperAdminCompany ? (
                <>
                  {/* Lookup Management */}
                  <div
                    onClick={() => router.push('/admin/lookup')}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-all">
                        <BookOpen className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">Lookup Management</h3>
                        <p className="text-xs text-gray-500">Manage system lookups</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600" />
                    </div>
                  </div>

                  {/* User Management */}
                  <div
                    onClick={() => router.push('/admin/users')}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-all">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">User Management</h3>
                        <p className="text-xs text-gray-500">Manage all users</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600" />
                    </div>
                  </div>

                  {/* System Settings */}
                  <div
                    onClick={() => router.push('/super-admin/settings')}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-all">
                        <Settings className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">System Settings</h3>
                        <p className="text-xs text-gray-500">Configure system settings</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600" />
                    </div>
                  </div>

                  {/* Verifications */}
                  <div
                    onClick={() => router.push('/admin/verifications')}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-all">
                        <UserCheck className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">Verifications</h3>
                        <p className="text-xs text-gray-500">Review user verifications</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600" />
                    </div>
                  </div>

                  {/* Analytics */}
                  <div
                    onClick={() => router.push('/admin/analytics')}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-all">
                        <Calendar className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">Analytics</h3>
                        <p className="text-xs text-gray-500">View system analytics</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div
                    onClick={() => router.push(`/super-admin/companies/${company.id}/users`)}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-all">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">Users</h3>
                        <p className="text-xs text-gray-500">Manage company users</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600" />
                    </div>
                  </div>
                  <div
                    onClick={() => router.push(`/super-admin/companies/${company.id}/settings`)}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-all">
                        <Settings className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">System Settings</h3>
                        <p className="text-xs text-gray-500">Configure system settings</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600" />
                    </div>
                  </div>

                  {/* Tax Structures */}
                  <div
                    onClick={() => router.push(`/super-admin/companies/${company.id}/tax-structures`)}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-100 group-hover:bg-teal-200 transition-all">
                        <Percent className="h-5 w-5 text-teal-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">Tax Structures</h3>
                        <p className="text-xs text-gray-500">Manage tax rates</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600" />
                    </div>
                  </div>

                  {/* Finance Configuration */}
                  <div
                    onClick={() => router.push(`/super-admin/companies/${company.id}/finance`)}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group border-t border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-all">
                        <Wallet className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">Finance Configuration</h3>
                        <p className="text-xs text-gray-500">Invoices, Receipts, Signatures</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Featured App Highlights */}
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="p-4 border-b bg-blue-50/50 flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600 fill-blue-600" />
              <h2 className="font-semibold text-gray-900">Featured App Highlights</h2>
            </div>
            <div className="divide-y">
              {apps.map(app => (
                <div
                  key={app.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => {
                    if (app.id === 'events') {
                      const eventsSection = document.getElementById('events');
                      if (eventsSection) {
                        eventsSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all ${app.color}`}>
                      <app.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate pr-2">{app.name}</h3>
                        {app.status === 'active' && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">ACTIVE</span>}
                        {app.status === 'coming_soon' && <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">COMING SOON</span>}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{app.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
