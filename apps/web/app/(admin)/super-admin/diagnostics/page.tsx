
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function DiagnosticsPage() {
    const [config, setConfig] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [testPhone, setTestPhone] = useState('')
    const [sending, setSending] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/diagnostics/system-status')
            // Note: We need to create this endpoint too, or just render what we can client-side (but client can't see server envs)
            // So we will create /api/diagnostics/system-status as well.
            if (res.ok) {
                setConfig(await res.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
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

    const StatusItem = ({ label, status, detail }: { label: string, status: 'ok' | 'error' | 'warning', detail?: string }) => (
        <div className="flex items-center justify-between p-3 border rounded-lg mb-2">
            <div className="flex items-center gap-3">
                {status === 'ok' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                {status === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                <span className="font-medium">{label}</span>
            </div>
            <div className="text-sm text-slate-500">
                {detail || (status === 'ok' ? 'Configured' : 'Missing')}
            </div>
        </div>
    )

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold">System Diagnostics</h1>
            <p className="text-slate-500">Check environment configuration and service connectivity.</p>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Authentication</CardTitle>
                        <CardDescription>Google OAuth & NextAuth</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {config?.auth && (
                            <>
                                <StatusItem label="Google Client ID" status={config.auth.googleId ? 'ok' : 'error'} />
                                <StatusItem label="Google Secret" status={config.auth.googleSecret ? 'ok' : 'error'} />
                                <StatusItem label="NextAuth URL" status={config.auth.url ? 'ok' : 'error'} detail={config.auth.url} />
                                <StatusItem label="NextAuth Secret" status={config.auth.secret ? 'ok' : 'error'} />
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Messaging (WhatsApp/SMS)</CardTitle>
                        <CardDescription>Twilio Configuration</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {config?.twilio && (
                            <>
                                <StatusItem label="Account SID" status={config.twilio.sid ? 'ok' : 'error'} detail={config.twilio.sidMasked} />
                                <StatusItem label="Auth Token" status={config.twilio.token ? 'ok' : 'error'} />
                                <StatusItem label="WhatsApp From" status={config.twilio.waFrom ? 'ok' : 'warning'} detail={config.twilio.waFrom || 'Default Sandbox'} />
                                <StatusItem label="SMS From" status={config.twilio.smsFrom ? 'ok' : 'warning'} detail={config.twilio.smsFrom} />
                            </>
                        )}

                        <div className="mt-6 pt-4 border-t">
                            <Label>Test WhatsApp</Label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    placeholder="+1234567890"
                                    value={testPhone}
                                    onChange={e => setTestPhone(e.target.value)}
                                />
                                <Button onClick={handleTestWhatsApp} disabled={sending}>
                                    {sending ? <Loader2 className="animate-spin h-4 w-4" /> : 'Send'}
                                </Button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Note: If using Twilio Sandbox, the recipient must have joined the sandbox first.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Storage</CardTitle>
                        <CardDescription>Supabase & Cloudinary</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {config?.storage && (
                            <>
                                <StatusItem label="Supabase URL" status={config.storage.supabaseUrl ? 'ok' : 'error'} />
                                <StatusItem label="Supabase Anon Key" status={config.storage.supabaseKey ? 'ok' : 'error'} />
                                <StatusItem label="Cloudinary Cloud Name" status={config.storage.cloudinaryName ? 'ok' : 'warning'} />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
