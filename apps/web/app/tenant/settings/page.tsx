"use client"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Building2, Palette, Upload, Save, User } from 'lucide-react'

export default function TenantSettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    name: '',
    subdomain: '',
    logo: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    timezone: 'UTC',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY'
  })

  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    bio: ''
  })

  useEffect(() => {
    loadSettings()
    loadProfile()
  }, [])

  const loadSettings = async () => {
    try {
      const tenantId = (session as any)?.user?.currentTenantId
      if (!tenantId) return
      
      const res = await fetch(`/api/tenant/settings`)
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProfile = async () => {
    try {
      if (!session?.user) return
      setProfile({
        fullName: (session.user as any).name || '',
        email: (session.user as any).email || '',
        phone: '',
        company: '',
        jobTitle: '',
        bio: ''
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/tenant/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, profile })
      })
      if (res.ok) {
        alert('Settings saved successfully!')
      }
    } catch (error) {
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Tenant Settings</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Profile Information */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={e => setProfile({...profile, fullName: e.target.value})}
                className="w-full px-4 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={e => setProfile({...profile, email: e.target.value})}
                className="w-full px-4 py-2 border rounded bg-gray-50"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={e => setProfile({...profile, phone: e.target.value})}
                className="w-full px-4 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company</label>
              <input
                type="text"
                value={profile.company}
                onChange={e => setProfile({...profile, company: e.target.value})}
                className="w-full px-4 py-2 border rounded"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Job Title</label>
              <input
                type="text"
                value={profile.jobTitle}
                onChange={e => setProfile({...profile, jobTitle: e.target.value})}
                className="w-full px-4 py-2 border rounded"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                value={profile.bio}
                onChange={e => setProfile({...profile, bio: e.target.value})}
                rows={4}
                className="w-full px-4 py-2 border rounded"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Organization Name</label>
              <input type="text" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})}
                className="w-full px-4 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subdomain</label>
              <input type="text" value={settings.subdomain} onChange={e => setSettings({...settings, subdomain: e.target.value})}
                className="w-full px-4 py-2 border rounded" disabled />
              <p className="text-sm text-gray-500 mt-1">{settings.subdomain}.eventplanner.com</p>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Branding
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Logo</label>
              <div className="flex items-center gap-4">
                {settings.logo && (
                  <img src={settings.logo} alt="Logo" className="w-16 h-16 object-contain border rounded" />
                )}
                <input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const formData = new FormData()
                    formData.append('file', file)
                    const res = await fetch('/api/tenant/branding/upload', { method: 'POST', body: formData })
                    if (res.ok) {
                      const data = await res.json()
                      setSettings({...settings, logo: data.logoUrl})
                    }
                  }
                }} className="flex-1 px-4 py-2 border rounded" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Primary Color</label>
                <input type="color" value={settings.primaryColor} onChange={e => setSettings({...settings, primaryColor: e.target.value})}
                  className="w-full h-10 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Secondary Color</label>
                <input type="color" value={settings.secondaryColor} onChange={e => setSettings({...settings, secondaryColor: e.target.value})}
                  className="w-full h-10 border rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Localization */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Localization</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Timezone</label>
              <select value={settings.timezone} onChange={e => setSettings({...settings, timezone: e.target.value})}
                className="w-full px-4 py-2 border rounded">
                <option>UTC</option>
                <option>America/New_York</option>
                <option>Europe/London</option>
                <option>Asia/Kolkata</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <select value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})}
                className="w-full px-4 py-2 border rounded">
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>INR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date Format</label>
              <select value={settings.dateFormat} onChange={e => setSettings({...settings, dateFormat: e.target.value})}
                className="w-full px-4 py-2 border rounded">
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        <button onClick={saveSettings} disabled={saving}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
