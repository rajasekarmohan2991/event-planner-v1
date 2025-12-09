"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { UserSidebar } from '@/components/user/sidebar'
import { User, Bell, Shield, Palette, Globe, Save, CreditCard } from 'lucide-react'

export default function SettingsPage() {
  const { status, data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Profile settings
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    bio: ''
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (session?.user) {
      setProfile({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '',
        company: '',
        jobTitle: '',
        bio: ''
      })
    }
  }, [status, router, session])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to save settings')
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
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'privacy', name: 'Privacy', icon: Shield },
    { id: 'subscription', name: 'Subscription', icon: CreditCard },
    { id: 'appearance', name: 'Appearance', icon: Palette },
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
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
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
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Profile Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone</label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Company</label>
                      <input
                        type="text"
                        value={profile.company}
                        onChange={(e) => setProfile({...profile, company: e.target.value})}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Job Title</label>
                      <input
                        type="text"
                        value={profile.jobTitle}
                        onChange={(e) => setProfile({...profile, jobTitle: e.target.value})}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Bio</label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({...profile, bio: e.target.value})}
                        rows={4}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Notification Preferences</h2>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={notifications.emailNotifications}
                        onChange={(e) => setNotifications({...notifications, emailNotifications: e.target.checked})}
                        className="rounded"
                      />
                      <div>
                        <div className="font-medium">Email Notifications</div>
                        <div className="text-sm text-gray-500">Receive notifications via email</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={notifications.smsNotifications}
                        onChange={(e) => setNotifications({...notifications, smsNotifications: e.target.checked})}
                        className="rounded"
                      />
                      <div>
                        <div className="font-medium">SMS Notifications</div>
                        <div className="text-sm text-gray-500">Receive notifications via SMS</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={notifications.eventReminders}
                        onChange={(e) => setNotifications({...notifications, eventReminders: e.target.checked})}
                        className="rounded"
                      />
                      <div>
                        <div className="font-medium">Event Reminders</div>
                        <div className="text-sm text-gray-500">Get reminded about upcoming events</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={notifications.marketingEmails}
                        onChange={(e) => setNotifications({...notifications, marketingEmails: e.target.checked})}
                        className="rounded"
                      />
                      <div>
                        <div className="font-medium">Marketing Emails</div>
                        <div className="text-sm text-gray-500">Receive promotional content and updates</div>
                      </div>
                    </label>
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
                        onChange={(e) => setPrivacy({...privacy, profileVisibility: e.target.value})}
                        className="w-full border rounded-md px-3 py-2 text-sm"
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
                        onChange={(e) => setPrivacy({...privacy, showEmail: e.target.checked})}
                        className="rounded"
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
                        onChange={(e) => setPrivacy({...privacy, showPhone: e.target.checked})}
                        className="rounded"
                      />
                      <div>
                        <div className="font-medium">Show Phone Number</div>
                        <div className="text-sm text-gray-500">Allow others to see your phone number</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Subscription & Billing</h2>
                  
                  {/* Current Plan */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-indigo-900">Free Plan</h3>
                        <p className="text-sm text-indigo-700">Perfect for getting started</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-indigo-900">$0</div>
                        <div className="text-sm text-indigo-700">per month</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-indigo-800">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Up to 3 events per month</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>100 registrations per event</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Basic analytics</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Email support</span>
                      </div>
                    </div>
                  </div>

                  {/* Upgrade Options */}
                  <div>
                    <h3 className="font-semibold mb-4">Upgrade Your Plan</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Pro Plan */}
                      <div className="border-2 border-indigo-200 rounded-lg p-6 hover:border-indigo-400 transition-all">
                        <div className="mb-4">
                          <h4 className="text-lg font-bold">Pro Plan</h4>
                          <div className="text-2xl font-bold text-indigo-600 mt-2">₹4,999<span className="text-sm font-normal text-gray-600">/month</span></div>
                        </div>
                        <div className="space-y-2 text-sm mb-6">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>Unlimited events</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>Unlimited registrations</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>Advanced analytics</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>Custom branding</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>Priority support</span>
                          </div>
                        </div>
                        <button className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">
                          Upgrade to Pro
                        </button>
                      </div>

                      {/* Enterprise Plan */}
                      <div className="border-2 border-purple-200 rounded-lg p-6 hover:border-purple-400 transition-all">
                        <div className="mb-4">
                          <h4 className="text-lg font-bold">Enterprise Plan</h4>
                          <div className="text-2xl font-bold text-purple-600 mt-2">₹14,999<span className="text-sm font-normal text-gray-600">/month</span></div>
                        </div>
                        <div className="space-y-2 text-sm mb-6">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>Everything in Pro</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>Dedicated account manager</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>Custom integrations</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>White-label solution</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>24/7 phone support</span>
                          </div>
                        </div>
                        <button className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700">
                          Upgrade to Enterprise
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Billing History */}
                  <div>
                    <h3 className="font-semibold mb-4">Billing History</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left p-3 font-medium">Date</th>
                            <th className="text-left p-3 font-medium">Description</th>
                            <th className="text-left p-3 font-medium">Amount</th>
                            <th className="text-left p-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-3 text-gray-500" colSpan={4}>No billing history yet</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="font-semibold mb-4">Payment Method</h3>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-600">No payment method added</p>
                      <button className="mt-3 text-indigo-600 text-sm font-medium hover:underline">
                        + Add Payment Method
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Appearance</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Theme</label>
                      <div className="grid grid-cols-3 gap-4">
                        <button className="p-4 border rounded-lg text-center hover:bg-gray-50">
                          <div className="w-full h-8 bg-white border rounded mb-2"></div>
                          <div className="text-sm">Light</div>
                        </button>
                        <button className="p-4 border rounded-lg text-center hover:bg-gray-50">
                          <div className="w-full h-8 bg-gray-800 rounded mb-2"></div>
                          <div className="text-sm">Dark</div>
                        </button>
                        <button className="p-4 border rounded-lg text-center hover:bg-gray-50">
                          <div className="w-full h-8 bg-gradient-to-r from-white to-gray-800 rounded mb-2"></div>
                          <div className="text-sm">Auto</div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'language' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Language & Region</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Language</label>
                      <select className="w-full border rounded-md px-3 py-2 text-sm">
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Time Zone</label>
                      <select className="w-full border rounded-md px-3 py-2 text-sm">
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
