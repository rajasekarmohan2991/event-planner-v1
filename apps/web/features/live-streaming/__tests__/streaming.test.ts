/**
 * Live Streaming Module - Comprehensive Test Suite
 * 
 * Tests all streaming functionality including:
 * - Stream setup and credentials generation
 * - Token generation for viewers
 * - Stream status management
 * - Live chat functionality
 * - Analytics tracking
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

// Mock environment variables
process.env.NEXT_PUBLIC_AGORA_APP_ID = 'test-app-id'
process.env.AGORA_APP_CERTIFICATE = 'test-certificate'

describe('Live Streaming Module', () => {
  
  // ============================================================================
  // STREAM SETUP API TESTS
  // ============================================================================
  
  describe('POST /api/features/streaming/setup', () => {
    it('should create a new stream session with valid data', async () => {
      const payload = {
        sessionId: 1,
        eventId: 1,
        title: 'Test Live Stream',
        recordingEnabled: true,
        accessLevel: 'ticket_holders'
      }

      const response = await fetch('/api/features/streaming/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.stream).toBeDefined()
      expect(data.stream.id).toBeDefined()
      expect(data.stream.channelName).toBeDefined()
      expect(data.stream.rtmpUrl).toBeDefined()
      expect(data.stream.streamKey).toBeDefined()
      expect(data.stream.playbackUrl).toBeDefined()
      expect(data.stream.appId).toBe('test-app-id')
    })

    it('should return 400 if sessionId is missing', async () => {
      const payload = {
        eventId: 1,
        title: 'Test Stream'
      }

      const response = await fetch('/api/features/streaming/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('sessionId')
    })

    it('should return 400 if eventId is missing', async () => {
      const payload = {
        sessionId: 1,
        title: 'Test Stream'
      }

      const response = await fetch('/api/features/streaming/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('eventId')
    })

    it('should return 401 if user is not authenticated', async () => {
      const payload = {
        sessionId: 1,
        eventId: 1,
        title: 'Test Stream'
      }

      const response = await fetch('/api/features/streaming/setup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': '' // No session cookie
        },
        body: JSON.stringify(payload)
      })

      expect(response.status).toBe(401)
    })

    it('should generate unique channel names for different sessions', async () => {
      const payload1 = {
        sessionId: 1,
        eventId: 1,
        title: 'Stream 1'
      }

      const payload2 = {
        sessionId: 2,
        eventId: 1,
        title: 'Stream 2'
      }

      const response1 = await fetch('/api/features/streaming/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload1)
      })

      const response2 = await fetch('/api/features/streaming/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload2)
      })

      const data1 = await response1.json()
      const data2 = await response2.json()

      expect(data1.stream.channelName).not.toBe(data2.stream.channelName)
      expect(data1.stream.streamKey).not.toBe(data2.stream.streamKey)
    })
  })

  describe('GET /api/features/streaming/setup', () => {
    it('should retrieve existing stream by sessionId', async () => {
      // First create a stream
      const createPayload = {
        sessionId: 1,
        eventId: 1,
        title: 'Test Stream'
      }

      await fetch('/api/features/streaming/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload)
      })

      // Then retrieve it
      const response = await fetch('/api/features/streaming/setup?sessionId=1')
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.stream).toBeDefined()
      expect(data.stream.title).toBe('Test Stream')
    })

    it('should return 404 if stream does not exist', async () => {
      const response = await fetch('/api/features/streaming/setup?sessionId=99999')
      
      expect(response.status).toBe(404)
    })

    it('should return 400 if sessionId is missing', async () => {
      const response = await fetch('/api/features/streaming/setup')
      
      expect(response.status).toBe(400)
    })
  })

  // ============================================================================
  // TOKEN GENERATION API TESTS
  // ============================================================================

  describe('GET /api/features/streaming/token', () => {
    let streamId: string

    beforeEach(async () => {
      // Create a stream for testing
      const createPayload = {
        sessionId: 1,
        eventId: 1,
        title: 'Test Stream'
      }

      const response = await fetch('/api/features/streaming/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload)
      })

      const data = await response.json()
      streamId = data.stream.id
    })

    it('should generate viewer token for valid stream', async () => {
      const response = await fetch(`/api/features/streaming/token?streamId=${streamId}`)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.token).toBeDefined()
      expect(data.channelName).toBeDefined()
      expect(data.appId).toBe('test-app-id')
      expect(data.uid).toBeDefined()
    })

    it('should return 400 if streamId is missing', async () => {
      const response = await fetch('/api/features/streaming/token')
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('streamId')
    })

    it('should return 404 if stream does not exist', async () => {
      const response = await fetch('/api/features/streaming/token?streamId=invalid-id')
      
      expect(response.status).toBe(404)
    })

    it('should track viewer when token is generated', async () => {
      const response = await fetch(`/api/features/streaming/token?streamId=${streamId}`)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.viewerId).toBeDefined()
    })

    it('should generate unique tokens for different viewers', async () => {
      const response1 = await fetch(`/api/features/streaming/token?streamId=${streamId}`)
      const response2 = await fetch(`/api/features/streaming/token?streamId=${streamId}`)
      
      const data1 = await response1.json()
      const data2 = await response2.json()
      
      expect(data1.token).not.toBe(data2.token)
      expect(data1.uid).not.toBe(data2.uid)
    })
  })

  // ============================================================================
  // STREAM STATUS API TESTS
  // ============================================================================

  describe('POST /api/features/streaming/status', () => {
    let streamId: string

    beforeEach(async () => {
      const createPayload = {
        sessionId: 1,
        eventId: 1,
        title: 'Test Stream'
      }

      const response = await fetch('/api/features/streaming/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload)
      })

      const data = await response.json()
      streamId = data.stream.id
    })

    it('should update stream status to live', async () => {
      const payload = {
        streamId,
        status: 'live'
      }

      const response = await fetch('/api/features/streaming/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.stream.status).toBe('live')
      expect(data.stream.startedAt).toBeDefined()
    })

    it('should update stream status to ended', async () => {
      // First set to live
      await fetch('/api/features/streaming/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, status: 'live' })
      })

      // Then end it
      const response = await fetch('/api/features/streaming/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, status: 'ended' })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.stream.status).toBe('ended')
      expect(data.stream.endedAt).toBeDefined()
    })

    it('should update viewer count', async () => {
      const payload = {
        streamId,
        viewerCount: 50
      }

      const response = await fetch('/api/features/streaming/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.stream.viewerCount).toBe(50)
    })

    it('should track peak viewers', async () => {
      // Set initial viewer count
      await fetch('/api/features/streaming/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, viewerCount: 50 })
      })

      // Set higher viewer count
      const response = await fetch('/api/features/streaming/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, viewerCount: 100 })
      })

      const data = await response.json()
      expect(data.stream.peakViewers).toBe(100)
    })

    it('should return 400 if streamId is missing', async () => {
      const response = await fetch('/api/features/streaming/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'live' })
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 if stream does not exist', async () => {
      const response = await fetch('/api/features/streaming/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId: 'invalid-id', status: 'live' })
      })

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/features/streaming/status', () => {
    let streamId: string

    beforeEach(async () => {
      const createPayload = {
        sessionId: 1,
        eventId: 1,
        title: 'Test Stream'
      }

      const response = await fetch('/api/features/streaming/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload)
      })

      const data = await response.json()
      streamId = data.stream.id
    })

    it('should retrieve stream status and analytics', async () => {
      const response = await fetch(`/api/features/streaming/status?streamId=${streamId}`)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.stream).toBeDefined()
      expect(data.stream.status).toBeDefined()
      expect(data.stream.viewerCount).toBeDefined()
      expect(data.stream.isLive).toBeDefined()
    })

    it('should calculate stream duration for live streams', async () => {
      // Set stream to live
      await fetch('/api/features/streaming/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, status: 'live' })
      })

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 2000))

      const response = await fetch(`/api/features/streaming/status?streamId=${streamId}`)
      const data = await response.json()
      
      expect(data.stream.duration).toBeGreaterThan(0)
    })

    it('should return 400 if streamId is missing', async () => {
      const response = await fetch('/api/features/streaming/status')
      
      expect(response.status).toBe(400)
    })

    it('should return 404 if stream does not exist', async () => {
      const response = await fetch('/api/features/streaming/status?streamId=invalid-id')
      
      expect(response.status).toBe(404)
    })
  })

  // ============================================================================
  // CHAT API TESTS
  // ============================================================================

  describe('POST /api/features/streaming/chat', () => {
    let streamId: string

    beforeEach(async () => {
      const createPayload = {
        sessionId: 1,
        eventId: 1,
        title: 'Test Stream'
      }

      const response = await fetch('/api/features/streaming/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload)
      })

      const data = await response.json()
      streamId = data.stream.id
    })

    it('should send a chat message', async () => {
      const payload = {
        streamId,
        message: 'Hello from test!'
      }

      const response = await fetch('/api/features/streaming/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.message).toBeDefined()
      expect(data.message.id).toBeDefined()
      expect(data.message.message).toBe('Hello from test!')
      expect(data.message.userName).toBeDefined()
      expect(data.message.createdAt).toBeDefined()
    })

    it('should send a reaction', async () => {
      const payload = {
        streamId,
        message: '👍',
        type: 'reaction'
      }

      const response = await fetch('/api/features/streaming/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message.type).toBe('reaction')
      expect(data.message.message).toBe('👍')
    })

    it('should return 400 if streamId is missing', async () => {
      const response = await fetch('/api/features/streaming/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' })
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 if message is empty', async () => {
      const response = await fetch('/api/features/streaming/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, message: '' })
      })

      expect(response.status).toBe(400)
    })

    it('should return 401 if user is not authenticated', async () => {
      const response = await fetch('/api/features/streaming/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': '' // No session
        },
        body: JSON.stringify({ streamId, message: 'Hello' })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/features/streaming/chat', () => {
    let streamId: string

    beforeEach(async () => {
      const createPayload = {
        sessionId: 1,
        eventId: 1,
        title: 'Test Stream'
      }

      const response = await fetch('/api/features/streaming/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload)
      })

      const data = await response.json()
      streamId = data.stream.id

      // Send some test messages
      await fetch('/api/features/streaming/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, message: 'Message 1' })
      })

      await fetch('/api/features/streaming/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, message: 'Message 2' })
      })
    })

    it('should retrieve chat messages', async () => {
      const response = await fetch(`/api/features/streaming/chat?streamId=${streamId}`)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.messages).toBeDefined()
      expect(Array.isArray(data.messages)).toBe(true)
      expect(data.messages.length).toBeGreaterThan(0)
    })

    it('should limit messages when limit parameter is provided', async () => {
      const response = await fetch(`/api/features/streaming/chat?streamId=${streamId}&limit=1`)
      
      const data = await response.json()
      expect(data.messages.length).toBeLessThanOrEqual(1)
    })

    it('should return messages in chronological order', async () => {
      const response = await fetch(`/api/features/streaming/chat?streamId=${streamId}`)
      
      const data = await response.json()
      const timestamps = data.messages.map((m: any) => new Date(m.createdAt).getTime())
      
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1])
      }
    })

    it('should return 400 if streamId is missing', async () => {
      const response = await fetch('/api/features/streaming/chat')
      
      expect(response.status).toBe(400)
    })

    it('should return 404 if stream does not exist', async () => {
      const response = await fetch('/api/features/streaming/chat?streamId=invalid-id')
      
      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/features/streaming/chat', () => {
    let streamId: string
    let messageId: string

    beforeEach(async () => {
      const createPayload = {
        sessionId: 1,
        eventId: 1,
        title: 'Test Stream'
      }

      const streamResponse = await fetch('/api/features/streaming/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload)
      })

      const streamData = await streamResponse.json()
      streamId = streamData.stream.id

      // Send a message
      const messageResponse = await fetch('/api/features/streaming/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, message: 'Test message' })
      })

      const messageData = await messageResponse.json()
      messageId = messageData.message.id
    })

    it('should delete a chat message', async () => {
      const response = await fetch(`/api/features/streaming/chat?messageId=${messageId}`, {
        method: 'DELETE'
      })

      expect(response.status).toBe(200)
    })

    it('should return 400 if messageId is missing', async () => {
      const response = await fetch('/api/features/streaming/chat', {
        method: 'DELETE'
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 if message does not exist', async () => {
      const response = await fetch('/api/features/streaming/chat?messageId=invalid-id', {
        method: 'DELETE'
      })

      expect(response.status).toBe(404)
    })
  })

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('End-to-End Streaming Flow', () => {
    it('should complete full streaming lifecycle', async () => {
      // 1. Create stream
      const setupResponse = await fetch('/api/features/streaming/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 1,
          eventId: 1,
          title: 'E2E Test Stream'
        })
      })

      expect(setupResponse.status).toBe(200)
      const setupData = await setupResponse.json()
      const streamId = setupData.stream.id

      // 2. Generate viewer token
      const tokenResponse = await fetch(`/api/features/streaming/token?streamId=${streamId}`)
      expect(tokenResponse.status).toBe(200)
      const tokenData = await tokenResponse.json()
      expect(tokenData.token).toBeDefined()

      // 3. Start stream
      const startResponse = await fetch('/api/features/streaming/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, status: 'live' })
      })
      expect(startResponse.status).toBe(200)

      // 4. Send chat message
      const chatResponse = await fetch('/api/features/streaming/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, message: 'Hello E2E!' })
      })
      expect(chatResponse.status).toBe(200)

      // 5. Update viewer count
      const viewerResponse = await fetch('/api/features/streaming/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, viewerCount: 100 })
      })
      expect(viewerResponse.status).toBe(200)

      // 6. Get stream status
      const statusResponse = await fetch(`/api/features/streaming/status?streamId=${streamId}`)
      expect(statusResponse.status).toBe(200)
      const statusData = await statusResponse.json()
      expect(statusData.stream.isLive).toBe(true)
      expect(statusData.stream.viewerCount).toBe(100)

      // 7. End stream
      const endResponse = await fetch('/api/features/streaming/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, status: 'ended' })
      })
      expect(endResponse.status).toBe(200)

      // 8. Verify stream ended
      const finalStatusResponse = await fetch(`/api/features/streaming/status?streamId=${streamId}`)
      const finalStatusData = await finalStatusResponse.json()
      expect(finalStatusData.stream.status).toBe('ended')
      expect(finalStatusData.stream.endedAt).toBeDefined()
    })
  })
})
