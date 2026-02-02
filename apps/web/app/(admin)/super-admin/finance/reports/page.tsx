"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    TrendingUp,
    DollarSign,
    Calendar,
    Building2,
    Users,
    Loader2,
    Download,
    Filter,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface ReportData {
    revenueByMonth: Array<{ month: string; revenue: number; invoices: number }>;
    revenueByCompany: Array<{ name: string; revenue: number; percentage: number }>;
    revenueByType: Array<{ type: string; revenue: number; count: number }>;
    revenueByStatus: Array<{ status: string; amount: number; count: number }>;
    topVendors: Array<{ name: string; totalPaid: number; invoiceCount: number }>;
    summary: {
        totalRevenue: number;
        averageInvoice: number;
        totalInvoices: number;
        paidInvoices: number;
        pendingAmount: number;
        overdueAmount: number;
    };
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function FinanceReportsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [timeRange, setTimeRange] = useState("12M");
    const [companyFilter, setCompanyFilter] = useState("ALL");

    useEffect(() => {
        loadReportData();
    }, [timeRange, companyFilter]);

    async function loadReportData() {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                timeRange,
                company: companyFilter
            });

            const res = await fetch(`/api/super-admin/finance/reports?${params}`);
            if (res.ok) {
                const data = await res.json();
                setReportData(data);
            }
        } catch (error) {
            console.error("Failed to load report data:", error);
        } finally {
            setLoading(false);
        }
    }

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!reportData) {
        return <div className="p-6">Failed to load report data</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Analytics and insights across all companies
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Select value={timeRange} onValueChange={setTimeRange}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3M">Last 3 Months</SelectItem>
                                    <SelectItem value="6M">Last 6 Months</SelectItem>
                                    <SelectItem value="12M">Last 12 Months</SelectItem>
                                    <SelectItem value="ALL">All Time</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" className="gap-2">
                                <Download className="w-4 h-4" />
                                Export PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatCurrency(reportData.summary.totalRevenue)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-3">
                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">12.5%</span>
                            <span className="text-sm text-gray-500">vs last period</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Average Invoice</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatCurrency(reportData.summary.averageInvoice)}
                                </p>
                            </div>
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-3">
                            {reportData.summary.totalInvoices} total invoices
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Collection Rate</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {Math.round((reportData.summary.paidInvoices / reportData.summary.totalInvoices) * 100)}%
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-3">
                            {reportData.summary.paidInvoices} of {reportData.summary.totalInvoices} paid
                        </p>
                    </div>
                </div>

                {/* Revenue Trend Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportData.revenueByMonth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#6366f1"
                                strokeWidth={2}
                                name="Revenue"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue by Company */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold mb-4">Revenue by Company</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={reportData.revenueByCompany}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="revenue"
                                >
                                    {reportData.revenueByCompany.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Revenue by Type */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold mb-4">Revenue by Recipient Type</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={reportData.revenueByType}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="type" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                <Legend />
                                <Bar dataKey="revenue" fill="#6366f1" name="Revenue" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Vendors Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold mb-4">Top Recipients</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Recipient
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Total Paid
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Invoices
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Avg Invoice
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {reportData.topVendors.map((vendor, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {vendor.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(vendor.totalPaid)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-400">
                                            {vendor.invoiceCount}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-400">
                                            {formatCurrency(vendor.totalPaid / vendor.invoiceCount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
