#!/bin/bash

# Test event creation API
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=test" \
  -d '{
    "name": "Test Event",
    "venue": "Test Venue",
    "city": "Mumbai",
    "startsAt": "2025-12-01T10:00:00Z",
    "endsAt": "2025-12-01T18:00:00Z",
    "description": "Test event description",
    "category": "CONFERENCE",
    "eventMode": "IN_PERSON"
  }' \
  -v
