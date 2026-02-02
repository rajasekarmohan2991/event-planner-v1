# Live Streaming Feature Module

## Overview
Standalone live streaming module for Event Planner application. Enables organizers to broadcast sessions live and attendees to watch with real-time chat.

## Features
- RTMP streaming support (OBS, Streamyard, etc.)
- Browser-based streaming
- Real-time viewer analytics
- Live chat and reactions
- Automatic recording
- Access control (ticket-based)

## Tech Stack
- Agora.io for streaming infrastructure
- WebSocket for real-time chat
- Next.js API routes
- PostgreSQL for data storage

## Installation
1. Sign up for Agora.io account
2. Add credentials to environment variables
3. Run database migrations
4. Enable feature flag

## Environment Variables
```
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate
NEXT_PUBLIC_AGORA_APP_ID=your_app_id
```

## Database Tables
- live_streams
- stream_viewers
- stream_chat
- stream_analytics

## API Endpoints
- POST /api/features/streaming/setup
- GET /api/features/streaming/token
- POST /api/features/streaming/chat
- GET /api/features/streaming/analytics

## Usage
1. Organizer enables streaming for a session
2. System generates RTMP credentials
3. Organizer connects streaming software
4. Attendees watch via web player
5. Real-time chat and analytics
