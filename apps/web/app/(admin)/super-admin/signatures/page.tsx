"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  CheckCircle,
  XCircle,
  Settings,
  Building2,
  Shield,
  AlertCircle,
  RefreshCw,
  Search
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CompanySignatureConfig {
  id: string;
  name: string;
  docuSignEnabled: boolean;
  signatureQuota: number;
  signaturesUsed: number;
  subscriptionPlan: string;
  status: string;
}

export default function SuperAdminSignaturesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanySignatureConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingDocuSign, setTestingDocuSign] = useState(false);
  const [docuSignStatus, setDocuSignStatus] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    try {
      const res = await fetch('/api/super-admin/companies');
      if (res.ok) {
        const data = await res.json();
        // Map companies to signature config format
        const configs = (data.companies || []).map((company: any) => ({
          id: company.id,
          name: company.name,
          docuSignEnabled: company.docuSignEnabled || false,
          signatureQuota: company.signatureQuota || 0,
          signaturesUsed: company.signaturesUsed || 0,
          subscriptionPlan: company.subscriptionPlan || 'FREE',
          status: company.status || 'ACTIVE'
        }));
        setCompanies(configs);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  }

  async function testDocuSign() {
    setTestingDocuSign(true);
    try {
      const res = await fetch('/api/signatures/test-docusign');
      if (res.ok) {
        const data = await res.json();
        setDocuSignStatus(data);
      }
    } catch (error) {
      console.error('Error testing DocuSign:', error);
    } finally {
      setTestingDocuSign(false);
    }
  }

  async function toggleDocuSign(companyId: string, enabled: boolean) {
    try {
      const res = await fetch(`/api/super-admin/companies/${companyId}/docusign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });

      if (res.ok) {
        fetchCompanies();
      }
    } catch (error) {
      console.error('Error toggling DocuSign:', error);
    }
  }

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Digital Signatures Configuration</h1>
            <p className="text-gray-600 mt-1">Manage DocuSign access and signature quotas for companies</p>
          </div>

          <button
            onClick={testDocuSign}
            disabled={testingDocuSign}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            {testingDocuSign ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            Test DocuSign Connection
          </button>
        </div>

        {/* DocuSign Status */}
        {docuSignStatus && (
          <div className={`p-4 rounded-lg mb-4 ${docuSignStatus.connection === 'success'
              ? 'bg-green-50 border border-green-200'
              : docuSignStatus.configured
                ? 'bg-red-50 border border-red-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
            <div className="flex items-start gap-3">
              {docuSignStatus.connection === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : docuSignStatus.configured ? (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{docuSignStatus.message}</p>
                {docuSignStatus.details.missing && (
                  <p className="text-sm text-gray-600 mt-1">
                    Missing: {docuSignStatus.details.missing.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span className="text-gray-600 text-sm">Total Companies</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-gray-600 text-sm">DocuSign Enabled</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {companies.filter(c => c.docuSignEnabled).length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <span className="text-gray-600 text-sm">Enterprise Plans</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {companies.filter(c => c.subscriptionPlan === 'ENTERPRISE').length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-5 w-5 text-orange-600" />
            <span className="text-gray-600 text-sm">Total Signatures</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {companies.reduce((sum, c) => sum + c.signaturesUsed, 0)}
          </p>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Company Signature Access</h2>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No companies found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Company</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Plan</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">DocuSign</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Quota</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Used</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={
                        company.subscriptionPlan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800' :
                          company.subscriptionPlan === 'PRO' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                      }>
                        {company.subscriptionPlan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={company.docuSignEnabled}
                          onChange={(e) => toggleDocuSign(company.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {company.signatureQuota === 0 ? 'Unlimited' : company.signatureQuota}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {company.signaturesUsed}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={
                        company.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }>
                        {company.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/super-admin/companies/${company.id}/settings`)}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                      >
                        <Settings className="w-4 h-4" />
                        Configure
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">About Digital Signatures</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• DocuSign integration is available for PRO and ENTERPRISE plans</li>
              <li>• Companies without DocuSign can still use internal signature system</li>
              <li>• Signature quotas are reset monthly based on subscription plan</li>
              <li>• Configure DocuSign API keys in Settings → Integrations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
