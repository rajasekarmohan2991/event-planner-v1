'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Settings, Shield, Coins, Globe, Database, Mail,
  Bell, Server, Lock, DollarSign, Search
} from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AVAILABLE_CURRENCIES, Currency, getCurrencyByCode } from '@/lib/currency'
import ModuleAccessMatrix from '@/components/admin/ModuleAccessMatrix'

export default function SuperAdminSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Currency State
  const [globalCurrency, setGlobalCurrency] = useState<Currency>(getCurrencyByCode('USD'))
  const [companyCurrencies, setCompanyCurrencies] = useState<any[]>([])
  const [currencyLoading, setCurrencyLoading] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
    }
  }, [session, status, router])

  useEffect(() => {
    loadCurrencySettings()
  }, [])

  const loadCurrencySettings = async () => {
    try {
      setCurrencyLoading(true)

      // Load global currency settings
      const globalRes = await fetch('/api/super-admin/settings/currency')
      if (globalRes.ok) {
        const data = await globalRes.json()
        setGlobalCurrency(getCurrencyByCode(data.globalCurrency || 'USD'))
      }

      // Load company-specific currencies
      const companiesRes = await fetch('/api/super-admin/companies')
      if (companiesRes.ok) {
        const data = await companiesRes.json()
        setCompanyCurrencies(data.companies || [])
      }
    } catch (error) {
      console.error('Error loading currency settings:', error)
    } finally {
      setCurrencyLoading(false)
    }
  }

  const updateCompanyCurrency = async (companyId: string, currencyCode: string) => {
    try {
      const res = await fetch(`/api/super-admin/companies/${companyId}/currency`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: currencyCode })
      })

      if (res.ok) {
        setCompanyCurrencies(prev =>
          prev.map(company =>
            company.id === companyId
              ? { ...company, currency: currencyCode }
              : company
          )
        )
      }
    } catch (error) {
      console.error('Error updating company currency:', error)
    }
  }

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>
  }

  const systemInfo = {
    version: 'v1.0.0',
    environment: process.env.NODE_ENV || 'Development',
    uptime: '2h 15m'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <Settings className="h-6 w-6" />
          System Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure system-wide settings and permissions
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border p-1 rounded-lg">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gray-100">Overview</TabsTrigger>
          <TabsTrigger value="currency" className="data-[state=active]:bg-gray-100">Currency</TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-gray-100">Permissions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* General Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">General</h3>
                    <p className="text-xs text-gray-500">Basic system configuration</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Site Name</span>
                  <span className="font-medium text-gray-900">AyPhen Planner</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Time Zone</span>
                  <span className="font-medium text-gray-900">UTC+05:30</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Language</span>
                  <span className="font-medium text-gray-900">English</span>
                </div>
              </div>
            </div>

            {/* Database */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Database</h3>
                    <p className="text-xs text-gray-500">Database configuration</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-green-600">Connected</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Type</span>
                  <span className="font-medium text-gray-900">PostgreSQL</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Version</span>
                  <span className="font-medium text-gray-900">16.x</span>
                </div>
              </div>
            </div>

            {/* Currency Summary Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow h-full">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-lg">
                    <Coins className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Currency</h3>
                    <p className="text-xs text-gray-500">Payment & Exchange</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Base Currency</span>
                  <span className="font-medium text-gray-900">{globalCurrency.code} ({globalCurrency.symbol})</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Multi-currency</span>
                  <span className="font-medium text-green-600">Enabled</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Provider</span>
                  <span className="font-medium text-gray-900">ExchangeRate API</span>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-xs text-gray-500">Email service configuration</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Service</span>
                  <span className="font-medium text-gray-900">SMTP / AWS SES</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-gray-600">From Address</span>
                  <span className="font-medium text-gray-900 truncate">noreply@ayphen.com</span>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Security</h3>
                    <p className="text-xs text-gray-500">Security and authentication</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Two-Factor Auth</span>
                  <span className="font-medium text-orange-600">Optional</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Session Timeout</span>
                  <span className="font-medium text-gray-900">24 hours</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Password Policy</span>
                  <span className="font-medium text-green-600">Strong</span>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">System Info</h3>
                    <p className="text-xs text-gray-500">Runtime environment</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Version</span>
                  <span className="font-medium text-gray-900">{systemInfo.version}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Environment</span>
                  <span className="font-medium text-blue-600">{systemInfo.environment}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Uptime</span>
                  <span className="font-medium text-gray-900">{systemInfo.uptime}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Currency Tab */}
        <TabsContent value="currency" className="space-y-6">
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold mb-2">Currency & Exchange</h2>
              <p className="text-gray-600">Manage accepted currencies and exchange rates for your events.</p>
            </div>

            {/* Global Currency Settings - Static View */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="bg-white rounded-lg shadow border p-6 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold">Currency Configuration</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Currency
                    </label>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {AVAILABLE_CURRENCIES.slice(0, 8).map((currency) => {
                        const isSelected = globalCurrency.code === currency.code
                        return (
                          <div
                            key={currency.code}
                            className={`
                              relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 cursor-default
                              ${isSelected
                                ? 'border-purple-600 bg-purple-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                              }
                            `}
                          >
                            {isSelected && (
                              <div className="absolute top-2 right-2 text-purple-600">
                                <span className="flex h-4 w-4 rounded-full bg-purple-600 items-center justify-center">
                                  <svg
                                    width="10"
                                    height="8"
                                    viewBox="0 0 10 8"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1 3.5L3.5 6L9 1"
                                      stroke="white"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </span>
                              </div>
                            )}

                            {/* Flag Placeholder (using emoji for now as per previous logic or just span) */}
                            <span className="text-2xl">
                              {currency.code === 'USD' ? '🇺🇸' :
                                currency.code === 'EUR' ? '🇪🇺' :
                                  currency.code === 'GBP' ? '🇬🇧' :
                                    currency.code === 'INR' ? '🇮🇳' :
                                      currency.code === 'AUD' ? '🇦🇺' :
                                        currency.code === 'CAD' ? '🇨🇦' :
                                          currency.code === 'AED' ? '🇦🇪' :
                                            currency.code === 'SGD' ? '🇸🇬' : '🏳️'}
                            </span>

                            <div className="text-center">
                              <div className={`font-bold ${isSelected ? 'text-purple-700' : 'text-gray-900'}`}>
                                {currency.code}
                              </div>
                              <div className="text-xs text-gray-500">
                                {currency.code} ({currency.symbol})
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips Card */}
              <div className="bg-indigo-900 rounded-lg shadow p-6 text-white w-full md:w-80 shrink-0">
                <h3 className="font-bold text-lg mb-4">Currency Tips</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-indigo-100 mb-1">Base Currency</h4>
                    <p className="text-sm text-indigo-200">
                      Ensure your base currency matches your bank account to avoid conversion fees.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-indigo-100 mb-1">Multi-Currency Support</h4>
                    <p className="text-sm text-indigo-200">
                      Enabling multiple currencies allows international attendees to pay in their local currency.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-indigo-800">
                    <p className="text-xs text-indigo-300">
                      Exchange rates are updated daily via OpenExchangeRates API.
                    </p>
                  </div>
                </div>
              </div>
            </div>


            {/* Company Currency Overview */}
            <div className="bg-white rounded-lg shadow border p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-semibold">Company Currency Settings</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Each company can have its own base currency. If not set, they will use the global default currency.
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Currency</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {companyCurrencies.map((company) => {
                      const companyCurrency = getCurrencyByCode(company.currency || globalCurrency.code)
                      const isUsingGlobal = !company.currency || company.currency === globalCurrency.code
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
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <ModuleAccessMatrix />
        </TabsContent>

      </Tabs>
    </div>
  )
}
