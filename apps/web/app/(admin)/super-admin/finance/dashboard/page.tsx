'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
    DollarSign, 
    TrendingUp, 
    TrendingDown, 
    FileText, 
    CreditCard,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Clock,
    Download,
    Filter,
    Calendar,
    Building2,
    Receipt,
    Percent,
    Shield
} from 'lucide-react';

interface DashboardStats {
    totalRevenue: number;
    totalPayouts: number;
    pendingRefunds: number;
    tdsCollected: number;
    invoiceCount: number;
    paidInvoices: number;
    overdueInvoices: number;
    recentPayments: any[];
    recentRefunds: any[];
    topTenants: any[];
}

export default function FinanceDashboardPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30d');
    const [activeTab, setActiveTab] = useState<'overview' | 'tds' | 'refunds' | 'audit'>('overview');

    useEffect(() => {
        fetchDashboardData();
    }, [dateRange]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch various finance data
            const [invoicesRes, refundsRes, tdsRes, auditRes] = await Promise.all([
                fetch('/api/finance/invoices?limit=10'),
                fetch('/api/finance/refunds?limit=10'),
                fetch('/api/finance/tds?limit=10'),
                fetch('/api/finance/audit-logs?limit=20')
            ]);

            const invoices = await invoicesRes.json();
            const refunds = await refundsRes.json();
            const tds = await tdsRes.json();
            const audit = await auditRes.json();

            // Calculate stats
            const invoiceList = invoices.invoices || [];
            const refundList = refunds.refunds || [];
            const tdsList = tds.deductions || [];

            setStats({
                totalRevenue: invoiceList.reduce((sum: number, inv: any) => 
                    inv.status === 'PAID' ? sum + parseFloat(inv.grandTotal || 0) : sum, 0),
                totalPayouts: 0, // Would come from payouts API
                pendingRefunds: refundList.filter((r: any) => r.status === 'PENDING').length,
                tdsCollected: tdsList.reduce((sum: number, t: any) => sum + parseFloat(t.tdsAmount || 0), 0),
                invoiceCount: invoiceList.length,
                paidInvoices: invoiceList.filter((i: any) => i.status === 'PAID').length,
                overdueInvoices: invoiceList.filter((i: any) => i.status === 'OVERDUE').length,
                recentPayments: invoiceList.filter((i: any) => i.status === 'PAID').slice(0, 5),
                recentRefunds: refundList.slice(0, 5),
                topTenants: []
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {trend && (
                        <p className={`text-sm mt-1 flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                            {Math.abs(trend)}% from last period
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
                        <p className="text-gray-500 mt-1">Platform-wide financial overview</p>
                    </div>
                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                        >
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                            <option value="1y">Last year</option>
                        </select>
                        <button
                            onClick={fetchDashboardData}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <RefreshCw className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Revenue"
                        value={formatCurrency(stats?.totalRevenue || 0)}
                        icon={DollarSign}
                        trend={12}
                        color="bg-green-500"
                    />
                    <StatCard
                        title="Invoices"
                        value={stats?.invoiceCount || 0}
                        icon={FileText}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="Pending Refunds"
                        value={stats?.pendingRefunds || 0}
                        icon={RefreshCw}
                        color="bg-orange-500"
                    />
                    <StatCard
                        title="TDS Collected"
                        value={formatCurrency(stats?.tdsCollected || 0, 'INR')}
                        icon={Percent}
                        color="bg-purple-500"
                    />
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            {[
                                { id: 'overview', label: 'Overview', icon: TrendingUp },
                                { id: 'tds', label: 'TDS/Withholding', icon: Percent },
                                { id: 'refunds', label: 'Refunds', icon: RefreshCw },
                                { id: 'audit', label: 'Audit Log', icon: Shield }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4 mr-2" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Recent Payments */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
                                    <div className="space-y-3">
                                        {stats?.recentPayments?.length ? (
                                            stats.recentPayments.map((payment: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center">
                                                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                                        <div>
                                                            <p className="font-medium text-gray-900">{payment.recipientName}</p>
                                                            <p className="text-sm text-gray-500">{payment.number}</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-semibold text-green-600">
                                                        {formatCurrency(payment.grandTotal, payment.currency)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-center py-4">No recent payments</p>
                                        )}
                                    </div>
                                </div>

                                {/* Invoice Status */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                                <span className="text-gray-600">Paid</span>
                                            </div>
                                            <span className="font-semibold">{stats?.paidInvoices || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                                                <span className="text-gray-600">Pending</span>
                                            </div>
                                            <span className="font-semibold">
                                                {(stats?.invoiceCount || 0) - (stats?.paidInvoices || 0) - (stats?.overdueInvoices || 0)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                                                <span className="text-gray-600">Overdue</span>
                                            </div>
                                            <span className="font-semibold">{stats?.overdueInvoices || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tds' && (
                            <TDSSection />
                        )}

                        {activeTab === 'refunds' && (
                            <RefundsSection />
                        )}

                        {activeTab === 'audit' && (
                            <AuditSection />
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <a
                            href="/super-admin/finance/reports"
                            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <FileText className="w-8 h-8 text-blue-500 mb-2" />
                            <span className="text-sm font-medium text-gray-700">Tax Reports</span>
                        </a>
                        <a
                            href="/super-admin/companies"
                            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Building2 className="w-8 h-8 text-green-500 mb-2" />
                            <span className="text-sm font-medium text-gray-700">Companies</span>
                        </a>
                        <a
                            href="/super-admin/settings"
                            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <CreditCard className="w-8 h-8 text-purple-500 mb-2" />
                            <span className="text-sm font-medium text-gray-700">Payment Config</span>
                        </a>
                        <a
                            href="/super-admin/signatures"
                            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Receipt className="w-8 h-8 text-orange-500 mb-2" />
                            <span className="text-sm font-medium text-gray-700">Signatures</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

// TDS Section Component
function TDSSection() {
    const [tdsData, setTdsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/finance/tds')
            .then(res => res.json())
            .then(data => {
                setTdsData(data.deductions || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="text-center py-8">Loading TDS data...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">TDS Deductions</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    + New TDS Entry
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">TDS</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {tdsData.length ? tdsData.map((tds: any) => (
                            <tr key={tds.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="font-medium">{tds.recipientName}</div>
                                    <div className="text-sm text-gray-500">{tds.recipientPan || 'No PAN'}</div>
                                </td>
                                <td className="px-4 py-3 text-sm">{tds.recipientType}</td>
                                <td className="px-4 py-3 text-right">₹{tds.grossAmount?.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-red-600">₹{tds.tdsAmount?.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right font-medium">₹{tds.netAmount?.toLocaleString()}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        tds.status === 'DEPOSITED' ? 'bg-green-100 text-green-700' :
                                        tds.status === 'DEDUCTED' ? 'bg-blue-100 text-blue-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {tds.status}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                    No TDS deductions found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Refunds Section Component
function RefundsSection() {
    const [refunds, setRefunds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/finance/refunds')
            .then(res => res.json())
            .then(data => {
                setRefunds(data.refunds || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleAction = async (id: string, action: string) => {
        try {
            await fetch(`/api/finance/refunds/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            // Refresh data
            const res = await fetch('/api/finance/refunds');
            const data = await res.json();
            setRefunds(data.refunds || []);
        } catch (error) {
            console.error('Error updating refund:', error);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading refunds...</div>;
    }

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Refund Requests</h3>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requester</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {refunds.length ? refunds.map((refund: any) => (
                            <tr key={refund.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="font-medium">{refund.requesterName}</div>
                                    <div className="text-sm text-gray-500">{refund.requesterEmail}</div>
                                </td>
                                <td className="px-4 py-3 text-sm">{refund.reasonCategory || 'N/A'}</td>
                                <td className="px-4 py-3 text-right font-medium">
                                    {refund.currency} {refund.refundAmount?.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        refund.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                        refund.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                                        refund.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {refund.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {refund.status === 'PENDING' && (
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleAction(refund.id, 'APPROVE')}
                                                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleAction(refund.id, 'REJECT')}
                                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                    {refund.status === 'APPROVED' && (
                                        <button
                                            onClick={() => handleAction(refund.id, 'PROCESS')}
                                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                        >
                                            Process
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    No refund requests found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Audit Section Component
function AuditSection() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/finance/audit-logs?limit=50')
            .then(res => res.json())
            .then(data => {
                setLogs(data.logs || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="text-center py-8">Loading audit logs...</div>;
    }

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Finance Audit Trail</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {logs.length ? logs.map((log: any) => (
                    <div key={log.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                        <div className={`p-2 rounded-full mr-3 ${
                            log.actionType?.includes('FAILED') ? 'bg-red-100' :
                            log.actionType?.includes('RECEIVED') || log.actionType?.includes('COMPLETED') ? 'bg-green-100' :
                            'bg-blue-100'
                        }`}>
                            {log.actionType?.includes('FAILED') ? (
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                            ) : log.actionType?.includes('RECEIVED') || log.actionType?.includes('COMPLETED') ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                                <Clock className="w-4 h-4 text-blue-600" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-900">{log.actionType}</span>
                                <span className="text-xs text-gray-500">
                                    {new Date(log.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{log.actionDescription}</p>
                            {log.amount && (
                                <p className="text-sm font-medium text-gray-700 mt-1">
                                    Amount: {log.currency} {log.amount?.toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-gray-500 py-8">No audit logs found</p>
                )}
            </div>
        </div>
    );
}
