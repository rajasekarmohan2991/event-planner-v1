/**
 * Live Streaming UI Components - Test Suite
 * 
 * Tests all UI components for the streaming module:
 * - Stream setup page
 * - Watch page
 * - Chat interface
 * - Analytics display
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '29', sessionId: '1' }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        name: 'Test User',
        email: 'test@example.com',
        image: null
      }
    },
    status: 'authenticated'
  })
}))

describe('Stream Setup Page', () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn()
  })

  it('should render setup button when no stream exists', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    const { container } = render(<StreamSetupPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Setup Stream')).toBeInTheDocument()
    })
  })

  it('should display RTMP credentials after setup', async () => {
    const mockStream = {
      id: 'stream-123',
      channelName: 'test-channel',
      rtmpUrl: 'rtmp://test.com/live',
      streamKey: 'test-key-123',
      playbackUrl: 'https://test.com/watch',
      appId: 'test-app-id'
    }

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 404
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stream: mockStream })
      })

    const { container } = render(<StreamSetupPage />)
    
    // Click setup button
    const setupButton = await screen.findByText('Setup Stream')
    fireEvent.click(setupButton)

    // Wait for credentials to appear
    await waitFor(() => {
      expect(screen.getByText('RTMP URL')).toBeInTheDocument()
      expect(screen.getByText('Stream Key')).toBeInTheDocument()
      expect(screen.getByDisplayValue('rtmp://test.com/live')).toBeInTheDocument()
    })
  })

  it('should copy RTMP URL to clipboard', async () => {
    const mockStream = {
      rtmpUrl: 'rtmp://test.com/live',
      streamKey: 'test-key-123'
    }

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn()
      }
    })

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stream: mockStream })
    })

    render(<StreamSetupPage />)
    
    await waitFor(() => {
      const copyButtons = screen.getAllByRole('button', { name: /copy/i })
      fireEvent.click(copyButtons[0])
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('rtmp://test.com/live')
  })

  it('should show Go Live button when stream is ready', async () => {
    const mockStream = {
      id: 'stream-123',
      status: 'scheduled',
      rtmpUrl: 'rtmp://test.com/live',
      streamKey: 'test-key-123'
    }

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stream: mockStream })
    })

    render(<StreamSetupPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Go Live')).toBeInTheDocument()
    })
  })

  it('should update to LIVE status when Go Live is clicked', async () => {
    const mockStream = {
      id: 'stream-123',
      status: 'scheduled'
    }

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stream: mockStream })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stream: { ...mockStream, status: 'live' } })
      })

    render(<StreamSetupPage />)
    
    const goLiveButton = await screen.findByText('Go Live')
    fireEvent.click(goLiveButton)

    await waitFor(() => {
      expect(screen.getByText('LIVE')).toBeInTheDocument()
    })
  })

  it('should display live analytics when streaming', async () => {
    const mockStream = {
      id: 'stream-123',
      status: 'live',
      viewerCount: 50,
      peakViewers: 75
    }

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ stream: mockStream })
    })

    render(<StreamSetupPage />)
    
    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument() // Current viewers
      expect(screen.getByText('Peak: 75')).toBeInTheDocument()
    })
  })

  it('should show End Stream button when live', async () => {
    const mockStream = {
      id: 'stream-123',
      status: 'live'
    }

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stream: mockStream })
    })

    render(<StreamSetupPage />)
    
    await waitFor(() => {
      expect(screen.getByText('End Stream')).toBeInTheDocument()
    })
  })
})

describe('Watch Stream Page', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('should display stream is live message', async () => {
    const mockStream = {
      id: 'stream-123',
      status: 'live',
      title: 'Test Stream',
      channelName: 'test-channel'
    }

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ stream: mockStream })
    })

    render(<WatchStreamPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Stream is Live!')).toBeInTheDocument()
    })
  })

  it('should display offline message when stream is not live', async () => {
    const mockStream = {
      id: 'stream-123',
      status: 'scheduled'
    }

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ stream: mockStream })
    })

    render(<WatchStreamPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Stream Offline')).toBeInTheDocument()
    })
  })

  it('should display viewer count', async () => {
    const mockStream = {
      id: 'stream-123',
      status: 'live',
      viewerCount: 100
    }

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        stream: { ...mockStream, activeViewers: 100 }
      })
    })

    render(<WatchStreamPage />)
    
    await waitFor(() => {
      expect(screen.getByText('100 watching')).toBeInTheDocument()
    })
  })

  it('should render chat interface', async () => {
    const mockStream = {
      id: 'stream-123',
      status: 'live'
    }

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ stream: mockStream, messages: [] })
    })

    render(<WatchStreamPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Live Chat')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument()
    })
  })

  it('should display chat messages', async () => {
    const mockMessages = [
      {
        id: '1',
        userName: 'User 1',
        message: 'Hello!',
        type: 'message',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        userName: 'User 2',
        message: 'Hi there!',
        type: 'message',
        createdAt: new Date().toISOString()
      }
    ]

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ messages: mockMessages })
    })

    render(<WatchStreamPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })
  })

  it('should send chat message when Enter is pressed', async () => {
    const mockStream = {
      id: 'stream-123',
      status: 'live'
    }

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ stream: mockStream, messages: [] })
    })

    render(<WatchStreamPage />)
    
    const input = await screen.findByPlaceholderText('Type a message...')
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/features/streaming/chat',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test message')
        })
      )
    })
  })

  it('should display reaction buttons', async () => {
    const mockStream = {
      id: 'stream-123',
      status: 'live'
    }

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ stream: mockStream })
    })

    render(<WatchStreamPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Like')).toBeInTheDocument()
      expect(screen.getByText('Love')).toBeInTheDocument()
      expect(screen.getByText('Applause')).toBeInTheDocument()
    })
  })

  it('should send reaction when button is clicked', async () => {
    const mockStream = {
      id: 'stream-123',
      status: 'live'
    }

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ stream: mockStream })
    })

    render(<WatchStreamPage />)
    
    const likeButton = await screen.findByText('Like')
    fireEvent.click(likeButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/features/streaming/chat',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('👍')
        })
      )
    })
  })

  it('should auto-scroll chat to latest message', async () => {
    const mockMessages = Array.from({ length: 50 }, (_, i) => ({
      id: `${i}`,
      userName: `User ${i}`,
      message: `Message ${i}`,
      type: 'message',
      createdAt: new Date().toISOString()
    }))

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ messages: mockMessages })
    })

    const { container } = render(<WatchStreamPage />)
    
    await waitFor(() => {
      const chatContainer = container.querySelector('.overflow-y-auto')
      expect(chatContainer?.scrollTop).toBeGreaterThan(0)
    })
  })
})

describe('OBS Setup Guide', () => {
  it('should display OBS download link', async () => {
    render(<StreamSetupPage />)
    
    await waitFor(() => {
      const link = screen.getByText(/obsproject.com/i)
      expect(link).toHaveAttribute('href', expect.stringContaining('obsproject.com'))
    })
  })

  it('should show step-by-step instructions', async () => {
    render(<StreamSetupPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/Download OBS Studio/i)).toBeInTheDocument()
      expect(screen.getByText(/Configure Stream Settings/i)).toBeInTheDocument()
      expect(screen.getByText(/Add Sources/i)).toBeInTheDocument()
      expect(screen.getByText(/Start Streaming/i)).toBeInTheDocument()
    })
  })

  it('should display pro tips', async () => {
    render(<StreamSetupPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/Test your stream before going live/i)).toBeInTheDocument()
      expect(screen.getByText(/Use a wired internet connection/i)).toBeInTheDocument()
    })
  })
})

describe('Error Handling', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('should display error message when stream setup fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Setup failed' })
    })

    render(<StreamSetupPage />)
    
    const setupButton = await screen.findByText('Setup Stream')
    fireEvent.click(setupButton)

    await waitFor(() => {
      expect(screen.getByText(/Setup failed/i)).toBeInTheDocument()
    })
  })

  it('should display error when chat message fails to send', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stream: { id: '123', status: 'live' } })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to send message' })
      })

    render(<WatchStreamPage />)
    
    const input = await screen.findByPlaceholderText('Type a message...')
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.keyPress(input, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText(/Failed to send/i)).toBeInTheDocument()
    })
  })

  it('should handle network errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<StreamSetupPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument()
    })
  })
})
