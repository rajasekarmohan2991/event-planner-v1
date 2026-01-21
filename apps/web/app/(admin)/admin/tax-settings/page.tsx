"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Globe, Info, CheckCircle } from "lucide-react";

interface TaxStructure {
  id: string;
  name: string;
  rate: number;
  description?: string;
  countryCode?: string;
  currencyCode?: string;
  isDefault: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export default function CompanyTaxSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [taxStructures, setTaxStructures] = useState<TaxStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/signin");
      return;
    }
    fetchTaxStructures();
  }, [session, status, router]);

  async function fetchTaxStructures() {
    try {
      const user = session?.user as any;
      const tenantId = user?.currentTenantId;

      if (!tenantId) {
        console.error("No tenant ID found");
        setLoading(false);
        return;
      }

      // Fetch company info to get country
      const companyRes = await fetch(`/api/super-admin/companies/${tenantId}`);
      if (companyRes.ok) {
        const company = await companyRes.json();
        setCompanyInfo(company);
      }

      // Fetch tax structures for this company
      const res = await fetch(`/api/super-admin/companies/${tenantId}/tax-structures`);
      if (res.ok) {
        const data = await res.json();
        setTaxStructures(data.taxStructures || []);
      }
    } catch (error) {
      console.error("Error fetching tax structures:", error);
    } finally {
      setLoading(false);
    }
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
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Globe className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tax Settings</h1>
            <p className="text-gray-600">View applicable tax structures for your company</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Read-Only View</p>
            <p>These tax structures are configured based on your company's registration country ({companyInfo?.country || 'Not set'}). 
            Contact your administrator to modify tax settings.</p>
          </div>
        </div>
      </div>

      {/* Company Info */}
      {companyInfo && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Company Name</p>
              <p className="font-medium text-gray-900">{companyInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Registration Country</p>
              <p className="font-medium text-gray-900">{companyInfo.country || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Currency</p>
              <p className="font-medium text-gray-900">{companyInfo.currency || 'USD'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tax Structures */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Applicable Tax Structures</h2>
        </div>

        {taxStructures.length === 0 ? (
          <div className="p-8 text-center">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No tax structures configured</p>
            <p className="text-sm text-gray-500">Contact your administrator to set up tax structures for your company.</p>
          </div>
        ) : (
          <div className="divide-y">
            {taxStructures.map((tax) => (
              <div key={tax.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{tax.name}</h3>
                      {tax.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          <CheckCircle className="h-3 w-3" />
                          Default
                        </span>
                      )}
                    </div>
                    {tax.description && (
                      <p className="text-gray-600 mb-3">{tax.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Tax Rate</p>
                        <p className="font-medium text-gray-900">{tax.rate}%</p>
                      </div>
                      {tax.countryCode && (
                        <div>
                          <p className="text-sm text-gray-600">Country</p>
                          <p className="font-medium text-gray-900">{tax.countryCode}</p>
                        </div>
                      )}
                      {tax.currencyCode && (
                        <div>
                          <p className="text-sm text-gray-600">Currency</p>
                          <p className="font-medium text-gray-900">{tax.currencyCode}</p>
                        </div>
                      )}
                      {tax.effectiveFrom && (
                        <div>
                          <p className="text-sm text-gray-600">Effective From</p>
                          <p className="font-medium text-gray-900">
                            {new Date(tax.effectiveFrom).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
