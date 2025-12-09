# ADR 0001: Backend Stack Choice — Node.js (NestJS) vs Spring Boot

Status: Proposed
Date: 2025-09-16
Deciders: Product, Engineering

## Context
The platform requires:
- Real-time engagement (chat, Q&A, live polling)
- High-throughput check-in during spikes
- Payments (Stripe/Razorpay)
- REST/GraphQL APIs, WebSockets, background jobs
- Multi-tenant events, RBAC, audits
- Mix of relational (PostgreSQL) and document/time-series (MongoDB/Redis) data
- Shared models/types across web (Next.js) and mobile (React Native)

## Options

### Option A: Spring Boot (Java/Kotlin)
Pros:
- Enterprise-grade ecosystem, mature tooling
- Strong type safety, performance, stability
- Excellent observability (Micrometer), security (Spring Security)
- Battle-tested for complex domain-driven design
Cons:
- Polyglot stack split from JS/TS frontend/mobile
- Higher ramp-up for rapid iteration, verbose ceremony
- Real-time features need extra libs (SockJS/Stomp) and are less idiomatic

Best for: Large enterprises with strong Java teams, complex compliance needs from day 1.

### Option B: Node.js with NestJS (TypeScript)
Pros:
- Single language (TypeScript) across web, mobile, backend
- NestJS provides structure (DI, modules) comparable to Spring
- Strong community for real-time (Socket.IO, ws), queues (BullMQ), GraphQL
- Faster iteration for MVPs, rich npm ecosystem
Cons:
- Requires discipline for performance/observability
- Long-running CPU-bound tasks need offloading (workers) or separate services

Best for: Product-focused teams optimizing for speed, shared types and developer velocity.

## Decision (Recommended)
Choose Node.js with NestJS (TypeScript) for MVP and early growth.

Rationale:
- Type sharing between `apps/web`, `apps/mobile`, and `apps/api`
- Faster delivery of engagement features and real-time ops
- Great fit for serverless or containerized deployments
- Allows later polyglot microservices (e.g., streaming service in Go, analytics batch in Java) without lock-in

## Consequences
- Adopt opinionated patterns: Nest modules, DTOs, guards, interceptors
- Use PostgreSQL (relational core) via Prisma or TypeORM; MongoDB for chat/session docs; Redis for cache/queues/rate limits
- Standardize on OpenAPI/Swagger for contracts; zod/io-ts for runtime validation if needed
- Establish strong observability early (OpenTelemetry, pino, Prometheus exporters)

## Implementation Plan
- Scaffold `apps/api` with NestJS
- Libraries:
  - ORM: Prisma (preferred for DX) or TypeORM (decorator parity with Nest)
  - Auth: `@nestjs/passport`, `passport-jwt`, OAuth via `passport-google-oauth20` etc.
  - Realtime: `@nestjs/websockets` + `socket.io`
  - Queues/Jobs: `bullmq` with Redis
  - Payments: Stripe + Razorpay SDKs
  - Storage: AWS SDK v3 or `aws-sdk` for S3; Cloudinary SDK
  - Validation: `class-validator`, `class-transformer`
- Environments: `.env` per app; secrets via SSM/Vault in prod

## Open Questions
- Prisma vs TypeORM preference?
- Redis provider (Elasticache vs self-managed)?
- Multi-tenant strategy: schema-per-tenant vs row-based tenancy?
