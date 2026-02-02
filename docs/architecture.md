# System Architecture (High-Level)

Last updated: 2025-09-16

## Overview
A modular, service-oriented architecture optimized for MVP velocity and future scale. Core is a NestJS API with PostgreSQL, complemented by real-time services and workers. Monorepo to share types and components across web, mobile, and backend.

```mermaid
flowchart LR
  subgraph Client
    W[Web (Next.js)]
    M[Mobile (React Native)]
    A[Admin (Next.js)]
  end

  subgraph Backend
    API[NestJS API (REST/GraphQL)]
    RT[Realtime Gateway (WebSockets)]
    JOB[Workers / Queues]
  end

  DB[(PostgreSQL)]
  MG[(MongoDB)]
  RD[(Redis)]
  S3[(S3/Cloudinary)]
  PMT[(Stripe/Razorpay)]
  MAP[Google Maps/Mapbox]
  NOTIF[FCM/APNs/Email]
  VID[WebRTC/Zoom/Teams]

  W -->|HTTPS| API
  M -->|HTTPS| API
  A -->|HTTPS| API

  W <-->|WS| RT
  M <-->|WS| RT

  API --> DB
  API --> MG
  API --> RD
  API --> S3
  API --> PMT
  API --> MAP
  API --> NOTIF
  API --> VID
  JOB --> DB
  JOB --> MG
  JOB --> RD
  API <-->|Queue| JOB
```

## Services
- API Gateway (NestJS): REST/GraphQL, auth, RBAC, business logic
- Realtime Gateway: WebSockets for chat, Q&A, live notifications
- Workers: background jobs (emails, ticket generation, QR creation, webhooks)
- File service: uploads to S3/Cloudinary, signed URLs
- Payments service: Stripe/Razorpay integration, webhooks, idempotency

## Data Storage
- PostgreSQL: core entities (events, users, tickets, orders, tasks, budgets)
- MongoDB: chat messages, session notes, engagement payloads
- Redis: cache, sessions, rate limits, queues (BullMQ)
- Object Storage: S3/Cloudinary for media and badges

## Security
- OAuth2/OIDC for SSO; JWT for API with refresh tokens
- Row-level access via RBAC roles and permission guards
- Audit logs of sensitive operations
- Encryption in transit (TLS) and at rest (KMS-managed keys)

## Observability
- Logging: pino/JSON logs with correlation IDs
- Metrics: Prometheus/OpenTelemetry exporters
- Tracing: OpenTelemetry (OTLP) to collector/Jaeger/Tempo
- Dashboards/Alerts: Grafana

## Scalability
- Horizontal scaling for API, RT, and JOB via containers (K8s or ECS/Fargate)
- CDN for microsites and static assets
- Feature flags and gradual rollouts

## Tenancy Strategy (v1)
- Row-based tenancy with `org_id`/`event_id` scoping in queries and guards
- Evaluate schema-per-tenant for large enterprise later

## Key Flows
- Registration & Ticketing: API creates order, payment intent, confirms webhook, issues QR, emails ticket
- Check-in (Online/Offline): Device stores encrypted ticket cache, validates QR, syncs to API when online
- Engagement: WebSocket rooms per event/session; messages persisted to MongoDB, summarized to analytics

## Diagrams to Add (next)
- Sequence: Ticket purchase
- Sequence: On-site check-in offline sync
- Component: RBAC and permissions enforcement
