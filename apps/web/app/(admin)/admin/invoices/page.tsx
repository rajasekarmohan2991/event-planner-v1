"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Search,
    Filter,
    Download,
    Eye,
    Edit,
    Trash2,
    FileText,
    DollarSign,
    Calendar,
    Loader2,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Invoice {
    id: string;
    number: string;
    date: string;
    dueDate: string;
    recipientType: string;
    recipientName: string;
    recipientEmail: string;
    status: string;
    grandTotal: number;
    currency: string;
    event?: { id: string; name: string };
    payments: any[];
}

export default function InvoicesPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");

    useEffect(() => {
        loadInvoices();
    }, []);

    async function loadInvoices() {
        try {
            const res = await fetch("/api/invoices");
            if (res.ok) {
                const data = await res.json();
                setInvoices(data.invoices);
            }
        } catch (error) {
            console.error("Failed to load invoices:", error);
        } finally {
            setLoading(false);
        }
    }

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch =
            inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.recipientEmail?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
        const matchesType = typeFilter === "ALL" || inv.recipientType === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    function getStatusBadge(status: string) {
        const config: Record<string, { label: string; className: string; icon: any }> = {
            DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-700", icon: Edit },
            SENT: { label: "Sent", className: "bg-blue-100 text-blue-700", icon: FileText },
            PAID: { label: "Paid", className: "bg-green-100 text-green-700", icon: CheckCircle },
            PARTIAL: { label: "Partial", className: "bg-yellow-100 text-yellow-700", icon: Clock },
            OVERDUE: { label: "Overdue", className: "bg-red-100 text-red-700", icon: AlertCircle },
            CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-500", icon: XCircle }
        };

        const { label, className, icon: Icon } = config[status] || config.DRAFT;

        return (
            <Badge className={`${className} flex items-center gap-1`}>
                <Icon className="w-3 h-3" />
                {label}
            </Badge>
        );
    }

    function formatCurrency(amount: number, currency: string) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
                    <p className="text-gray-500 mt-1">Manage invoices, payments, and receipts</p>
                </div>
                <Button
                    onClick={() => router.push("/admin/invoices/create")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Invoices", value: invoices.length, icon: FileText, color: "indigo" },
                    { label: "Paid", value: invoices.filter(i => i.status === "PAID").length, icon: CheckCircle, color: "green" },
                    { label: "Pending", value: invoices.filter(i => i.status === "SENT").length, icon: Clock, color: "yellow" },
                    { label: "Overdue", value: invoices.filter(i => i.status === "OVERDUE").length, icon: AlertCircle, color: "red" }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search invoices..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="SENT">Sent</option>
                        <option value="PAID">Paid</option>
                        <option value="PARTIAL">Partial</option>
                        <option value="OVERDUE">Overdue</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>

                    {/* Type Filter */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="ALL">All Types</option>
                        <option value="EXHIBITOR">Exhibitor</option>
                        <option value="VENDOR">Vendor</option>
                        <option value="SPONSOR">Sponsor</option>
                        <option value="SPEAKER">Speaker</option>
                        <option value="CUSTOMER">Customer</option>
                    </select>
                </div>
            </div>

            {/* Invoice Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredInvoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="font-medium">No invoices found</p>
                                    <p className="text-sm">Create your first invoice to get started</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInvoices.map((invoice) => (
                                <TableRow key={invoice.id} className="hover:bg-gray-50">
                                    <TableCell className="font-medium">{invoice.number}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-gray-900">{invoice.recipientName}</p>
                                            <p className="text-xs text-gray-500">{invoice.recipientEmail}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{invoice.recipientType}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {invoice.event ? (
                                            <span className="text-sm text-gray-600">{invoice.event.name}</span>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{formatDate(invoice.date)}</TableCell>
                                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                                    <TableCell className="font-semibold">
                                        {formatCurrency(invoice.grandTotal, invoice.currency)}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/admin/invoices/${invoice.id}`)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/admin/invoices/${invoice.id}/download`)}
                                            >
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
