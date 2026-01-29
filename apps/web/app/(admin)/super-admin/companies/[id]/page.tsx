"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Users, Wallet, Settings, BookOpen, Clock, UserCheck, FileText, Bell, Star, ChevronRight, Building2, RefreshCw, Ticket, Percent, Trash2, Ban, CheckCircle, DollarSign, Edit2, MoreHorizontal } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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
  status: 'ACTIVE' | 'DISABLED' | string;
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [companyCurrency, setCompanyCurrency] = useState('USD');

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' }
  ];

  useEffect(() => {
    if (params?.id) {
      fetchData();
      fetchCurrency();
    }
  }, [params?.id]);

  async function fetchCurrency() {
    try {
      const res = await fetch(`/api/super-admin/companies/${params?.id}/currency`);
      if (res.ok) {
        const data = await res.json();
        setCompanyCurrency(data.currency || 'USD');
        setSelectedCurrency(data.currency || 'USD');
      }
    } catch (error) {
      console.error('Error fetching currency:', error);
    }
  }

  async function handleSaveCurrency() {
    if (savingCurrency) return;
    setSavingCurrency(true);

    try {
      const res = await fetch(`/api/super-admin/companies/${params?.id}/currency`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: selectedCurrency })
      });

      if (res.ok) {
        setCompanyCurrency(selectedCurrency);
        setShowCurrencyModal(false);
        alert(`Currency updated to ${selectedCurrency} successfully!`);
      } else {
        const data = await res.json();
        alert(`Failed to update currency: ${data.message}`);
      }
    } catch (error: any) {
      alert(`Error updating currency: ${error.message}`);
    } finally {
      setSavingCurrency(false);
    }
  }

  async function handleToggleStatus() {
    if (!company || toggling) return;

    setToggling(true);
    const newStatus = company.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';

    try {
      const response = await fetch(`/api/super-admin/companies/${params?.id}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Company "${company.name}" ${newStatus === 'ACTIVE' ? 'enabled' : 'disabled'} successfully!`);
        fetchData(); // Refresh data
      } else {
        alert(`Failed to update company status: ${data.details || data.error || data.message}`);
      }
    } catch (error: any) {
      console.error('Status toggle error:', error);
      alert(`Error updating company status: ${error.message}`);
    } finally {
      setToggling(false);
      setShowDisableConfirm(false);
    }
  }

  async function handleDeleteCompany() {
    if (!company || deleting) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/super-admin/companies/${params.id}/delete`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Company "${company.name}" deleted successfully!`);
        router.push('/super-admin/companies');
      } else {
        alert(`Failed to delete company: ${data.error || data.message}`);
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`Error deleting company: ${error.message}`);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

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
                  <div className="text-4xl font-bold text-gray-900">{analytics.overview.totalRegistrations}</div>
                  <div className="text-sm text-gray-600">Tickets Sold</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats?.ticketStats?.male || 0}
                    </div>
                    <div className="text-xs text-gray-600">Male</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-pink-600">
                      {stats?.ticketStats?.female || 0}
                    </div>
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

  // For other companies, show modernized view
  return (
    <div className="p-8 bg-gray-50/50 min-h-screen font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{company.name}</h1>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 uppercase tracking-wide">
              {company.plan || 'STARTER'}
            </span>
            <span className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${company.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
              {company.status || 'ACTIVE'}
            </span>
          </div>
        </div>

        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 rounded-xl px-6 py-2.5 h-auto transition-all transform hover:-translate-y-0.5"
          onClick={() => router.push(`/super-admin/companies/${company.id}/users`)}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Invite Team Member</span>
          </div>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Total Events - Purple Theme */}
        <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100 flex items-center justify-between group hover:shadow-lg hover:shadow-purple-100 transition-all duration-300">
          <div>
            <div className="flex items-center gap-2 mb-1 text-purple-600">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-semibold">Total Events</span>
            </div>
            <div className="text-4xl font-extrabold text-gray-900 mt-2">{company.events.length}</div>
            <div className="text-purple-400 text-xs font-medium mt-1 group-hover:text-purple-600 transition-colors">All events created</div>
          </div>
          <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Team Members - Green Theme */}
        <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100 flex items-center justify-between group hover:shadow-lg hover:shadow-green-100 transition-all duration-300">
          <div>
            <div className="flex items-center gap-2 mb-1 text-green-600">
              <Users className="w-5 h-5" />
              <span className="text-sm font-semibold">Team Members</span>
            </div>
            <div className="text-4xl font-extrabold text-gray-900 mt-2">{company.members.length}</div>
            <div className="text-green-500 text-xs font-medium mt-1 group-hover:text-green-600 transition-colors">Active team size</div>
          </div>
          <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Registrations - Blue Theme */}
        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between group hover:shadow-lg hover:shadow-blue-100 transition-all duration-300">
          <div>
            <div className="flex items-center gap-2 mb-1 text-blue-600">
              <Settings className="w-5 h-5" />
              <span className="text-sm font-semibold">Total Registrations</span>
            </div>
            <div className="text-4xl font-extrabold text-gray-900 mt-2">
              {company.events.reduce((sum, event) => sum + event._count.registrations, 0)}
            </div>
            <div className="text-blue-400 text-xs font-medium mt-1 group-hover:text-blue-600 transition-colors">All registrations</div>
          </div>
          <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <Settings className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Events List Section */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden">
        <div className="p-8 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Your Events</h2>
          <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium">
            View All
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-indigo-50/30">
                <th className="text-left py-5 px-8 text-sm font-semibold text-indigo-900/70">Event Name</th>
                <th className="text-left py-5 px-6 text-sm font-semibold text-indigo-900/70">Date</th>
                <th className="text-left py-5 px-6 text-sm font-semibold text-indigo-900/70">Location</th>
                <th className="text-right py-5 px-6 text-sm font-semibold text-indigo-900/70">Price</th>
                <th className="text-center py-5 px-6 text-sm font-semibold text-indigo-900/70">Registrations</th>
                <th className="text-left py-5 px-6 text-sm font-semibold text-indigo-900/70">Tickets Remaining</th>
                <th className="text-right py-5 px-8 text-sm font-semibold text-indigo-900/70">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {company.events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-gray-300" />
                      </div>
                      <p>No events found for this company.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                company.events.map((event) => {
                  const capacity = event.capacity || 0;
                  const registrations = event._count?.registrations || 0;
                  const ticketsRemaining = Math.max(0, capacity - registrations);
                  const isSoldOut = capacity > 0 && ticketsRemaining === 0;

                  return (
                    <tr key={event.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-5 px-8">
                        <span className="font-semibold text-gray-900 block">{event.name}</span>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{new Date(event.start_date).toLocaleDateString()}</span>
                          {event.end_date && (
                            <span className="text-xs text-gray-500 mt-0.5">to {new Date(event.end_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6 text-gray-600 text-sm max-w-xs truncate">
                        {event.location || 'Online'}
                        {capacity > 0 && <span className="text-gray-400 ml-1">(Capacity: {capacity})</span>}
                      </td>
                      <td className="py-5 px-6 text-right font-medium text-gray-900">
                        {(event.priceInr ?? 0) > 0 ? `₹${event.priceInr}` : 'Free'}
                      </td>
                      <td className="py-5 px-6 text-center">
                        <div className="inline-flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{registrations} / {capacity > 0 ? capacity : '∞'}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span className={`font-medium ${isSoldOut ? 'text-red-600' : 'text-gray-900'}`}>
                          {capacity > 0 ? ticketsRemaining : 'Unlimited'}
                        </span>
                      </td>
                      <td className="py-5 px-8 text-right">
                        {event.status === 'PUBLISHED' || event.status === 'LIVE' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm shadow-rose-200">
                            PUBLISHED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                            {event.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Company</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{company.name}</strong>?
              This will permanently delete:
            </p>

            <ul className="mb-6 space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-red-500" />
                {company.events.length} event{company.events.length !== 1 ? 's' : ''}
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-red-500" />
                {company.members.length} team member{company.members.length !== 1 ? 's' : ''}
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-red-500" />
                All associated data and settings
              </li>
            </ul>

            <p className="text-red-600 font-semibold mb-6">
              This action cannot be undone!
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCompany}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Company
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Currency Change Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Change Base Currency</h3>
              <p className="text-sm text-gray-500 mt-1">This will update the base currency for {company?.name}</p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Currency
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {currencies.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name} ({curr.symbol})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                This will affect all financial calculations and displays for this company.
              </p>
            </div>
            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowCurrencyModal(false)}
                disabled={savingCurrency}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCurrency}
                disabled={savingCurrency}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingCurrency ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4" />
                    Update Currency
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable/Enable Confirmation Modal */}
      {showDisableConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${company.status === 'ACTIVE' ? 'bg-amber-100' : 'bg-green-100'}`}>
                {company.status === 'ACTIVE' ? (
                  <Ban className="h-6 w-6 text-amber-600" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {company.status === 'ACTIVE' ? 'Disable' : 'Enable'} Company
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to {company.status === 'ACTIVE' ? 'disable' : 'enable'} <strong>{company.name}</strong>?
              {company.status === 'ACTIVE' ? (
                <span className="block mt-2 text-amber-600">
                  Disabled companies cannot create events or access their dashboard.
                </span>
              ) : (
                <span className="block mt-2 text-green-600">
                  This will restore full access to the company dashboard and features.
                </span>
              )}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDisableConfirm(false)}
                disabled={toggling}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={toggling}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${company.status === 'ACTIVE'
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-green-500 hover:bg-green-600'
                  }`}
              >
                {toggling ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : company.status === 'ACTIVE' ? (
                  <>
                    <Ban className="h-4 w-4" />
                    Disable Company
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Enable Company
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
