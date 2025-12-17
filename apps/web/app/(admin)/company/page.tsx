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
          <p className="text-gray-600">Company Dashboard</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          className="bg-gradient-to-br from-white to-blue-50/30 rounded-lg shadow-sm border border-blue-100/50 p-6 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{dashboard.stats.totalEvents}</div>
              <div className="text-gray-600">Total Events</div>
            </div>
          </div>
        </div>
        <div
          className="bg-gradient-to-br from-white to-green-50/30 rounded-lg shadow-sm border border-green-100/50 p-6 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{dashboard.stats.totalMembers}</div>
              <div className="text-gray-600">Team Members</div>
            </div>
          </div>
        </div>
        <div
          className="bg-gradient-to-br from-white to-purple-50/30 rounded-lg shadow-sm border border-purple-100/50 p-6 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{dashboard.stats.totalRegistrations}</div>
              <div className="text-gray-600">Total Registrations</div>
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
