"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Users, Calendar, ArrowRight, Mail, Building2 } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  billingEmail: string;
  createdAt: string;
  _count: { members: number };
  eventCount?: number;
}

export default function SuperAdminCompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Tenant[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [companiesRes, analyticsRes] = await Promise.all([
        fetch("/api/super-admin/companies", {
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch("/api/admin/analytics", {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
      ]);

      if (companiesRes.ok) {
        const data = await companiesRes.json();
        const sorted = (data.companies || []).sort((a: any, b: any) => {
          const isSuperA = a.slug === 'super-admin' || a.slug === 'default-tenant';
          const isSuperB = b.slug === 'super-admin' || b.slug === 'default-tenant';
          if (isSuperA && !isSuperB) return -1;
          if (!isSuperA && isSuperB) return 1;
          return 0;
        });
        setCompanies(sorted);
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
      TRIAL: "bg-blue-100 text-blue-700 border-blue-200",
      SUSPENDED: "bg-rose-100 text-rose-700 border-rose-200"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getGradient = (name: string) => {
    const gradients = [
      "from-blue-500 to-cyan-400",
      "from-purple-500 to-pink-400",
      "from-orange-400 to-rose-400",
      "from-emerald-400 to-teal-400",
      "from-indigo-500 to-purple-500"
    ];
    const index = name.length % gradients.length;
    return gradients[index];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 mt-4 font-medium">Loading companies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6 flex items-center justify-between relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-8">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center">
            <Building2 className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-medium bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Event Management Companies
            </h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">
              Manage and monitor all registered event organizations
            </p>
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-indigo-50/50 to-transparent" />
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {companies.map((company) => (
          <div
            key={company.id}
            onClick={() => {
              if (company.slug === 'super-admin' || company.slug === 'default-tenant') {
                router.push('/admin'); // Detailed View for Super Admin Tenant
              } else {
                router.push(`/super-admin/companies/${company.id}`);
              }
            }}
            className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden flex flex-col"
          >
            {/* Banner Image (Gradient) */}
            <div className={`h-20 bg-gradient-to-r ${getGradient(company.name)} relative`}>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
            </div>

            {/* Card Content */}
            <div className="p-4 pt-0 flex-1 flex flex-col relative">
              {/* Avatar overlapping banner */}
              <div className="flex justify-between items-end mb-3 -mt-8 px-2">
                <div className="w-16 h-16 bg-white rounded-xl shadow-md p-0.5">
                  <div className={`w-full h-full rounded-lg bg-gradient-to-br ${getGradient(company.name)} flex items-center justify-center text-white text-xl font-semibold`}>
                    {company.name.charAt(0)}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(company.status)} shadow-sm`}>
                  {company.status}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {company.name}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium">@{company.slug}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 py-3 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-gray-900">{company.eventCount || 0}</div>
                      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Events</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-gray-900">{company._count.members}</div>
                      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Members</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{company.billingEmail}</span>
                </div>
              </div>

              {/* Footer / More Details */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="w-full py-2 px-3 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium group-hover:shadow-inner">
                  More Details
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
