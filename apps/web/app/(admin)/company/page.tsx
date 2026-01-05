"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserPlus, Calendar, Users, Settings } from "lucide-react";
import { LoadingWithTimeout } from "@/components/LoadingWithTimeout";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface CompanyDashboard {
  company: {
    id: string;
    name: string;
    plan: string;
    status: string;
  };
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
  stats: {
    totalEvents: number;
    totalMembers: number;
    totalRegistrations: number;
  };
}

export default function CompanyDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [dashboard, setDashboard] = useState<CompanyDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboard();
    }
  }, [status]);

  async function fetchDashboard() {
    try {
      setLoading(true);
      const res = await fetch("/api/company/dashboard", {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const inviteTeamMember = () => {
    router.push("/company/team");
  };

  if (loading) return <LoadingWithTimeout message="Loading dashboard..." timeout={3000} />;
  if (!dashboard) return <div className="p-8">No company data found</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{dashboard.company.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {dashboard.company.plan}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {dashboard.company.status}
            </span>
          </div>
        </div>
        <button
          onClick={inviteTeamMember}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Invite Team Member
        </button>
      </div>

      {/* Stats Cards - Enterprise Level */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Events - Soft Lavender */}
        <div className="bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-100 dark:from-purple-100 dark:via-purple-200 dark:to-indigo-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 group border border-purple-200/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-purple-600" />
                <p className="text-xs font-medium text-purple-700">Total Events</p>
              </div>
              <h3 className="text-2xl font-bold text-purple-900 mb-0.5">{dashboard.stats.totalEvents}</h3>
              <p className="text-xs text-purple-600">All events created</p>
            </div>
            <div className="p-3 bg-purple-200/30 rounded-lg group-hover:bg-purple-200/50 transition-all">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Team Members - Soft Mint */}
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 dark:from-emerald-100 dark:via-teal-100 dark:to-green-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 group border border-emerald-200/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-medium text-emerald-700">Team Members</p>
              </div>
              <h3 className="text-2xl font-bold text-emerald-900 mb-0.5">{dashboard.stats.totalMembers}</h3>
              <p className="text-xs text-emerald-600">Active team size</p>
            </div>
            <div className="p-3 bg-emerald-200/30 rounded-lg group-hover:bg-emerald-200/50 transition-all">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Total Registrations - Soft Sky Blue */}
        <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-100 dark:from-blue-100 dark:via-sky-100 dark:to-cyan-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 group border border-blue-200/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Settings className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-medium text-blue-700">Total Registrations</p>
              </div>
              <h3 className="text-2xl font-bold text-blue-900 mb-0.5">{dashboard.stats.totalRegistrations}</h3>
              <p className="text-xs text-blue-600">All registrations</p>
            </div>
            <div className="p-3 bg-blue-200/30 rounded-lg group-hover:bg-blue-200/50 transition-all">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-gradient-to-br from-white via-indigo-50/10 to-blue-50/20 rounded-lg shadow-sm border border-indigo-100/50 mb-8 overflow-hidden hover:shadow-md transition-all">
        <div className="p-6 border-b border-indigo-100/50 flex justify-between items-center bg-gradient-to-r from-indigo-50/30 to-blue-50/30">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Your Events</h2>
          <button
            onClick={() => router.push('/admin/events')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-full hover:bg-blue-50 transition-colors"
          >
            View All
          </button>
        </div>
        <div className="p-0">
          {dashboard.events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No events created yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
                <TableRow className="hover:bg-transparent border-b border-indigo-100 dark:border-indigo-800">
                  <TableHead className="text-indigo-700 dark:text-indigo-300 font-semibold">Event Name</TableHead>
                  <TableHead className="text-purple-700 dark:text-purple-300 font-semibold">Date</TableHead>
                  <TableHead className="text-blue-700 dark:text-blue-300 font-semibold">Location</TableHead>
                  <TableHead className="text-emerald-700 dark:text-emerald-300 font-semibold">Price</TableHead>
                  <TableHead className="text-amber-700 dark:text-amber-300 font-semibold">Registrations</TableHead>
                  <TableHead className="text-rose-700 dark:text-rose-300 font-semibold">Tickets Remaining</TableHead>
                  <TableHead className="text-right text-violet-700 dark:text-violet-300 font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.events.map((event) => {
                  const capacity = event.capacity || 0;
                  const registrations = event._count?.registrations || 0;
                  const ticketsRemaining = Math.max(0, capacity - registrations);

                  return (
                    <TableRow
                      key={event.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
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
                      <TableCell>{event.location}</TableCell>
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

      {/* Featured App Highlights - Only Events */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
          <span className="text-blue-500">☆</span> Featured App Highlights
        </h2>
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Events</h3>
                <p className="text-sm text-gray-500">Manage events, tickets, and registrations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md uppercase tracking-wide">Active</span>
              <span className="text-gray-400">›</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
