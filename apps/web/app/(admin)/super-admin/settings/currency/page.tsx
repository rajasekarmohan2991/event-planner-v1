"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AVAILABLE_CURRENCIES, Currency, getCurrencyByCode } from '@/lib/currency';
import { Globe, DollarSign, Settings } from 'lucide-react';

export default function SuperAdminCurrencyPage() {
  const { data: session } = useSession();
  const [globalCurrency, setGlobalCurrency] = useState<Currency>(getCurrencyByCode('USD'));
  const [companyCurrencies, setCompanyCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrencySettings();
  }, []);

  const loadCurrencySettings = async () => {
    try {
      setLoading(true);

      // Load global currency settings
      const globalRes = await fetch('/api/super-admin/settings/currency');
      if (globalRes.ok) {
        const data = await globalRes.json();
        setGlobalCurrency(getCurrencyByCode(data.globalCurrency || 'USD'));
      }

      // Load company-specific currencies
      const companiesRes = await fetch('/api/super-admin/companies');
      if (companiesRes.ok) {
        const data = await companiesRes.json();
        setCompanyCurrencies(data.companies || []);
      }
    } catch (error) {
      console.error('Error loading currency settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGlobalCurrency = async (currencyCode: string) => {
    try {
      const res = await fetch('/api/super-admin/settings/currency', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ globalCurrency: currencyCode })
      });

      if (res.ok) {
        setGlobalCurrency(getCurrencyByCode(currencyCode));
      }
    } catch (error) {
      console.error('Error updating global currency:', error);
    }
  };

  const updateCompanyCurrency = async (companyId: string, currencyCode: string) => {
    try {
      const res = await fetch(`/api/super-admin/companies/${companyId}/currency`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: currencyCode })
      });

      if (res.ok) {
        // Update local state
        setCompanyCurrencies(prev =>
          prev.map(company =>
            company.id === companyId
              ? { ...company, currency: currencyCode }
              : company
          )
        );
      }
    } catch (error) {
      console.error('Error updating company currency:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading currency settings...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Currency Management</h1>
        <p className="text-gray-600">Manage global and company-specific currency settings</p>
      </div>

      {/* Global Currency Settings */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Global Default Currency</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Currency for New Companies
            </label>
            <select
              value={globalCurrency.code}
              onChange={(e) => updateGlobalCurrency(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {AVAILABLE_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code} - {currency.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              This will be the default currency for new companies
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Current Global Settings</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Currency:</strong> {globalCurrency.name}</div>
              <div><strong>Symbol:</strong> {globalCurrency.symbol}</div>
              <div><strong>Code:</strong> {globalCurrency.code}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Currencies */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-semibold">Supported Currencies</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVAILABLE_CURRENCIES.map((currency) => (
            <div key={currency.code} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{currency.code}</div>
                  <div className="text-sm text-gray-600">{currency.name}</div>
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {currency.symbol}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Company Currency Overview */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold">Company Currency Settings</h2>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Each company can have its own base currency. If not set, they will use the global default currency.
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companyCurrencies.map((company) => {
                const companyCurrency = getCurrencyByCode(company.currency || globalCurrency.code);
                const isUsingGlobal = !company.currency || company.currency === globalCurrency.code;

                return (
                  <tr key={company.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{company.name}</div>
                      <div className="text-sm text-gray-500">{company.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {company.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg">{companyCurrency.symbol}</span>
                        <span className="font-medium">{companyCurrency.code}</span>
                        {isUsingGlobal && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            (Global Default)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{companyCurrency.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${company.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={company.currency || globalCurrency.code}
                        onChange={(e) => updateCompanyCurrency(company.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value={globalCurrency.code}>
                          Use Global ({globalCurrency.code})
                        </option>
                        <option disabled>───────────</option>
                        {AVAILABLE_CURRENCIES.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code} - {currency.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
