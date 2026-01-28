"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { UserSidebar } from '@/components/user/sidebar'
import { User, Bell, Shield, Palette, Globe, Save, CreditCard } from 'lucide-react'

export default function SettingsPage() {
  const { status, data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('notifications')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    eventReminders: true,
    marketingEmails: false
  })

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false
  })

  // Language & Region
  const [language, setLanguage] = useState('en')
  const [timeZone, setTimeZone] = useState('UTC')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  // Load existing preferences
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/user/preferences', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        // Notifications
        setNotifications(prev => ({
          ...prev,
          emailNotifications: data.emailNotifications ?? prev.emailNotifications,
          pushNotifications: data.pushNotifications ?? prev.pushNotifications,
          smsNotifications: data.smsNotifications ?? prev.smsNotifications,
          eventReminders: data.eventReminders ?? prev.eventReminders,
          marketingEmails: data.marketingEmails ?? prev.marketingEmails,
        }))
        // Privacy
        const prefPrivacy = data.privacy || {}
        setPrivacy({
          profileVisibility: prefPrivacy.profileVisibility || 'public',
          showEmail: !!prefPrivacy.showEmail,
          showPhone: !!prefPrivacy.showPhone,
        })
        // Language & Region
        setLanguage(data.language || 'en')
        setTimeZone(data.timeZone || 'UTC')
      } catch (e) {
        // ignore
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        language,
        emailNotifications: notifications.emailNotifications,
        pushNotifications: notifications.pushNotifications,
        // other prefs stored in JSON
        smsNotifications: notifications.smsNotifications,
        eventReminders: notifications.eventReminders,
        marketingEmails: notifications.marketingEmails,
        timeZone,
        privacy,
      }
      const res = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to save')
      }
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>
  }

  if (status === 'unauthenticated') {
    return null
  }

  const tabs = [
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'privacy', name: 'Privacy', icon: Shield },
    { id: 'language', name: 'Language', icon: Globe },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden md:block shrink-0"><UserSidebar /></div>
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>

          {message && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md">
              {message}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id
                        ? 'border-rose-500 text-rose-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.name}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-rose-600" />
                      Notification Preferences
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">Manage how you receive notifications</p>
                  </div>

                  <div className="space-y-6">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-200">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Email Notifications</div>
                          <div className="text-sm text-gray-600">Receive notifications via email</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.emailNotifications}
                          onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>

                    {/* Push Notifications */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-200">
                          <Bell className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Push Notifications</div>
                          <div className="text-sm text-gray-600">Receive push notifications in browser</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.pushNotifications}
                          onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>

                    {/* SMS Notifications */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-200">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">SMS Notifications</div>
                          <div className="text-sm text-gray-600">Receive important alerts via SMS</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.smsNotifications}
                          onChange={(e) => setNotifications({ ...notifications, smsNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-200"></div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Content Preferences
                      </h3>
                    </div>

                    <div className="space-y-6">
                      {/* Event Reminders */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg border border-gray-200">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Event Reminders</div>
                            <div className="text-sm text-gray-600">Get reminders before events start</div>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.eventReminders}
                            onChange={(e) => setNotifications({ ...notifications, eventReminders: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                        </label>
                      </div>

                      {/* Weekly Digest */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg border border-gray-200">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Weekly Digest</div>
                            <div className="text-sm text-gray-600">Receive weekly summary of events</div>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => { }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                        </label>
                      </div>

                      {/* Marketing Emails */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg border border-gray-200">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Marketing Emails</div>
                            <div className="text-sm text-gray-600">Receive promotional content and offers</div>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.marketingEmails}
                            onChange={(e) => setNotifications({ ...notifications, marketingEmails: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-6">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-rose-600 text-white px-8 py-3 rounded-lg hover:bg-rose-700 disabled:opacity-50 font-semibold shadow-lg shadow-rose-600/30 transition-all"
                    >
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Privacy Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Profile Visibility</label>
                      <select
                        value={privacy.profileVisibility}
                        onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value })}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="contacts">Contacts Only</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={privacy.showEmail}
                        onChange={(e) => setPrivacy({ ...privacy, showEmail: e.target.checked })}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <div>
                        <div className="font-medium">Show Email Address</div>
                        <div className="text-sm text-gray-500">Allow others to see your email</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={privacy.showPhone}
                        onChange={(e) => setPrivacy({ ...privacy, showPhone: e.target.checked })}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <div>
                        <div className="font-medium">Show Phone Number</div>
                        <div className="text-sm text-gray-500">Allow others to see your phone number</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'language' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-rose-600" />
                      Language & Region
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">Set your language and timezone preferences</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-900">Language</label>
                      <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all">
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="hi">Hindi</option>
                        <option value="ta">Tamil</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-900">Time Zone</label>
                      <select value={timeZone} onChange={(e) => setTimeZone(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all">
                        <option value="UTC">UTC</option>
                        <option value="Asia/Kolkata">India Standard Time (IST)</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Paris">Paris (CET)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                        <option value="Australia/Sydney">Sydney (AEDT)</option>
                      </select>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-6">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-rose-600 text-white px-8 py-3 rounded-lg hover:bg-rose-700 disabled:opacity-50 font-semibold shadow-lg shadow-rose-600/30 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
