'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Award, Calendar } from 'lucide-react'

const INDUSTRIES = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
    'Media', 'Manufacturing', 'Real Estate', 'Automotive', 'Energy',
    'Hospitality', 'Fashion', 'Food & Beverage', 'Sports', 'Other'
]

interface Event {
    id: string
    name: string
}

export default function AddCompanySponsorPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [saving, setSaving] = useState(false)
    const [events, setEvents] = useState<Event[]>([])
    const [loadingEvents, setLoadingEvents] = useState(true)

    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        website: '',
        logo: '',
        description: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        eventId: ''
    })

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('/api/events')
                if (res.ok) {
                    const data = await res.json()
                    setEvents(data.events || [])
                }
            } catch (error) {
                console.error('Failed to fetch events:', error)
            } finally {
                setLoadingEvents(false)
            }
        }
        fetchEvents()
    }, [])

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.eventId) {
            toast({ title: 'Please fill required fields (Name and Event)', variant: 'destructive' })
            return
        }

        setSaving(true)
        try {
            const res = await fetch('/api/admin/service-management/sponsors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                toast({ title: 'Sponsor added successfully!' })
                router.push('/admin/service-management/sponsors')
            } else {
                const data = await res.json()
                toast({ title: data.error || 'Failed to add sponsor', variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Failed to add sponsor', variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="p-6 space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                        <Award className="h-6 w-6 text-purple-600" />
                        Add New Sponsor
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Add a sponsor to one of your events
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Event Selection */}
                <Card className="border-2 border-dashed border-purple-300 bg-purple-50/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-700">
                            <Calendar className="h-5 w-5" />
                            Select Event *
                        </CardTitle>
                        <CardDescription>
                            Choose which event this sponsor is associated with
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select value={formData.eventId} onValueChange={(v) => handleChange('eventId', v)}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder={loadingEvents ? "Loading events..." : "Select an event"} />
                            </SelectTrigger>
                            <SelectContent>
                                {events.map(event => (
                                    <SelectItem key={event.id} value={event.id.toString()}>
                                        {event.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Sponsor Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sponsor Information</CardTitle>
                        <CardDescription>Basic details about the sponsor</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Company Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="Enter company name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="industry">Industry</Label>
                            <Select value={formData.industry} onValueChange={(v) => handleChange('industry', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                                <SelectContent>
                                    {INDUSTRIES.map(ind => (
                                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                value={formData.website}
                                onChange={(e) => handleChange('website', e.target.value)}
                                placeholder="https://www.company.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logo">Logo URL</Label>
                            <Input
                                id="logo"
                                value={formData.logo}
                                onChange={(e) => handleChange('logo', e.target.value)}
                                placeholder="https://example.com/logo.png"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Brief description..."
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contactName">Contact Name</Label>
                            <Input
                                id="contactName"
                                value={formData.contactName}
                                onChange={(e) => handleChange('contactName', e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactEmail">Contact Email</Label>
                            <Input
                                id="contactEmail"
                                type="email"
                                value={formData.contactEmail}
                                onChange={(e) => handleChange('contactEmail', e.target.value)}
                                placeholder="john@company.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactPhone">Contact Phone</Label>
                            <Input
                                id="contactPhone"
                                value={formData.contactPhone}
                                onChange={(e) => handleChange('contactPhone', e.target.value)}
                                placeholder="+91 98765 43210"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Adding...' : 'Add Sponsor'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
