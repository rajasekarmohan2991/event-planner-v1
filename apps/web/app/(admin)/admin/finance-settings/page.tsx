'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpCircle, 
  Settings2, 
  FileText, 
  Loader2,
  Info,
  ArrowRight,
  Shield
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

interface MigrationStatus {
  financeMode: 'legacy' | 'tenant' | 'hybrid'
  canMigrate: boolean
  migrationMessage: string
  invoices: {
    v1: number
    v2: number
    total: number
  }
  taxStructures: number
  canRollback: boolean
}

export default function FinanceSettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const [status, setStatus] = useState<MigrationStatus | null>(null)
  const [error, setError] = useState<string>('')

  const tenantId = (session?.user as any)?.tenantId

  useEffect(() => {
    if (tenantId) {
      fetchMigrationStatus()
    }
  }, [tenantId])

  async function fetchMigrationStatus() {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`/api/tenants/${tenantId}/finance/migrate`)
      if (!res.ok) {
        throw new Error('Failed to fetch migration status')
      }
      const data = await res.json()
      setStatus(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleMigrate() {
    if (!confirm('This will enable Advanced Finance mode. You will have full control over tax configuration. Continue?')) {
      return
    }

    try {
      setMigrating(true)
      const res = await fetch(`/api/tenants/${tenantId}/finance/migrate`, {
        method: 'POST'
      })

      if (res.ok) {
        toast({
          title: 'Migration Successful',
          description: 'Your organization has been upgraded to Advanced Finance mode.',
        })
        await fetchMigrationStatus()
      } else {
        const data = await res.json()
        toast({
          title: 'Migration Failed',
          description: data.error || 'An error occurred during migration.',
          variant: 'destructive'
        })
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setMigrating(false)
    }
  }

  async function handleRollback() {
    if (!confirm('This will revert to Legacy Finance mode. This is only possible if no v2 invoices have been created. Continue?')) {
      return
    }

    try {
      setMigrating(true)
      const res = await fetch(`/api/tenants/${tenantId}/finance/migrate`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast({
          title: 'Rollback Successful',
          description: 'Your organization has been reverted to Legacy Finance mode.',
        })
        await fetchMigrationStatus()
      } else {
        const data = await res.json()
        toast({
          title: 'Rollback Failed',
          description: data.error || 'An error occurred during rollback.',
          variant: 'destructive'
        })
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setMigrating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-500">Loading finance settings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance Settings</h1>
          <p className="text-gray-500">Manage your organization's finance configuration</p>
        </div>
      </div>

      {/* Current Mode Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${status?.financeMode === 'tenant' ? 'bg-green-100' : 'bg-blue-100'}`}>
                <Settings2 className={`w-5 h-5 ${status?.financeMode === 'tenant' ? 'text-green-600' : 'text-blue-600'}`} />
              </div>
              <div>
                <CardTitle className="text-lg">Finance Mode</CardTitle>
                <CardDescription>Current configuration for invoicing and taxes</CardDescription>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`text-sm px-3 py-1 ${
                status?.financeMode === 'tenant' 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {status?.financeMode === 'tenant' ? 'Advanced Finance' : 'Legacy Finance'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Total Invoices</div>
              <div className="text-2xl font-bold">{status?.invoices.total || 0}</div>
              <div className="text-xs text-gray-400 mt-1">
                v1: {status?.invoices.v1 || 0} | v2: {status?.invoices.v2 || 0}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Tax Structures</div>
              <div className="text-2xl font-bold">{status?.taxStructures || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Custom configurations</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Tax Control</div>
              <div className="text-2xl font-bold">
                {status?.financeMode === 'tenant' ? 'Full' : 'Limited'}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {status?.financeMode === 'tenant' ? 'You manage taxes' : 'Super Admin manages'}
              </div>
            </div>
          </div>

          {status?.financeMode === 'tenant' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Advanced Finance Enabled</AlertTitle>
              <AlertDescription className="text-green-700">
                You have full control over tax configuration and invoice customization.
                <Link href="/admin/tax-settings" className="ml-2 underline font-medium">
                  Configure Taxes →
                </Link>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Migration Section */}
      {status?.financeMode === 'legacy' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <ArrowUpCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Upgrade to Advanced Finance</CardTitle>
                <CardDescription>Get full control over tax configuration and invoice customization</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700">What you'll get:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Create custom tax structures</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Multi-tax support per invoice</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Tax snapshots for audit protection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Enhanced invoice numbering</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700">Requirements:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    {status?.canMigrate ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    <span>No active unpaid invoices</span>
                  </li>
                </ul>
              </div>
            </div>

            {!status?.canMigrate && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Migration Blocked</AlertTitle>
                <AlertDescription className="text-amber-700">
                  {status?.migrationMessage}
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-4 border-t">
              <Button 
                onClick={handleMigrate} 
                disabled={!status?.canMigrate || migrating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {migrating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    Enable Advanced Finance
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rollback Section (only if in tenant mode and can rollback) */}
      {status?.financeMode === 'tenant' && status?.canRollback && (
        <Card className="border-amber-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Rollback Option</CardTitle>
                <CardDescription>Revert to Legacy Finance mode</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert className="bg-amber-50 border-amber-200 mb-4">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                You can rollback to Legacy Finance because no v2 invoices have been created yet.
                Once you create an invoice in Advanced mode, rollback will no longer be available.
              </AlertDescription>
            </Alert>
            <Button 
              variant="outline" 
              onClick={handleRollback}
              disabled={migrating}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              {migrating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rolling back...
                </>
              ) : (
                'Revert to Legacy Finance'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/admin/invoices">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Invoices</h3>
                <p className="text-sm text-gray-500">View and manage all invoices</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
        
        {status?.financeMode === 'tenant' && (
          <Link href="/admin/tax-settings">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-100">
                  <Settings2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Tax Configuration</h3>
                  <p className="text-sm text-gray-500">Manage your tax structures</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  )
}
