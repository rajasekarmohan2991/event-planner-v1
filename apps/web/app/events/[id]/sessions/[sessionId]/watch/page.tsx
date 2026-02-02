"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Radio, Users, Send, ThumbsUp, Heart, Sparkles } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface ChatMessage {
  id: string
  userName: string
  userAvatar: string | null
  message: string
  type: string
  createdAt: string
}

export default function WatchStreamPage() {
  const params = useParams()
  const { sessionId } = params
  const { data: session } = useSession()

  const [loading, setLoading] = useState(true)
  const [stream, setStream] = useState<any>(null)
  const [isLive, setIsLive] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLDivElement>(null)

  // Load stream data
  useEffect(() => {
    loadStream()
  }, [sessionId])

  // Poll for updates
  useEffect(() => {
    if (!stream?.id) return

    const interval = setInterval(async () => {
      await Promise.all([
        fetchStreamStatus(),
        fetchChatMessages()
      ])
    }, 3000)

    return () => clearInterval(interval)
  }, [stream?.id])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadStream = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/features/streaming/setup?sessionId=${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        setStream(data.stream)
        setIsLive(data.stream.status === 'live')
        
        // Load initial chat
        await fetchChatMessages()
      }
    } catch (e) {
      console.error('Failed to load stream:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchStreamStatus = async () => {
    if (!stream?.id) return

    try {
      const res = await fetch(`/api/features/streaming/status?streamId=${stream.id}`)
      if (res.ok) {
        const data = await res.json()
        setIsLive(data.stream.isLive)
        setViewerCount(data.stream.activeViewers)
      }
    } catch (e) {
      console.error('Failed to fetch status:', e)
    }
  }

  const fetchChatMessages = async () => {
    if (!stream?.id) return

    try {
      const res = await fetch(`/api/features/streaming/chat?streamId=${stream.id}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
      }
    } catch (e) {
      console.error('Failed to fetch messages:', e)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !stream?.id || sendingMessage) return

    try {
      setSendingMessage(true)
      const res = await fetch('/api/features/streaming/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: stream.id,
          message: newMessage.trim()
        })
      })

      if (res.ok) {
        setNewMessage('')
        await fetchChatMessages()
      }
    } catch (e) {
      console.error('Failed to send message:', e)
    } finally {
      setSendingMessage(false)
    }
  }

  const sendReaction = async (emoji: string) => {
    if (!stream?.id) return

    try {
      await fetch('/api/features/streaming/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: stream.id,
          message: emoji,
          type: 'reaction'
        })
      })
    } catch (e) {
      console.error('Failed to send reaction:', e)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!stream) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6">
          <p>Stream not found or not available</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">{stream.title || 'Live Stream'}</h1>
          {isLive && (
            <Badge variant="destructive" className="animate-pulse">
              <Radio className="w-3 h-3 mr-1" />
              LIVE
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4" />
          <span>{viewerCount} watching</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Player (2/3 width) */}
        <div className="flex-1 flex flex-col bg-black">
          <div ref={videoRef} className="flex-1 flex items-center justify-center">
            {isLive ? (
              <div className="w-full h-full flex items-center justify-center">
                {/* Placeholder for Agora video player */}
                <div className="text-center text-white">
                  <Radio className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                  <p className="text-xl font-semibold">Stream is Live!</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Video player will be integrated with Agora SDK
                  </p>
                  <div className="mt-4 p-4 bg-gray-800 rounded-lg inline-block">
                    <p className="text-xs text-gray-400">Channel: {stream.channelName}</p>
                    <p className="text-xs text-gray-400">App ID: {stream.appId}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-white">
                <Radio className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-semibold">Stream Offline</p>
                <p className="text-sm text-gray-400 mt-2">
                  The stream will start soon. Stay tuned!
                </p>
              </div>
            )}
          </div>

          {/* Reactions Bar */}
          <div className="p-4 bg-gray-900 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => sendReaction('👍')}
              className="text-white hover:bg-gray-800"
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              Like
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => sendReaction('❤️')}
              className="text-white hover:bg-gray-800"
            >
              <Heart className="w-4 h-4 mr-1" />
              Love
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => sendReaction('👏')}
              className="text-white hover:bg-gray-800"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Applause
            </Button>
          </div>
        </div>

        {/* Live Chat (1/3 width) */}
        <div className="w-96 bg-gray-900 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-white font-semibold">Live Chat</h2>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  {msg.type === 'reaction' ? (
                    <div className="text-center py-1">
                      <span className="text-2xl">{msg.message}</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {msg.userAvatar ? (
                          <img
                            src={msg.userAvatar}
                            alt={msg.userName}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
                            {msg.userName[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold text-white">{msg.userName}</span>
                      </div>
                      <p className="text-gray-300 ml-8">{msg.message}</p>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-800">
            {session ? (
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={sendingMessage}
                />
                <Button
                  onClick={sendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-400">
                Sign in to participate in chat
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
