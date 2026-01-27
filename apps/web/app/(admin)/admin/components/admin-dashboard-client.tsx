'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Ticket, Activity, RefreshCw, Plus, BarChart3, MessageSquare, Settings, Building2, Zap, Server, Mail, Tag, Edit, Eye, Trophy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar } from 'recharts';
import { RecentActivity } from '../_components/recent-activity';

import { StatsCard } from '../_components/stats-card';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { ActivityType } from '../_components/recent-activity';
import type { DashboardStats } from '@/types/admin';

interface DashboardData extends DashboardStats {
  recentActivities: ActivityType[];
}

export function AdminDashboardClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats & { totalCompanies?: number }>({
    totalEvents: 0,
    upcomingEvents: 0,
    totalUsers: 0,
    recentRegistrations: 0,
    totalTickets: 0,
    totalCompanies: 0,
    rsvpStats: { total: 0, going: 0, interested: 0, notGoing: 0 }
  });

  const [recentActivities, setRecentActivities] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);


  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, activitiesRes, analyticsRes, companyRes] = await Promise.all([
          fetch('/api/admin/dashboard/stats'),
          fetch('/api/admin/activities/recent'),
          fetch('/api/admin/analytics'),
          fetch('/api/company/settings')
        ]);

        if (!statsRes.ok || !activitiesRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const statsData = await statsRes.json();
        const activitiesData = await activitiesRes.json();
        const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;
        const companyData = companyRes.ok ? await companyRes.json() : null;

        setStats(statsData);
        setRecentActivities(activitiesData);
        setAnalytics(analyticsData);
        if (companyData && !companyData.error) {
          setCompanySettings(companyData);
        }
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchDashboardData();
      }, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [toast, autoRefresh]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="h-6 w-6 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const manualRefresh = async () => {
    setIsLoading(true);
    try {
      const [statsRes, activitiesRes, companyRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats', { cache: 'no-store' }),
        fetch('/api/admin/activities/recent', { cache: 'no-store' }),
        fetch('/api/company/settings', { cache: 'no-store' })
      ]);

      if (!statsRes.ok || !activitiesRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = await statsRes.json();
      const activitiesData = await activitiesRes.json();
      const companyData = companyRes.ok ? await companyRes.json() : null;

      setStats(statsData);
      setRecentActivities(activitiesData);
      if (companyData && !companyData.error) {
        setCompanySettings(companyData);
      }
      setLastUpdated(new Date());

      toast({
        title: 'Success',
        description: 'Dashboard data refreshed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time Status Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {autoRefresh ? 'Live Updates' : 'Manual Mode'}
            </span>
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Disable Auto-refresh' : 'Enable Auto-refresh'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={manualRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {companySettings ? (
          <StatsCard
            title="My Company"
            value={companySettings.companyName}
            icon={Building2}
            description={`${companySettings.plan} Plan • ${companySettings.subdomain}`}
            href="/company"
            backgroundImage={companySettings.bannerUrl}
            logoImage={companySettings.logoUrl}
          />
        ) : (
          <StatsCard
            title="Total Registered Companies"
            value={analytics?.overview?.totalCompanies || 0}
            icon={Building2}
            description="Active tenant companies"
            href="/super-admin/companies"
          />
        )}
        <StatsCard
          title="Total Events"
          value={analytics?.overview?.totalEvents || stats.totalEvents}
          icon={Calendar}
          description="All events created"
          href="/admin/events"
        />
        <StatsCard
          title="Upcoming Events"
          value={stats.upcomingEvents}
          icon={Calendar}
          description="Events starting soon"
          href="/admin/events"
        />
        <StatsCard
          title="RSVP Responses"
          value={stats.rsvpStats?.total || 0}
          icon={MessageSquare}
          description={`Going: ${stats.rsvpStats?.going || 0} • Interest: ${stats.rsvpStats?.interested || 0}`}
          href="/admin/events"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-600" />
              Platform Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-950/40 dark:to-purple-900/30 rounded-2xl p-5 border border-violet-200/50 dark:border-violet-800/50 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-200/50 to-transparent rounded-bl-full opacity-50 transition-opacity group-hover:opacity-100" />
                <div className="text-3xl font-bold text-violet-700 dark:text-violet-300">
                  ₹{analytics?.overview?.totalRevenue?.toLocaleString('en-IN') || '0'}
                </div>
                <div className="text-sm text-violet-600/80 dark:text-violet-400/80 font-medium flex items-center gap-1 mt-1">
                  💰 Total Revenue
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-semibold">
                  +{analytics?.trends?.revenueGrowth || 0}% growth
                </div>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-950/40 dark:to-pink-900/30 rounded-2xl p-5 border border-rose-200/50 dark:border-rose-800/50 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-rose-200/50 to-transparent rounded-bl-full opacity-50 transition-opacity group-hover:opacity-100" />
                <div className="text-3xl font-bold text-rose-700 dark:text-rose-300">
                  {analytics?.overview?.totalRegistrations || '0'}
                </div>
                <div className="text-sm text-rose-600/80 dark:text-rose-400/80 font-medium flex items-center gap-1 mt-1">
                  👥 Total Registrations
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-semibold">
                  +{analytics?.trends?.registrationsGrowth || 0}% growth
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Chart 1: Activity Area Chart */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-500" />
                  Activity Growth
                </h4>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={(analytics?.registrationsByMonth?.length > 0)
                      ? analytics.registrationsByMonth
                      : []
                    }>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCount)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Top Events Bar Chart */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Top Events
                </h4>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics?.topEvents?.slice(0, 5) || []}
                      layout="vertical"
                      margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={80}
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        tickFormatter={(val) => val.length > 10 ? `${val.substring(0, 10)}...` : val}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="registrations" radius={[0, 4, 4, 0]} barSize={20}>
                        {analytics?.topEvents?.slice(0, 5).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24'][index % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Sales Pie Chart */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-violet-50 to-fuchsia-100 dark:from-violet-950/40 dark:to-fuchsia-900/30 border border-violet-200/50 dark:border-violet-800/50 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">🎫 Ticket Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.overview && (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Sold', value: analytics.overview.totalRegistrations || 0 },
                          { name: 'Available', value: Math.max(0, (analytics.overview.totalEvents * 100) - (analytics.overview.totalRegistrations || 0)) }
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
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-800 dark:text-slate-200">{analytics.overview.totalRegistrations || 0}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Tickets Sold</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/70 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200/50 dark:border-slate-700/50">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Math.round((analytics.overview.totalRegistrations / (analytics.overview.totalEvents * 100)) * 660) || 0}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Male</div>
                  </div>
                  <div className="bg-white/70 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200/50 dark:border-slate-700/50">
                    <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{Math.round((analytics.overview.totalRegistrations / (analytics.overview.totalEvents * 100)) * 220) || 0}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Female</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Removed Recent System Activity and Quick Actions sections per user request */}

      {/* Your Events Section */}
      {
        analytics?.topEvents?.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">Your Events</h2>
              <Button variant="outline" size="sm" className="rounded-xl border-slate-200 dark:border-slate-700" onClick={() => router.push('/events')}>
                View All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analytics.topEvents.map((event: any) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl border-l-4 border-l-violet-500">
                  <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg font-semibold line-clamp-1 text-slate-800 dark:text-slate-200" title={event.name}>
                        {event.name}
                      </CardTitle>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${event.status === 'LIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                        event.status === 'DRAFT' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        }`}>
                        {event.status || 'DRAFT'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate" title={event.adminEmail || 'No email'}>
                        {event.adminEmail || 'No admin email'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {event.price === 0 ? 'Free' : `₹${event.price}`}
                      </span>
                      <span className="text-gray-400 text-xs">per ticket</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div className="flex flex-col text-xs">
                        <span>Start: {new Date(event.startDate).toLocaleDateString()}</span>
                        {event.endDate && <span>End: {new Date(event.endDate).toLocaleDateString()}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="text-xs">
                        Tickets remaining: <span className="font-semibold text-gray-900">{Math.max(0, (event.seats || 0) - (event.registrations || 0))}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t">
                      <div className="text-xs text-gray-500">
                        <span className="font-bold text-indigo-600">{event.registrations}</span> registrations
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => router.push(`/events/${event.id}/info`)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => router.push(`/events/${event.id}/manage`)}
                          title="Edit Event"
                        >
                          <Edit className="w-4 h-4 text-amber-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      }
    </div >
  );
}
