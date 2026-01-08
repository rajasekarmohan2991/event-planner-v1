"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    DollarSign,
    TrendingUp,
    FileText,
    CreditCard,
    Download,
    Filter,
    Search,
    Calendar,
    Building2,
    Users,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    MoreVertical,
    CheckCircle,
    Clock,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FinancialSummary {
    totalRevenue: number;
    pendingPayments: number;
    completedPayments: number;
    overdueInvoices: number;
    monthlyRevenue: number;
    monthlyGrowth: number;
}

interface Invoice {
    id: string;
    number: string;
    recipientType: string;
    recipientName: string;
    companyName: string;
    eventName: string;
    amount: number;
    status: string;
    dueDate: string;
    createdAt: string;
}

export default function SuperAdminFinancePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("invoices");
    const [summary, setSummary] = useState<FinancialSummary>({
        totalRevenue: 0,
        pendingPayments: 0,
        completedPayments: 0,
        overdueInvoices: 0,
        monthlyRevenue: 0,
        monthlyGrowth: 0
    });
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [companyFilter, setCompanyFilter] = useState("ALL");
    const [dateRange, setDateRange] = useState("ALL");

    useEffect(() => {
        loadFinancialData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [invoices, searchQuery, statusFilter, typeFilter, companyFilter, dateRange]);

    async function loadFinancialData() {
        try {
            setLoading(true);

            // Load summary
            const summaryRes = await fetch("/api/super-admin/finance/summary");
            if (summaryRes.ok) {
                const data = await summaryRes.json();
                setSummary(data.summary);
            }

            // Load all invoices across all companies
            const invoicesRes = await fetch("/api/super-admin/finance/invoices");
            if (invoicesRes.ok) {
                const data = await invoicesRes.json();
                setInvoices(data.invoices);
            }
        } catch (error) {
            console.error("Failed to load financial data:", error);
        } finally {
            setLoading(false);
        }
    }

    function applyFilters() {
        let filtered = [...invoices];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(inv =>
                inv.number.toLowerCase().includes(query) ||
                inv.recipientName.toLowerCase().includes(query) ||
                inv.companyName.toLowerCase().includes(query) ||
                inv.eventName.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (statusFilter !== "ALL") {
            filtered = filtered.filter(inv => inv.status === statusFilter);
        }

        // Type filter
        if (typeFilter !== "ALL") {
            filtered = filtered.filter(inv => inv.recipientType === typeFilter);
        }

        // Company filter
        if (companyFilter !== "ALL") {
            filtered = filtered.filter(inv => inv.companyName === companyFilter);
        }

        // Date range filter
        if (dateRange !== "ALL") {
            const now = new Date();
            const filterDate = new Date();

            switch (dateRange) {
                case "7D":
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case "30D":
                    filterDate.setDate(now.getDate() - 30);
                    break;
                case "90D":
                    filterDate.setDate(now.getDate() - 90);
                    break;
            }

            filtered = filtered.filter(inv => new Date(inv.createdAt) >= filterDate);
        }

        setFilteredInvoices(filtered);
    }

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function getStatusBadge(status: string) {
        const config: Record<string, { label: string; className: string; icon: any }> = {
            PAID: { label: "Paid", className: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
            PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
            OVERDUE: { label: "Overdue", className: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
            PARTIAL: { label: "Partial", className: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
        };

        const { label, className, icon: Icon } = config[status] || config.PENDING;

        return (
            <Badge className={`${className} flex items-center gap-1 border`}>
                <Icon className="w-3 h-3" />
                {label}
            </Badge>
        );
    }

    const uniqueCompanies = Array.from(new Set(invoices.map(inv => inv.companyName)));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finance</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Manage payments, invoices, and financial operations across all companies
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => router.push('/super-admin/finance/reports')}
                            >
                                <TrendingUp className="w-4 h-4" />
                                <span className="hidden sm:inline">Reports</span>
                            </Button>
                            <Button variant="outline" className="gap-2">
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Export</span>
                            </Button>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                                <FileText className="w-4 h-4" />
                                <span className="hidden sm:inline">New Invoice</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatCurrency(summary.totalRevenue)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-3">
                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">
                                {summary.monthlyGrowth}%
                            </span>
                            <span className="text-sm text-gray-500">vs last month</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Payments</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatCurrency(summary.pendingPayments)}
                                </p>
                            </div>
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-3">
                            {invoices.filter(i => i.status === 'PENDING').length} invoices
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatCurrency(summary.completedPayments)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-3">
                            {invoices.filter(i => i.status === 'PAID').length} invoices
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {summary.overdueInvoices}
                                </p>
                            </div>
                            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-3">Requires attention</p>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1">
                        <TabsTrigger value="payouts" className="gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span className="hidden sm:inline">Payouts</span>
                        </TabsTrigger>
                        <TabsTrigger value="charges" className="gap-2">
                            <CreditCard className="w-4 h-4" />
                            <span className="hidden sm:inline">Charges & Credits</span>
                        </TabsTrigger>
                        <TabsTrigger value="invoices" className="gap-2">
                            <FileText className="w-4 h-4" />
                            Invoices
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="gap-2">
                            <span className="hidden sm:inline">Settings</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Invoices Tab */}
                    <TabsContent value="invoices" className="space-y-4">
                        {/* Filters */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Search */}
                                <div className="relative lg:col-span-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search invoices..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                {/* Status Filter */}
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Statuses</SelectItem>
                                        <SelectItem value="PAID">Paid</SelectItem>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="OVERDUE">Overdue</SelectItem>
                                        <SelectItem value="PARTIAL">Partial</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Type Filter */}
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Types</SelectItem>
                                        <SelectItem value="VENDOR">Vendor</SelectItem>
                                        <SelectItem value="SPONSOR">Sponsor</SelectItem>
                                        <SelectItem value="EXHIBITOR">Exhibitor</SelectItem>
                                        <SelectItem value="SPEAKER">Speaker</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Company Filter */}
                                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Company" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Companies</SelectItem>
                                        {uniqueCompanies.map(company => (
                                            <SelectItem key={company} value={company}>{company}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Empty State */}
                        {filteredInvoices.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                                    <FileText className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    You have no invoices.
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    Invoices will appear here once companies create them for vendors, sponsors, and exhibitors.
                                </p>
                            </div>
                        ) : (
                            /* Desktop Table */
                            <>
                                <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Invoice #</TableHead>
                                                <TableHead>Recipient</TableHead>
                                                <TableHead>Company</TableHead>
                                                <TableHead>Event</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Due Date</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredInvoices.map((invoice) => (
                                                <TableRow key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <TableCell className="font-medium">{invoice.number}</TableCell>
                                                    <TableCell>{invoice.recipientName}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="w-4 h-4 text-gray-400" />
                                                            {invoice.companyName}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                                        {invoice.eventName}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{invoice.recipientType}</Badge>
                                                    </TableCell>
                                                    <TableCell className="font-semibold">
                                                        {formatCurrency(invoice.amount)}
                                                    </TableCell>
                                                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                                                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.push(`/super-admin/finance/invoices/${invoice.id}`)}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="md:hidden space-y-4">
                                    {filteredInvoices.map((invoice) => (
                                        <div
                                            key={invoice.id}
                                            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{invoice.number}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.recipientName}</p>
                                                </div>
                                                {getStatusBadge(invoice.status)}
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                    <Building2 className="w-4 h-4" />
                                                    {invoice.companyName}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Event:</span>
                                                    <span className="text-gray-900 dark:text-white">{invoice.eventName}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Type:</span>
                                                    <Badge variant="outline">{invoice.recipientType}</Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Amount:</span>
                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                        {formatCurrency(invoice.amount)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Due:</span>
                                                    <span className="text-gray-900 dark:text-white">{formatDate(invoice.dueDate)}</span>
                                                </div>
                                            </div>

                                            <Button
                                                variant="outline"
                                                className="w-full mt-4"
                                                onClick={() => router.push(`/super-admin/finance/invoices/${invoice.id}`)}
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Details
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* Other Tabs - Placeholder */}
                    <TabsContent value="payouts">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Payouts</h3>
                            <p className="text-sm text-gray-500">Payout management coming soon</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="charges">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Charges & Credits</h3>
                            <p className="text-sm text-gray-500">Charge management coming soon</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="settings">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                            <h3 className="text-lg font-semibold mb-2">Finance Settings</h3>
                            <p className="text-sm text-gray-500">Configure payment methods, tax settings, and more</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
