"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Eye, Radio, Settings, Users, MessageSquare, BarChart } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface StreamData {
  id: string
  channelName: string
  rtmpUrl: string
  streamKey: string
  token: string
  appId: string
  playbackUrl: string
  status: string
  viewerCount: number
  peakViewers: number
  title: string
}

export default function StreamSetupPage() {
  const params = useParams()
  const { id: eventId, sessionId } = params
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [stream, setStream] = useState<StreamData | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [streamDuration, setStreamDuration] = useState(0)

  // Load existing stream or create new
  useEffect(() => {
    loadStream()
  }, [sessionId])

  // Poll for live status
  useEffect(() => {
    if (!stream?.id) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/features/streaming/status?streamId=${stream.id}`)
        if (res.ok) {
          const data = await res.json()
          setIsLive(data.stream.isLive)
          setViewerCount(data.stream.activeViewers)
          setStreamDuration(data.stream.duration)
        }
      } catch (e) {
        console.error('Failed to fetch stream status:', e)
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [stream?.id])

  const loadStream = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/features/streaming/setup?sessionId=${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        setStream(data.stream)
        setIsLive(data.stream.status === 'live')
      }
    } catch (e) {
      console.error('Failed to load stream:', e)
    } finally {
      setLoading(false)
    }
  }

  const setupStream = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/features/streaming/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          eventId,
          title: 'Live Stream',
          recordingEnabled: true,
          accessLevel: 'ticket_holders'
        })
      })

      if (res.ok) {
        const data = await res.json()
        setStream(data.stream)
        toast({
          title: 'Stream Setup Complete',
          description: 'Your streaming credentials are ready!'
        })
      } else {
        const error = await res.json()
        toast({
          title: 'Setup Failed',
          description: error.message,
          variant: 'destructive'
        })
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`
    })
  }

  const goLive = async () => {
    if (!stream?.id) return

    try {
      const res = await fetch('/api/features/streaming/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: stream.id,
          status: 'live'
        })
      })

      if (res.ok) {
        setIsLive(true)
        toast({
          title: '🔴 You are LIVE!',
          description: 'Your stream is now broadcasting'
        })
      }
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Failed to start stream',
        variant: 'destructive'
      })
    }
  }

  const endStream = async () => {
    if (!stream?.id) return

    try {
      const res = await fetch('/api/features/streaming/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: stream.id,
          status: 'ended'
        })
      })

      if (res.ok) {
        setIsLive(false)
        toast({
          title: 'Stream Ended',
          description: 'Your stream has been stopped'
        })
      }
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Failed to end stream',
        variant: 'destructive'
      })
    }
  }

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading && !stream) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Streaming</h1>
          <p className="text-muted-foreground">Broadcast your session to virtual attendees</p>
        </div>
        <div className="flex items-center gap-3">
          {isLive && (
            <Badge variant="destructive" className="animate-pulse">
              <Radio className="w-3 h-3 mr-1" />
              LIVE
            </Badge>
          )}
          {!stream ? (
            <Button onClick={setupStream} disabled={loading}>
              <Settings className="w-4 h-4 mr-2" />
              Setup Stream
            </Button>
          ) : isLive ? (
            <Button onClick={endStream} variant="destructive">
              End Stream
            </Button>
          ) : (
            <Button onClick={goLive} className="bg-red-600 hover:bg-red-700">
              <Radio className="w-4 h-4 mr-2" />
              Go Live
            </Button>
          )}
        </div>
      </div>

      {!stream ? (
        <Card>
          <CardHeader>
            <CardTitle>Get Started with Live Streaming</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Click "Setup Stream" to generate your streaming credentials and start broadcasting.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">What you'll need:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Streaming software (OBS Studio, Streamyard, etc.)</li>
                <li>Camera and microphone</li>
                <li>Stable internet connection (5+ Mbps upload)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Live Stats */}
          {isLive && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Current Viewers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{viewerCount}</div>
                  <p className="text-xs text-muted-foreground">Peak: {stream.peakViewers || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <BarChart className="w-4 h-4 mr-2" />
                    Duration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatDuration(streamDuration)}</div>
                  <p className="text-xs text-muted-foreground">Live time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    Watch Link
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(stream.playbackUrl, '_blank')}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Stream
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <Tabs defaultValue="credentials" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="guide">Setup Guide</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="credentials" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Streaming Credentials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>RTMP URL</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={stream.rtmpUrl} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(stream.rtmpUrl, 'RTMP URL')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Stream Key</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="password"
                        value={stream.streamKey}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(stream.streamKey, 'Stream Key')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Keep this private! Anyone with this key can stream to your channel.
                    </p>
                  </div>

                  <div>
                    <Label>Watch URL</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={stream.playbackUrl} readOnly className="text-sm" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(stream.playbackUrl, 'Watch URL')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="guide" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>How to Stream with OBS Studio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Step 1: Download OBS Studio</h3>
                    <p className="text-sm text-muted-foreground">
                      Download from{' '}
                      <a
                        href="https://obsproject.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        obsproject.com
                      </a>{' '}
                      (free and open source)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Step 2: Configure Stream Settings</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Open OBS Studio</li>
                      <li>Go to Settings → Stream</li>
                      <li>Select "Custom" as Service</li>
                      <li>Paste the RTMP URL in Server field</li>
                      <li>Paste the Stream Key in Stream Key field</li>
                      <li>Click Apply and OK</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Step 3: Add Sources</h3>
                    <p className="text-sm text-muted-foreground">
                      Add video sources (camera, screen capture, images) and audio sources
                      (microphone, desktop audio)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Step 4: Start Streaming</h3>
                    <p className="text-sm text-muted-foreground">
                      Click "Start Streaming" in OBS, then click "Go Live" above to notify attendees
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-sm mb-2">💡 Pro Tips:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Test your stream before going live</li>
                      <li>Use a wired internet connection if possible</li>
                      <li>Close unnecessary applications to save bandwidth</li>
                      <li>Have good lighting for better video quality</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Stream Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Access Level</Label>
                    <p className="text-sm text-muted-foreground">
                      Current: Ticket Holders Only
                    </p>
                  </div>

                  <div>
                    <Label>Recording</Label>
                    <p className="text-sm text-muted-foreground">
                      Enabled - Stream will be automatically recorded
                    </p>
                  </div>

                  <div>
                    <Label>Channel Name</Label>
                    <p className="text-sm text-muted-foreground font-mono">
                      {stream.channelName}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
