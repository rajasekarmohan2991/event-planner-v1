"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Calendar, ArrowRight, Mail, Building2, Search } from 'lucide-react';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    billingEmail: string;
    createdAt: string;
    logo?: string | null;
    banner?: string | null;
    _count: { members: number };
    eventCount?: number;
}

interface CompanyListClientProps {
    initialCompanies: Tenant[];
}

export default function CompanyListClient({ initialCompanies }: CompanyListClientProps) {
    const router = useRouter();
    const [companies] = useState<Tenant[]>(initialCompanies);
    const [searchQuery, setSearchQuery] = useState("");

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

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.billingEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Separate Super Admin companies from platform-registered companies
    const superAdminCompanies = filteredCompanies.filter(c =>
        c.slug === 'super-admin' || c.slug === 'default-tenant'
    );

    const platformCompanies = filteredCompanies.filter(c =>
        c.slug !== 'super-admin' && c.slug !== 'default-tenant'
    );

    const CompanyCard = ({ company }: { company: Tenant }) => (
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
            {/* Banner Image */}
            <div className={`h-20 relative overflow-hidden`}>
                {company.banner ? (
                    <img src={company.banner} alt={`${company.name} banner`} className="w-full h-full object-cover" />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-r ${getGradient(company.name)}`} />
                )}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
            </div>

            {/* Card Content */}
            <div className="p-4 pt-0 flex-1 flex flex-col relative">
                {/* Avatar overlapping banner */}
                <div className="flex justify-between items-end mb-3 -mt-8 px-2">
                    <div className="w-16 h-16 bg-white rounded-xl shadow-md overflow-hidden flex items-center justify-center relative z-10">
                        {company.logo ? (
                            <img
                                src={company.logo}
                                alt={company.name}
                                className="w-full h-full object-cover scale-110"
                            />
                        ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${getGradient(company.name)} flex items-center justify-center text-white text-xl font-semibold`}>
                                {company.name.charAt(0)}
                            </div>
                        )}
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
    );

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-8">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center shrink-0">
                            <Building2 className="w-12 h-12 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-medium bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                    Event Management Companies
                                </h1>
                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold shadow-sm border border-indigo-200">
                                    {filteredCompanies.length} Total
                                </span>
                            </div>
                            <p className="text-gray-500 mt-1 text-sm md:text-base">
                                Manage and monitor all registered event organizations
                            </p>
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full md:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition-all duration-200"
                            placeholder="Search companies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                {/* Decorative background element */}
                <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none" />
            </div>

            {/* Super Admin Companies Section */}
            {superAdminCompanies.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-pink-600" />
                        <h2 className="text-xl font-semibold text-gray-900">Super Admin Company</h2>
                        <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-semibold">
                            {superAdminCompanies.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                        {superAdminCompanies.map((company) => (
                            <CompanyCard key={company.id} company={company} />
                        ))}
                    </div>
                </div>
            )}

            {/* Platform Registered Companies Section */}
            {platformCompanies.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-xl font-semibold text-gray-900">Platform Registered Companies</h2>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                            {platformCompanies.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                        {platformCompanies.map((company) => (
                            <CompanyCard key={company.id} company={company} />
                        ))}
                    </div>
                </div>
            )}

            {/* No Results State */}
            {filteredCompanies.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                    <Search className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No companies found</p>
                    <p className="text-sm">Try adjusting your search query</p>
                </div>
            )}
        </div>
    );
}
