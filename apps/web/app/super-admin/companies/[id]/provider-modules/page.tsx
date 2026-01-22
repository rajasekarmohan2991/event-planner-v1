'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Save, Package, Users, Store, TrendingUp } from 'lucide-react'

interface ModuleSettings {
  moduleVendorManagement: boolean
  moduleSponsorManagement: boolean
  moduleExhibitorManagement: boolean
  providerCommissionRate: number
}

interface CompanyData {
  id: string
  name: string
  subscription_plan: string
  module_vendor_management: boolean
  module_sponsor_management: boolean
  module_exhibitor_management: boolean
  provider_commission_rate: number
}

interface Statistics {
  vendor_count: number
  sponsor_count: number
  exhibitor_count: number
  verified_count: number
  pending_count: number
  total_revenue: number
}

export default function ProviderModulesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [settings, setSettings] = useState<ModuleSettings>({
    moduleVendorManagement: false,
    moduleSponsorManagement: false,
    moduleExhibitorManagement: false,
    providerCommissionRate: 15.0
  })

  useEffect(() => {
    fetchModuleSettings()
  }, [params.id])

  const fetchModuleSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/super-admin/companies/${params.id}/modules`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch module settings')
      }

      const data = await response.json()
      setCompany(data.company)
      setStatistics(data.statistics)
      
      setSettings({
        moduleVendorManagement: data.company.module_vendor_management,
        moduleSponsorManagement: data.company.module_sponsor_management,
        moduleExhibitorManagement: data.company.module_exhibitor_management,
        providerCommissionRate: data.company.provider_commission_rate || 15.0
      })
    } catch (error) {
      console.error('Error fetching module settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load module settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/super-admin/companies/${params.id}/modules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Failed to update module settings')
      }

      const data = await response.json()
      setCompany(data.company)

      toast({
        title: 'Success',
        description: 'Provider modules updated successfully'
      })
    } catch (error) {
      console.error('Error updating module settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to update module settings',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading module settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/super-admin/companies/${params.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Company
        </Button>
        <h1 className="text-3xl font-bold">Provider Portal Modules</h1>
        <p className="text-muted-foreground mt-2">
          Manage vendor, sponsor, and exhibitor modules for {company?.name}
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{statistics.vendor_count}</div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sponsors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{statistics.sponsor_count}</div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Exhibitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{statistics.exhibitor_count}</div>
                <Store className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  ₹{(statistics.total_revenue || 0).toLocaleString()}
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Module Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Module Configuration</CardTitle>
          <CardDescription>
            Enable or disable provider management modules for this company
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vendor Management */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                <Label htmlFor="vendor-module" className="text-base font-semibold">
                  Vendor Management
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow company to manage vendors (catering, AV, security, etc.)
              </p>
            </div>
            <Switch
              id="vendor-module"
              checked={settings.moduleVendorManagement}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, moduleVendorManagement: checked })
              }
            />
          </div>

          {/* Sponsor Management */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                <Label htmlFor="sponsor-module" className="text-base font-semibold">
                  Sponsor Management
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow company to manage sponsors and sponsorship deals
              </p>
            </div>
            <Switch
              id="sponsor-module"
              checked={settings.moduleSponsorManagement}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, moduleSponsorManagement: checked })
              }
            />
          </div>

          {/* Exhibitor Management */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-purple-500" />
                <Label htmlFor="exhibitor-module" className="text-base font-semibold">
                  Exhibitor Management
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow company to manage exhibitors and booth bookings
              </p>
            </div>
            <Switch
              id="exhibitor-module"
              checked={settings.moduleExhibitorManagement}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, moduleExhibitorManagement: checked })
              }
            />
          </div>

          {/* Commission Rate */}
          <div className="p-4 border rounded-lg space-y-3">
            <Label htmlFor="commission-rate" className="text-base font-semibold">
              Default Commission Rate
            </Label>
            <p className="text-sm text-muted-foreground">
              Platform commission percentage for all provider bookings
            </p>
            <div className="flex items-center gap-4">
              <Input
                id="commission-rate"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={settings.providerCommissionRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    providerCommissionRate: parseFloat(e.target.value) || 0
                  })
                }
                className="max-w-xs"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/super-admin/companies/${params.id}`)}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
