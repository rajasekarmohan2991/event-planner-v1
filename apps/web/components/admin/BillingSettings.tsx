'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Download, CheckCircle, AlertCircle, CreditCard, Search, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Tenant {
    id: string
    name: string
    slug: string
    plan: string
    status: string
    billingEmail: string | null
    subscriptionEndsAt: string | null
}

const PLANS = [
    { id: 'FREE', name: 'Free', price: 0 },
    { id: 'STARTER', name: 'Starter', price: 2999 },
    { id: 'PRO', name: 'Pro', price: 9999 },
    { id: 'ENTERPRISE', name: 'Enterprise', price: 24999 },
]

export default function BillingSettings() {
    const { toast } = useToast()
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Upgrade Modal State
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
    const [upgradePlan, setUpgradePlan] = useState<string>('')
    const [processing, setProcessing] = useState(false)
    const [paymentStep, setPaymentStep] = useState(false)

    useEffect(() => {
        loadTenants()
    }, [])

    const loadTenants = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/billing/tenants')
            if (res.ok) {
                const data = await res.json()
                setTenants(data.tenants || [])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpgradeSelect = (tenant: Tenant) => {
        setSelectedTenant(tenant)
        setUpgradePlan(tenant.plan) // Default to current
        setPaymentStep(false)
    }

    const handleProceedToPayment = () => {
        if (!upgradePlan || upgradePlan === selectedTenant?.plan) {
            toast({ title: "No change", description: "Please select a different plan to upgrade/downgrade.", variant: "outline" })
            return
        }
        setPaymentStep(true)
    }

    const handleConfirmPayment = async () => {
        if (!selectedTenant) return

        try {
            setProcessing(true)
            // Mock API delay
            await new Promise(r => setTimeout(r, 1500))

            const res = await fetch('/api/admin/billing/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: selectedTenant.id,
                    plan: upgradePlan,
                    paymentMethodId: 'mock_pm_123'
                })
            })

            if (res.ok) {
                toast({ title: "Success", description: `Plan upgraded to ${upgradePlan} successfully!` })
                await loadTenants()
                setSelectedTenant(null)
            } else {
                throw new Error('Upgrade failed')
            }
        } catch (error) {
            toast({ title: "Error", description: "Payment processing failed.", variant: "destructive" })
        } finally {
            setProcessing(false)
        }
    }

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const selectedPlanDetails = PLANS.find(p => p.id === upgradePlan)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight text-gray-900">Billing & Subscription</h2>
                    <p className="text-sm text-gray-500">Manage subscriptions for all tenant companies</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search companies..."
                        className="pl-9 w-[250px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tenant List Table */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-4 border-b bg-gray-50/50">
                    <CardTitle className="text-base font-semibold">Company Subscriptions</CardTitle>
                    <CardDescription>View and update plans for registered organizations.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Company</TableHead>
                                <TableHead>Current Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Renewal Date</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-gray-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading subscriptions...
                                    </TableCell>
                                </TableRow>
                            ) : filteredTenants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-gray-400">
                                        No companies found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTenants.map((tenant) => (
                                    <TableRow key={tenant.id} className="hover:bg-gray-50/50">
                                        <TableCell className="pl-6 font-medium">
                                            <div>{tenant.name}</div>
                                            <div className="text-xs text-gray-400 font-normal">{tenant.slug}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                tenant.plan === 'ENTERPRISE' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    tenant.plan === 'PRO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        tenant.plan === 'STARTER' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                            'bg-gray-100 text-gray-700'
                                            }>
                                                {tenant.plan}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${tenant.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
                                                    }`} />
                                                <span className="text-sm capitalize text-gray-600">{tenant.status.toLowerCase()}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-500 text-sm">
                                            {tenant.subscriptionEndsAt
                                                ? new Date(tenant.subscriptionEndsAt).toLocaleDateString()
                                                : '-'
                                            }
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleUpgradeSelect(tenant)}
                                            >
                                                Manage Plan
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Upgrade/Manage Modal */}
            <Dialog open={!!selectedTenant} onOpenChange={(open) => !open && setSelectedTenant(null)}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Manage Subscription</DialogTitle>
                        <DialogDescription>
                            Update plan for <span className="font-semibold text-gray-900">{selectedTenant?.name}</span>
                        </DialogDescription>
                    </DialogHeader>

                    {!paymentStep ? (
                        /* Step 1: Select Plan */
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Current Plan</Label>
                                <div className="p-3 bg-gray-50 rounded-md border text-sm font-medium text-gray-700">
                                    {selectedTenant?.plan} ({selectedTenant?.status})
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Change Plan To</Label>
                                <Select value={upgradePlan} onValueChange={setUpgradePlan}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PLANS.map(p => (
                                            <SelectItem key={p.id} value={p.id} disabled={p.id === selectedTenant?.plan}>
                                                {p.name} - ₹{p.price.toLocaleString()}/yr
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ) : (
                        /* Step 2: Payment Mock */
                        <div className="grid gap-4 py-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                                <InfoIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900">Upgrading to {selectedPlanDetails?.name}</p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Total Amount: <span className="font-bold">₹{selectedPlanDetails?.price.toLocaleString()}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Payment Method</Label>
                                <div className="border rounded-md p-3 space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                        <CreditCard className="w-4 h-4" /> Credit or Debit Card
                                    </div>
                                    <Input placeholder="Card Number" value="4242 4242 4242 4242" readOnly className="font-mono bg-gray-50" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input placeholder="MM/YY" value="12/28" readOnly className="bg-gray-50" />
                                        <Input placeholder="CVC" value="123" readOnly className="bg-gray-50" />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">
                                    This is a secure 256-bit encrypted transaction. <br />
                                    (Mock Payment Integration)
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {!paymentStep ? (
                            <Button onClick={handleProceedToPayment} className="w-full">
                                Proceed to Payment
                            </Button>
                        ) : (
                            <div className="flex gap-2 w-full">
                                <Button variant="outline" className="flex-1" onClick={() => setPaymentStep(false)} disabled={processing}>
                                    Back
                                </Button>
                                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleConfirmPayment} disabled={processing}>
                                    {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    Pay & Confirm
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function InfoIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    )
}
