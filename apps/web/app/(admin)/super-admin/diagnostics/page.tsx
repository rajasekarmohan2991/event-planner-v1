'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, AlertCircle, Loader2, Play, RefreshCw, Key, MessageSquare, Database } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function DiagnosticsPage() {
    const [config, setConfig] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [runningDiagnostics, setRunningDiagnostics] = useState(false)
    const [testPhone, setTestPhone] = useState('')
    const [sending, setSending] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        // Initial load
        runDiagnostics()
    }, [])

    const runDiagnostics = async () => {
        setRunningDiagnostics(true)
        try {
            const res = await fetch('/api/diagnostics/system-status')
            if (res.ok) {
                setConfig(await res.json())
                // Simulate a small delay for "running" effect if it returns too fast
                await new Promise(r => setTimeout(r, 800))
                toast({ title: "Diagnostics Complete", description: "System check finished successfully." })
            } else {
                throw new Error('Failed to fetch config')
            }
        } catch (e) {
            console.error(e)
            toast({ title: "Diagnostics Failed", description: "Could not retrieve system status.", variant: "destructive" })
        } finally {
            setLoading(false)
            setRunningDiagnostics(false)
        }
    }

    const handleTestWhatsApp = async () => {
        if (!testPhone) {
            toast({ title: "Phone required", variant: "destructive" })
            return
        }
        setSending(true)
        try {
            const res = await fetch('/api/diagnostics/test-whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: testPhone })
            })
            const data = await res.json()
            if (data.success) {
                toast({ title: "Message Sent", description: `SID: ${data.result.id}` })
            } else {
                toast({ title: "Failed", description: data.error || data.result?.error?.message, variant: "destructive" })
            }
        } catch (e) {
            toast({ title: "Error", description: "Network error", variant: "destructive" })
        } finally {
            setSending(false)
        }
    }

    const StatusItem = ({ label, status, detail, dataTestId }: { label: string, status: 'ok' | 'error' | 'warning', detail?: string, dataTestId?: string }) => (
        <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50 mb-3 hover:bg-slate-50 transition-colors" data-testid={dataTestId}>
            <div className="flex items-center gap-3">
                {status === 'ok' && <CheckCircle2 className="h-5 w-5 text-green-500 fill-green-50" />}
                {status === 'error' && <XCircle className="h-5 w-5 text-red-500 fill-red-50" />}
                {status === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-500 fill-yellow-50" />}
                <span className="font-medium text-slate-700">{label}</span>
            </div>
            <div className="text-sm font-mono text-slate-500 bg-white px-2 py-1 rounded border">
                {detail || (status === 'ok' ? 'Configured' : 'Missing')}
            </div>
        </div>
    )

    if (loading && !config) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-lg font-medium text-slate-600">Running System Diagnostics...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Diagnostics</h1>
                    <p className="text-slate-500 mt-1">Check environment configuration and service connectivity.</p>
                </div>
                <Button
                    onClick={runDiagnostics}
                    disabled={runningDiagnostics}
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                >
                    {runningDiagnostics ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
                    {runningDiagnostics ? 'Running Check...' : 'Run Diagnostics'}
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
                <Card className="shadow-md border-slate-200 overflow-hidden">
                    <CardHeader className="bg-slate-50/80 border-b pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                <Key className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Authentication</CardTitle>
                                <CardDescription>Google OAuth & NextAuth Configuration</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {config?.auth && (
                            <div className="space-y-1">
                                <StatusItem label="Google Client ID" status={config.auth.googleId ? 'ok' : 'error'} />
                                <StatusItem label="Google Secret" status={config.auth.googleSecret ? 'ok' : 'error'} />
                                <StatusItem label="NextAuth URL" status={config.auth.url ? 'ok' : 'error'} detail={config.auth.url} />
                                <StatusItem label="NextAuth Secret" status={config.auth.secret ? 'ok' : 'error'} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-md border-slate-200 overflow-hidden">
                    <CardHeader className="bg-slate-50/80 border-b pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Messaging (WhatsApp/SMS)</CardTitle>
                                <CardDescription>Twilio Service Configuration</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {config?.twilio && (
                            <div className="space-y-1">
                                <StatusItem label="Account SID" status={config.twilio.sid ? 'ok' : 'error'} detail={config.twilio.sidMasked} />
                                <StatusItem label="Auth Token" status={config.twilio.token ? 'ok' : 'error'} />
                                <StatusItem label="WhatsApp From" status={config.twilio.waFrom ? 'ok' : 'warning'} detail={config.twilio.waFrom || 'Sandbox'} />
                                <StatusItem label="SMS From" status={config.twilio.smsFrom ? 'ok' : 'warning'} detail={config.twilio.smsFrom} />
                            </div>
                        )}

                        <div className="mt-8 bg-slate-50 rounded-xl p-5 border border-slate-200">
                            <Label className="text-slate-900 font-semibold mb-2 block">Test WhatsApp Delivery</Label>
                            <p className="text-xs text-slate-500 mb-3">
                                Send a test message to verify credentials. If using Sandbox, ensure recipient is verified.
                            </p>
                            <div className="flex gap-3">
                                <Input
                                    placeholder="+1234567890"
                                    value={testPhone}
                                    onChange={e => setTestPhone(e.target.value)}
                                    className="bg-white"
                                />
                                <Button onClick={handleTestWhatsApp} disabled={sending} className="bg-green-600 hover:bg-green-700">
                                    {sending ? <Loader2 className="animate-spin h-4 w-4" /> : 'Send'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-md border-slate-200 overflow-hidden">
                    <CardHeader className="bg-slate-50/80 border-b pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Database className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Storage Services</CardTitle>
                                <CardDescription>Supabase & Cloudinary Integration</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {config?.storage && (
                            <div className="space-y-1">
                                <StatusItem label="Supabase URL" status={config.storage.supabaseUrl ? 'ok' : 'error'} />
                                <StatusItem label="Supabase Key" status={config.storage.supabaseKey ? 'ok' : 'error'} />
                                <StatusItem label="Cloudinary Name" status={config.storage.cloudinaryName ? 'ok' : 'warning'} detail={config.storage.cloudinaryName} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
