"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import Image from "next/image"
import { Bell, Mail, MessageSquare, Calendar, Shield } from "lucide-react"

function PreferencesSection() {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    eventReminders: true,
    weeklyDigest: false,
    marketingEmails: false,
  })

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/user/preferences', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        setPreferences(prev => ({
          ...prev,
          emailNotifications: data?.emailNotifications ?? prev.emailNotifications,
          pushNotifications: data?.pushNotifications ?? prev.pushNotifications,
          smsNotifications: data?.smsNotifications ?? prev.smsNotifications,
          eventReminders: data?.eventReminders ?? prev.eventReminders,
          weeklyDigest: data?.weeklyDigest ?? prev.weeklyDigest,
          marketingEmails: data?.marketingEmails ?? prev.marketingEmails,
        }))
      } catch {}
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })
      
      if (response.ok) {
        setMessage("Preferences saved successfully!")
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage("Failed to save preferences")
      }
    } catch (error) {
      setMessage("Error saving preferences")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Notification Preferences */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notification Preferences
        </h3>
        <div className="space-y-3">
          <PreferenceToggle
            label="Email Notifications"
            description="Receive notifications via email"
            icon={<Mail className="w-4 h-4" />}
            checked={preferences.emailNotifications}
            onChange={() => handleToggle('emailNotifications')}
          />
          <PreferenceToggle
            label="Push Notifications"
            description="Receive push notifications in browser"
            icon={<Bell className="w-4 h-4" />}
            checked={preferences.pushNotifications}
            onChange={() => handleToggle('pushNotifications')}
          />
          <PreferenceToggle
            label="SMS Notifications"
            description="Receive important alerts via SMS"
            icon={<MessageSquare className="w-4 h-4" />}
            checked={preferences.smsNotifications}
            onChange={() => handleToggle('smsNotifications')}
          />
        </div>
      </div>

      {/* Content Preferences */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Content Preferences
        </h3>
        <div className="space-y-3">
          <PreferenceToggle
            label="Event Reminders"
            description="Get reminders before events start"
            icon={<Calendar className="w-4 h-4" />}
            checked={preferences.eventReminders}
            onChange={() => handleToggle('eventReminders')}
          />
          <PreferenceToggle
            label="Weekly Digest"
            description="Receive weekly summary of events"
            icon={<Mail className="w-4 h-4" />}
            checked={preferences.weeklyDigest}
            onChange={() => handleToggle('weeklyDigest')}
          />
          <PreferenceToggle
            label="Marketing Emails"
            description="Receive promotional content and offers"
            icon={<Mail className="w-4 h-4" />}
            checked={preferences.marketingEmails}
            onChange={() => handleToggle('marketingEmails')}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t">
        {message && (
          <span className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}

function PreferenceToggle({ 
  label, 
  description, 
  icon, 
  checked, 
  onChange 
}: { 
  label: string
  description: string
  icon: React.ReactNode
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-gray-500">
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{label}</div>
          <div className="text-xs text-gray-500 mt-0.5">{description}</div>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-indigo-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

export default function ProfilePage() {
  const { data, status } = useSession()
  const user = data?.user

  if (status === "loading") {
    return <div className="p-6">Loading...</div>
  }

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Profile</h1>
        <p className="text-sm text-muted-foreground">You are not signed in.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account information</p>
      </div>

      <div className="rounded-lg border p-4 flex items-center gap-4">
        <div className="h-16 w-16 relative rounded-full overflow-hidden border">
          {user.image ? (
            <Image src={user.image} alt={user.name ?? ""} fill className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              {(user.name || user.email || "U").slice(0,1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{user.name || "Unnamed User"}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
        <button
          className="px-4 py-2 rounded-md border bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
        >
          Sign out
        </button>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Preferences</h2>
        <PreferencesSection />
      </div>
    </div>
  )
}
