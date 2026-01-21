"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  CreditCard,
  Download,
  Plus,
  Send,
  Calendar,
  Building2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  recipientName: string;
  recipientEmail: string;
  status: string;
  grandTotal: number;
  currency: string;
  paymentTerms: number;
}

interface FinanceStats {
  totalInvoices: number;
  totalRevenue: number;
  pendingAmount: number;
  paidAmount: number;
  overdueAmount: number;
}

export default function CompanyFinancePage() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetchData();
    }
  }, [params?.id]);

  async function fetchData() {
    try {
      console.log('🏢 Fetching finance data for company:', params.id);
      
      // Fetch company details
      const companyRes = await fetch(`/api/super-admin/companies/${params.id}`, {
        credentials: 'include'
      });
      if (companyRes.ok) {
        const data = await companyRes.json();
        setCompany(data);
        console.log('✅ Company loaded:', data.name);
      }

      // Fetch invoices for this company
      console.log('📄 Fetching invoices for tenantId:', params.id);
      const invoicesRes = await fetch(`/api/finance/invoices?tenantId=${params.id}`, {
        credentials: 'include'
      });
      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        console.log('📊 Invoices received:', data.invoices?.length || 0, 'invoices');
        setInvoices(data.invoices || []);
        
        // Calculate stats
        const invoiceList = data.invoices || [];
        const totalRevenue = invoiceList.reduce((sum: number, inv: Invoice) => sum + (inv.grandTotal || 0), 0);
        const paidAmount = invoiceList.filter((inv: Invoice) => inv.status === 'PAID').reduce((sum: number, inv: Invoice) => sum + (inv.grandTotal || 0), 0);
        const pendingAmount = invoiceList.filter((inv: Invoice) => ['SENT', 'DRAFT'].includes(inv.status)).reduce((sum: number, inv: Invoice) => sum + (inv.grandTotal || 0), 0);
        const overdueAmount = invoiceList.filter((inv: Invoice) => inv.status === 'OVERDUE').reduce((sum: number, inv: Invoice) => sum + (inv.grandTotal || 0), 0);
        
        setStats({
          totalInvoices: invoiceList.length,
          totalRevenue,
          paidAmount,
          pendingAmount,
          overdueAmount
        });
      }
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function formatCurrency(amount: number, currency: string = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  function getPaymentTermLabel(days: number) {
    if (days === 0) return 'Due on Receipt';
    return `Net ${days}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push(`/super-admin/companies/${params.id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Company
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
              <p className="text-gray-600">{company?.name || 'Company'}</p>
            </div>
          </div>
          
          <button
            onClick={() => router.push(`/super-admin/companies/${params.id}/finance/invoices/new`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="text-gray-600 text-sm">Total Invoices</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalInvoices || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-gray-600 text-sm">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(stats?.totalRevenue || 0, company?.currency || 'USD')}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="h-5 w-5 text-yellow-600" />
            <span className="text-gray-600 text-sm">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {formatCurrency(stats?.pendingAmount || 0, company?.currency || 'USD')}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-red-600" />
            <span className="text-gray-600 text-sm">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(stats?.overdueAmount || 0, company?.currency || 'USD')}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => window.open(`/api/finance/reports/tax?tenantId=${params.id}`, '_blank')}
          className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border hover:border-blue-300 transition-colors"
        >
          <Download className="h-5 w-5 text-green-600" />
          <div className="text-left">
            <p className="font-medium text-gray-900">Tax Report</p>
            <p className="text-sm text-gray-500">Download GST/Tax report</p>
          </div>
        </button>
        
        <button
          onClick={() => router.push(`/super-admin/companies/${params.id}/finance/settings`)}
          className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border hover:border-blue-300 transition-colors"
        >
          <CreditCard className="h-5 w-5 text-blue-600" />
          <div className="text-left">
            <p className="font-medium text-gray-900">Finance Settings</p>
            <p className="text-sm text-gray-500">Payment & billing config</p>
          </div>
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
        </div>
        
        {invoices.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No invoices yet</p>
            <button
              onClick={() => router.push(`/super-admin/companies/${params.id}/finance/invoices/new`)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Invoice #</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Recipient</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Due Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Terms</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.number}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{invoice.recipientName}</p>
                        <p className="text-xs text-gray-500">{invoice.recipientEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getPaymentTermLabel(invoice.paymentTerms || 30)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.grandTotal, invoice.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/super-admin/companies/${params.id}/finance/invoices/${invoice.id}`)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          View
                        </button>
                        {invoice.status === 'DRAFT' && (
                          <button
                            onClick={async () => {
                              const email = prompt('Enter recipient email:', invoice.recipientEmail);
                              if (email) {
                                const res = await fetch(`/api/finance/invoices/${invoice.id}/send`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ email })
                                });
                                if (res.ok) {
                                  alert('Invoice sent successfully!');
                                  fetchData();
                                }
                              }
                            }}
                            className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm"
                          >
                            <Send className="h-3 w-3" />
                            Send
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
