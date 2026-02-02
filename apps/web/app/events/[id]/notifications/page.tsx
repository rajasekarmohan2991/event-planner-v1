"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Bell, Calendar, Clock, Mail, MessageSquare, Send, TrendingUp, Users, Eye, MousePointer, XCircle } from 'lucide-react'

export default function NotificationsPage() {
  const params = useParams<{ id: string }>()
  const eventId = String(params?.id || '')
  
  const [activeTab, setActiveTab] = useState<'scheduled' | 'campaigns'>('scheduled')
  const [notifications, setNotifications] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Schedule form state
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    type: 'EMAIL',
    trigger: 'MANUAL',
    scheduledFor: '',
    subject: '',
    message: '',
    includeRegistrations: true,
    includeRsvps: true,
  })

  useEffect(() => {
    loadData()
  }, [eventId, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'scheduled') {
        const res = await fetch(`/api/events/${eventId}/notifications/schedule`)
        if (res.ok) {
          const data = await res.json()
          setNotifications(data)
        }
      } else {
        const res = await fetch(`/api/events/${eventId}/campaigns`)
        if (res.ok) {
          const data = await res.json()
          setCampaigns(data)
        }
      }
    } catch (e) {
      console.error('Failed to load data', e)
    } finally {
      setLoading(false)
    }
  }

  const scheduleNotification = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/notifications/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scheduleForm,
          recipientFilter: {
            includeRegistrations: scheduleForm.includeRegistrations,
            includeRsvps: scheduleForm.includeRsvps,
          }
        })
      })

      if (res.ok) {
        setShowScheduleForm(false)
        setScheduleForm({
          type: 'EMAIL',
          trigger: 'MANUAL',
          scheduledFor: '',
          subject: '',
          message: '',
          includeRegistrations: true,
          includeRsvps: true,
        })
        loadData()
      } else {
        alert('Failed to schedule notification')
      }
    } catch (e) {
      console.error('Schedule error:', e)
      alert('Failed to schedule notification')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'bg-green-100 text-green-800'
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Schedule reminders and track campaign performance
          </p>
        </div>
        {activeTab === 'scheduled' && (
          <button
            onClick={() => setShowScheduleForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Schedule Notification
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'scheduled'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Scheduled Notifications
            </div>
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'campaigns'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Campaign Analytics
            </div>
          </button>
        </div>
      </div>

      {/* Schedule Form Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Schedule Notification</h2>
              <button
                onClick={() => setShowScheduleForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={scheduleForm.type}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Trigger</label>
                <select
                  value={scheduleForm.trigger}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, trigger: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="EVENT_REMINDER_1WEEK">1 Week Before Event</option>
                  <option value="EVENT_REMINDER_1DAY">1 Day Before Event</option>
                  <option value="EVENT_REMINDER_1HOUR">1 Hour Before Event</option>
                  <option value="POST_EVENT_THANKYOU">Post-Event Thank You</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Schedule For</label>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduledFor}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledFor: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              {scheduleForm.type === 'EMAIL' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <input
                    type="text"
                    value={scheduleForm.subject}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, subject: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Email subject"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={scheduleForm.message}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, message: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md min-h-[150px]"
                  placeholder="Your message..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Recipients</label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={scheduleForm.includeRegistrations}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, includeRegistrations: e.target.checked })}
                  />
                  <span className="text-sm">Include Registrations</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={scheduleForm.includeRsvps}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, includeRsvps: e.target.checked })}
                  />
                  <span className="text-sm">Include RSVPs</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={scheduleNotification}
                  disabled={!scheduleForm.scheduledFor || !scheduleForm.message}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Schedule
                </button>
                <button
                  onClick={() => setShowScheduleForm(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Notifications Tab */}
      {activeTab === 'scheduled' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No scheduled notifications yet</p>
              <button
                onClick={() => setShowScheduleForm(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Schedule Your First Notification
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="bg-white rounded-lg border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {notification.type === 'EMAIL' && <Mail className="w-5 h-5 text-indigo-600" />}
                      {notification.type === 'SMS' && <MessageSquare className="w-5 h-5 text-indigo-600" />}
                      {notification.type === 'WHATSAPP' && <MessageSquare className="w-5 h-5 text-green-600" />}
                      <div>
                        <h3 className="font-semibold">{notification.subject || 'Notification'}</h3>
                        <p className="text-sm text-muted-foreground">{notification.trigger}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                      {notification.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{notification.message}</p>
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(notification.scheduledFor).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {notification.recipientCount} recipients
                    </div>
                    {notification.sentAt && (
                      <div className="flex items-center gap-1">
                        <Send className="w-4 h-4" />
                        Sent {new Date(notification.sentAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Campaign Analytics Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No campaigns yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Send emails from the Communicate page to start tracking analytics
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white rounded-lg border p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created {new Date(campaign.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                        <Send className="w-4 h-4" />
                      </div>
                      <div className="text-2xl font-bold">{campaign.totalSent}</div>
                      <div className="text-xs text-muted-foreground">Sent</div>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="text-2xl font-bold">{campaign.totalDelivered}</div>
                      <div className="text-xs text-muted-foreground">Delivered</div>
                    </div>
                    
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div className="text-2xl font-bold">{campaign.totalOpened}</div>
                      <div className="text-xs text-muted-foreground">
                        Opened ({campaign.totalSent > 0 ? Math.round((campaign.totalOpened / campaign.totalSent) * 100) : 0}%)
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                        <MousePointer className="w-4 h-4" />
                      </div>
                      <div className="text-2xl font-bold">{campaign.totalClicked}</div>
                      <div className="text-xs text-muted-foreground">
                        Clicked ({campaign.totalSent > 0 ? Math.round((campaign.totalClicked / campaign.totalSent) * 100) : 0}%)
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                        <XCircle className="w-4 h-4" />
                      </div>
                      <div className="text-2xl font-bold">{campaign.totalBounced}</div>
                      <div className="text-xs text-muted-foreground">Bounced</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
