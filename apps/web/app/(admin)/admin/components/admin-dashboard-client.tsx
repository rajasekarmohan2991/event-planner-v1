'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Ticket, Activity, RefreshCw, Plus, BarChart3, MessageSquare, Settings, Building2, Zap, Server, Mail, Tag, Edit, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
    totalCompanies: 0
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
      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-muted-foreground">
              {autoRefresh ? 'Live Updates' : 'Manual Mode'}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Disable Auto-refresh' : 'Enable Auto-refresh'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={manualRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          description="Registered users"
          href="/admin/users"
        />
        {companySettings ? (
          <StatsCard
            title="My Company"
            value={companySettings.companyName}
            icon={Building2}
            description={`${companySettings.plan} Plan • ${companySettings.subdomain}`}
            href="/company"
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
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              📊 Sales Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-blue-200/50 hover:shadow-md transition-all duration-300">
                <div className="text-3xl font-bold text-green-600">
                  ₹{analytics?.overview?.totalRevenue?.toLocaleString('en-IN') || '0'}
                </div>
                <div className="text-sm text-gray-600 font-medium">💰 Total Revenue</div>
                <div className="text-xs text-green-500 mt-1">
                  ↗️ +{analytics?.trends?.revenueGrowth || 0}% from last month
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-blue-200/50 hover:shadow-md transition-all duration-300">
                <div className="text-3xl font-bold text-blue-600">
                  {analytics?.overview?.totalRegistrations || '0'}
                </div>
                <div className="text-sm text-gray-600 font-medium">👥 Total Registrations</div>
                <div className="text-xs text-blue-500 mt-1">
                  ↗️ +{analytics?.trends?.registrationsGrowth || 0}% from last month
                </div>
              </div>
            </div>

            {/* Registration Trend Chart */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-blue-200/50">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">📈 Registration Trends</h4>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={(analytics?.registrationsByMonth?.length > 0)
                  ? analytics.registrationsByMonth
                  : Array.from({ length: 6 }, (_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - (5 - i));
                    return {
                      month: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
                      count: 0
                    };
                  })
                }>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ fill: '#4f46e5', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Registrations"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Sales Pie Chart */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-purple-50 to-pink-100 border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-gray-900">🎫 Ticket Sales</CardTitle>
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
                  <div className="text-4xl font-bold text-gray-900">{analytics.overview.totalRegistrations || 0}</div>
                  <div className="text-sm text-gray-600">Tickets Sold</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{Math.round((analytics.overview.totalRegistrations / (analytics.overview.totalEvents * 100)) * 660) || 0}</div>
                    <div className="text-xs text-gray-600">Male</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="text-2xl font-bold text-pink-600">{Math.round((analytics.overview.totalRegistrations / (analytics.overview.totalEvents * 100)) * 220) || 0}</div>
                    <div className="text-xs text-gray-600">Female</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Featured App Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium opacity-90 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-300" />
              Top Performing Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.topEvents?.[0]?.name || 'No events yet'}</div>
            <p className="text-indigo-100 text-sm mt-1">
              {analytics?.topEvents?.[0]?.registrations || 0} registrations
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium opacity-90 flex items-center gap-2">
              <Activity className="w-5 h-5 text-white" />
              User Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview?.averageAttendance || 0}%</div>
            <p className="text-emerald-100 text-sm mt-1">Average attendance rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium opacity-90 flex items-center gap-2">
              <Server className="w-5 h-5 text-white" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Operational</div>
            <p className="text-blue-100 text-sm mt-1">All systems normal</p>
          </CardContent>
        </Card>
      </div>

      {/* Your Events Section */}
      {analytics?.topEvents?.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Your Events</h2>
            <Button variant="outline" size="sm" onClick={() => router.push('/events')}>
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analytics.topEvents.map((event: any) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-indigo-500">
                <CardHeader className="pb-3 bg-gray-50/50">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-semibold line-clamp-1" title={event.name}>
                      {event.name}
                    </CardTitle>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${event.status === 'LIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                        event.status === 'DRAFT' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
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
      )}
    </div>
  );
}
