"use client"

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { Mail, MessageSquare, Share2, Users, Send, Copy, Check, Facebook, Twitter, Linkedin, Link as LinkIcon, Download, QrCode } from 'lucide-react'
import QRCode from 'qrcode'

export default function EventCommunicatePage() {
  return <CommunicateContent />
}

function CommunicateContent() {
  const { status } = useSession()
  const params = useParams<{ id: string }>()
  const eventId = String(params?.id || '')

  const [event, setEvent] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'email' | 'sms' | 'whatsapp' | 'share'>('email')

  // Email state
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [sending, setSending] = useState(false)
  const [emailResult, setEmailResult] = useState<string | null>(null)

  // Invite state
  const [inviteEmails, setInviteEmails] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<string | null>(null)

  // SMS state
  const [smsMessage, setSmsMessage] = useState('')
  const [smsPhones, setSmsPhones] = useState<string[]>([])
  const [sendingSms, setSendingSms] = useState(false)
  const [smsResult, setSmsResult] = useState<string | null>(null)
  const [loadingPhones, setLoadingPhones] = useState(false)

  // WhatsApp state
  const [waMessage, setWaMessage] = useState('')
  const [waPhones, setWaPhones] = useState<string[]>([])
  const [sendingWa, setSendingWa] = useState(false)
  const [waResult, setWaResult] = useState<string | null>(null)

  // Share state
  const [copied, setCopied] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setEvent(data)
          setEmailSubject(`You're invited to ${data.name}!`)
          setEmailBody(`Hi there!\n\nYou're invited to ${data.name}.\n\nEvent Details:\n- Date: ${data.startTime ? new Date(data.startTime).toLocaleDateString() : 'TBD'}\n- Location: ${data.venue || 'TBD'}\n\nRegister now to secure your spot!\n\nBest regards,\nEvent Team`)

          // Set share link
          const publicUrl = `${window.location.origin}/events/${eventId}/public`
          setShareLink(publicUrl)

          // Generate QR code
          generateQRCode(publicUrl)

          // Set default SMS message
          setSmsMessage(`You're invited to ${data.name}! View details: ${publicUrl}`)
          setWaMessage(`🎉 You're invited to ${data.name}!\n\nView details and register: ${publicUrl}`)
        }
      } catch (e) {
        console.error('Failed to load event', e)
      }
    }
    if (eventId) loadEvent()
  }, [eventId])

  const loadPhoneNumbers = async () => {
    setLoadingPhones(true)
    try {
      const res = await fetch(`/api/events/${eventId}/registrations`)
      if (res.ok) {
        const data = await res.json()
        // Handle both array and object with registrations property
        const registrations = Array.isArray(data) ? data : (data.registrations || [])
        const phones = registrations
          .map((r: any) => {
            // Robustly extract phone number from various possible locations
            let data = r
            if (r.dataJson) {
              try {
                data = typeof r.dataJson === 'string' ? JSON.parse(r.dataJson) : r.dataJson
              } catch (e) {
                console.error('Failed to parse registration dataJson', e)
              }
            } else if (r.data_json) { // Handle snake_case from raw query
              try {
                data = typeof r.data_json === 'string' ? JSON.parse(r.data_json) : r.data_json
              } catch (e) { }
            }

            return data.phone || data.contactPhone || data.cellPhone || data.workPhone || r.phone || r.contactPhone
          })
          .filter((p: string) => p && p.trim())
        console.log('📞 Loaded phone numbers:', phones)
        setSmsPhones(phones)
        setWaPhones(phones)
      }
    } catch (e) {
      console.error('Failed to load phone numbers', e)
    } finally {
      setLoadingPhones(false)
    }
  }

  const generateQRCode = async (url: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeUrl(qrDataUrl)
    } catch (err) {
      console.error('Failed to generate QR code:', err)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl) return
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `event-${eventId}-qr-code.png`
    link.click()
  }

  const sendBulkEmail = async () => {
    setSending(true)
    setEmailResult(null)
    try {
      const res = await fetch(`/api/events/${eventId}/attendees/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${event?.name || 'Event'}</h2>
            ${emailBody.split('\n').map(line => `<p>${line}</p>`).join('')}
            <p style="margin-top: 30px;">
              <a href="${shareLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Event & Register
              </a>
            </p>
          </div>`,
          includeRegistrations: true,
          includeRsvps: true,
          dedupe: true,
          dryRun: false
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to send emails')
      }

      const data = await res.json()
      setEmailResult(`✅ Successfully sent ${data.sent} emails to attendees!`)
    } catch (e: any) {
      setEmailResult(`❌ Error: ${e?.message || 'Failed to send emails. Check SMTP configuration.'}`)
    } finally {
      setSending(false)
    }
  }

  const sendInvites = async () => {
    setInviting(true)
    setInviteResult(null)
    try {
      const emails = inviteEmails.split(',').map(e => e.trim()).filter(e => e)
      if (emails.length === 0) {
        throw new Error('Please enter at least one email address')
      }

      const res = await fetch(`/api/events/${eventId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails,
          subject: `You're invited to ${event?.name}!`,
          message: `You've been invited to ${event?.name}. Click the link below to view details and register.`,
          eventUrl: shareLink
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to send invites')
      }

      const data = await res.json()
      setInviteResult(`✅ Sent ${data.sent || emails.length} invitations!`)
      setInviteEmails('')
    } catch (e: any) {
      setInviteResult(`❌ ${e?.message || 'Failed to send invites'}`)
    } finally {
      setInviting(false)
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareToSocial = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    const text = `Check out ${event?.name}!`
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`
    }
    window.open(urls[platform], '_blank', 'width=600,height=400')
  }

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Communication & Invites</h1>
        <p className="text-muted-foreground mt-2">
          Send emails, SMS, and share your event on social media
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('email')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${activeTab === 'email'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Invites
            </div>
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${activeTab === 'sms'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              SMS Messages
            </div>
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${activeTab === 'whatsapp'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </div>
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${activeTab === 'share'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Social Share
            </div>
          </button>
        </div>
      </div>

      {/* Email Tab */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          {/* Quick Invite */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">Quick Invite</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Send personalized invitations to specific people
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Addresses (comma-separated)
              </label>
              <textarea
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder="john@example.com, jane@example.com, ..."
                className="w-full px-3 py-2 border rounded-md min-h-[100px]"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={sendInvites}
                disabled={inviting || !inviteEmails.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {inviting ? 'Sending...' : 'Send Invites'}
              </button>
            </div>
            {inviteResult && (
              <div className={`p-3 rounded-md text-sm ${inviteResult.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                {inviteResult}
              </div>
            )}
          </div>

          {/* Bulk Email to Attendees */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">Email All Attendees</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Send updates to all registered attendees and RSVPs
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full px-3 py-2 border rounded-md min-h-[200px]"
                placeholder="Your message to attendees"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={sendBulkEmail}
                disabled={sending || !emailSubject || !emailBody}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send to All Attendees'}
              </button>
            </div>
            {emailResult && (
              <div className={`p-3 rounded-md text-sm ${emailResult.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                {emailResult}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SMS Tab */}
      {activeTab === 'sms' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold">Send SMS to Attendees</h2>
              </div>
              <button
                onClick={loadPhoneNumbers}
                disabled={loadingPhones}
                className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingPhones ? 'Loading...' : `Load Phone Numbers (${smsPhones.length})`}
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Send SMS messages to all registered attendees with phone numbers
            </p>

            {smsPhones.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                ⚠️ No phone numbers found. Click "Load Phone Numbers" to fetch from registrations.
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">SMS Message</label>
                <span className="text-xs text-muted-foreground">
                  {smsMessage.length}/160 characters {smsMessage.length > 160 && `(${Math.ceil(smsMessage.length / 160)} SMS)`}
                </span>
              </div>
              <textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                className="w-full px-3 py-2 border rounded-md min-h-[120px]"
                placeholder="Your SMS message to attendees..."
                maxLength={480}
              />
              {smsMessage.length > 160 && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ Message exceeds 160 characters and will be sent as {Math.ceil(smsMessage.length / 160)} SMS messages
                </p>
              )}
            </div>

            <div className="bg-gray-50 rounded-md p-3 text-sm">
              <p className="font-medium mb-1">Recipients: {smsPhones.length} phone numbers</p>
              {smsPhones.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Preview: {smsPhones.slice(0, 3).join(', ')}{smsPhones.length > 3 && ` +${smsPhones.length - 3} more`}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  setSendingSms(true)
                  setSmsResult(null)
                  try {
                    const res = await fetch(`/api/events/${eventId}/communicate/bulk`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        channels: ['sms'],
                        smsMessage,
                        smsRecipients: smsPhones,
                        text: smsMessage
                      })
                    })
                    if (!res.ok) throw new Error('Failed to send SMS')
                    const data = await res.json()
                    setSmsResult(`✅ Successfully sent ${data.results?.sms?.sent || 0} SMS messages!`)
                  } catch (e: any) {
                    setSmsResult(`❌ Error: ${e?.message || 'Failed to send SMS. Check SMSMode configuration.'}`)
                  } finally {
                    setSendingSms(false)
                  }
                }}
                disabled={sendingSms || !smsMessage.trim() || smsPhones.length === 0}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sendingSms ? 'Sending...' : `Send to ${smsPhones.length} Recipients`}
              </button>
            </div>

            {smsResult && (
              <div className={`p-3 rounded-md text-sm ${smsResult.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                {smsResult}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-800">
              <p className="font-medium mb-1">🚀 Multi-Provider SMS Support:</p>
              <div className="space-y-2">
                <div className="bg-green-100 p-2 rounded">
                  <p className="font-medium text-green-800">🎯 Twilio (RECOMMENDED)</p>
                  <p className="text-green-700">• $15 free credit when you sign up</p>
                  <p className="text-green-700">• Easy setup - just email verification</p>
                  <p className="text-green-700">• Global SMS delivery</p>
                  <p className="text-green-700">• Get free account at twilio.com</p>
                </div>
                <div className="bg-yellow-100 p-2 rounded">
                  <p className="font-medium text-yellow-800">🔄 Fallback: TextBelt (FREE)</p>
                  <p className="text-yellow-700">• No configuration needed</p>
                  <p className="text-yellow-700">• Limited by country availability</p>
                </div>
                <div className="bg-gray-100 p-2 rounded">
                  <p className="font-medium text-gray-800">⚙️ Alternative: SMSMode</p>
                  <p className="text-gray-700">• Pay-as-you-go pricing</p>
                  <p className="text-gray-700">• No subscription fees</p>
                </div>
              </div>
              <div className="mt-2 p-2 bg-blue-100 rounded text-blue-800">
                <p className="font-medium">💡 Quick Setup:</p>
                <p>1. Sign up at <a href="https://www.twilio.com/try-twilio" target="_blank" className="underline">twilio.com/try-twilio</a></p>
                <p>2. Get your Account SID, Auth Token, and phone number</p>
                <p>3. Update the environment variables above</p>
                <p>4. Restart the application</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Tab */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold">Send WhatsApp Messages</h2>
              </div>
              <button
                onClick={loadPhoneNumbers}
                disabled={loadingPhones}
                className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingPhones ? 'Loading...' : `Load Phone Numbers (${waPhones.length})`}
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Send WhatsApp messages to all registered attendees with phone numbers
            </p>

            {waPhones.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                ⚠️ No phone numbers found. Click "Load Phone Numbers" to fetch from registrations.
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">WhatsApp Message</label>
                <span className="text-xs text-muted-foreground">
                  {waMessage.length} characters
                </span>
              </div>
              <textarea
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                className="w-full px-3 py-2 border rounded-md min-h-[150px] font-sans"
                placeholder="Your WhatsApp message to attendees... (Emojis supported: 🎉 ✨ 📅)"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                💡 Tip: Use emojis to make your message more engaging! WhatsApp supports rich formatting.
              </p>
            </div>

            <div className="bg-gray-50 rounded-md p-3 text-sm">
              <p className="font-medium mb-1">Recipients: {waPhones.length} phone numbers</p>
              {waPhones.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Preview: {waPhones.slice(0, 3).join(', ')}{waPhones.length > 3 && ` +${waPhones.length - 3} more`}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  setSendingWa(true)
                  setWaResult(null)
                  try {
                    const res = await fetch(`/api/events/${eventId}/communicate/bulk`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        channels: ['whatsapp'],
                        whatsappMessage: waMessage,
                        whatsappRecipients: waPhones,
                        text: waMessage
                      })
                    })
                    if (!res.ok) throw new Error('Failed to send WhatsApp messages')
                    const data = await res.json()
                    setWaResult(`✅ Successfully sent ${data.results?.whatsapp?.sent || 0} WhatsApp messages!`)
                  } catch (e: any) {
                    setWaResult(`❌ Error: ${e?.message || 'WhatsApp not supported with SMSMode. Use WhatsApp Business API separately.'}`)
                  } finally {
                    setSendingWa(false)
                  }
                }}
                disabled={sendingWa || !waMessage.trim() || waPhones.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sendingWa ? 'Sending...' : `Send to ${waPhones.length} Recipients`}
              </button>
            </div>

            {waResult && (
              <div className={`p-3 rounded-md text-sm ${waResult.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                {waResult}
              </div>
            )}

            <div className="border-t pt-4 space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-xs text-orange-800">
                <p className="font-medium mb-1">⚠️ WhatsApp Not Supported:</p>
                <p>SMSMode doesn't support WhatsApp messaging. For WhatsApp functionality, you'll need to integrate with WhatsApp Business API separately.</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-800">
                <p className="font-medium mb-1">📝 Alternative WhatsApp Solutions:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>WhatsApp Business API (official)</li>
                  <li>Twilio WhatsApp Business API</li>
                  <li>Meta WhatsApp Cloud API (free tier available)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Tab */}
      {activeTab === 'share' && (
        <div className="space-y-6">
          {/* Share Link */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">Event Link</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this link with anyone to let them view and register for your event
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md bg-gray-50"
              />
              <button
                onClick={copyShareLink}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">Share on Social Media</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Share your event on social media platforms
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => shareToSocial('facebook')}
                className="flex-1 px-4 py-3 bg-[#1877F2] text-white rounded-md hover:opacity-90 flex items-center justify-center gap-2"
              >
                <Facebook className="w-5 h-5" />
                Facebook
              </button>
              <button
                onClick={() => shareToSocial('twitter')}
                className="flex-1 px-4 py-3 bg-[#1DA1F2] text-white rounded-md hover:opacity-90 flex items-center justify-center gap-2"
              >
                <Twitter className="w-5 h-5" />
                Twitter
              </button>
              <button
                onClick={() => shareToSocial('linkedin')}
                className="flex-1 px-4 py-3 bg-[#0A66C2] text-white rounded-md hover:opacity-90 flex items-center justify-center gap-2"
              >
                <Linkedin className="w-5 h-5" />
                LinkedIn
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">QR Code</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this QR code for easy event access. Attendees can scan it with their phone camera.
            </p>
            {qrCodeUrl ? (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <img src={qrCodeUrl} alt="Event QR Code" className="w-64 h-64" />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={downloadQRCode}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download QR Code
                  </button>
                  <button
                    onClick={() => {
                      if (qrCodeUrl) {
                        const win = window.open()
                        if (win) {
                          win.document.write(`
                            <html>
                              <head><title>Event QR Code</title></head>
                              <body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f3f4f6;">
                                <img src="${qrCodeUrl}" style="max-width:90%;height:auto;" />
                              </body>
                            </html>
                          `)
                        }
                      }
                    }}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Print QR Code
                  </button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  💡 Tip: Print this QR code on posters, flyers, or display it at your venue for easy registration
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
