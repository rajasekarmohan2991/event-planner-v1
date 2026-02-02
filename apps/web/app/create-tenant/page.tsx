'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CreateTenantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subdomain: ''
  })
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      subdomain: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }))
    setSlugAvailable(null)
  }

  // Check slug availability
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null)
      return
    }

    setCheckingSlug(true)
    try {
      const res = await fetch(`/api/tenants/check-slug?slug=${slug}`)
      const data = await res.json()
      setSlugAvailable(data.available)
    } catch (error) {
      console.error('Failed to check slug:', error)
    } finally {
      setCheckingSlug(false)
    }
  }

  const handleSlugChange = (slug: string) => {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setFormData(prev => ({
      ...prev,
      slug: cleanSlug,
      subdomain: cleanSlug
    }))
    
    // Debounce slug check
    const timer = setTimeout(() => {
      checkSlugAvailability(cleanSlug)
    }, 500)
    
    return () => clearTimeout(timer)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create organization')
      }

      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isValid = formData.name.length >= 3 && 
                  formData.slug.length >= 3 && 
                  slugAvailable === true

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Create Your Organization</CardTitle>
          <CardDescription>
            Set up your organization to start managing events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Acme Events"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                minLength={3}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                This will be displayed across your organization
              </p>
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Organization Slug *</Label>
              <div className="relative">
                <Input
                  id="slug"
                  type="text"
                  placeholder="e.g., acme-events"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  required
                  minLength={3}
                  pattern="[a-z0-9-]+"
                  disabled={loading}
                  className="pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingSlug && (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  )}
                  {!checkingSlug && slugAvailable === true && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                  {!checkingSlug && slugAvailable === false && (
                    <X className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Lowercase letters, numbers, and hyphens only
              </p>
              {slugAvailable === false && (
                <p className="text-xs text-red-600">
                  This slug is already taken. Please choose another.
                </p>
              )}
            </div>

            {/* Subdomain Preview */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Your organization URL:</p>
              <p className="text-sm font-mono text-gray-900">
                {formData.subdomain || 'your-org'}.eventplanner.com
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || !isValid}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Organization...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Create Organization
                </>
              )}
            </Button>

            {/* Info */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                You will be assigned as the organization owner with full access
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
