# ADR 0002: Backend Decision — Choose Spring Boot (Java)

Status: Accepted
Date: 2025-09-16
Supersedes: ADR 0001 recommendation (NestJS)
Deciders: Product, Engineering

## Context
We evaluated Spring Boot vs Node.js/NestJS for the backend. The platform requires:
- Real-time engagement (chat, Q&A, live polling)
- High-throughput on-site check-in with offline sync
- Payments (Stripe/Razorpay), webhooks, idempotency
- REST APIs (and GraphQL optional later), WebSockets, background jobs
- Multi-tenant RBAC, audit logging, security hardening
- Relational core (PostgreSQL), document storage (MongoDB), caching/queues (Redis)
- Enterprise-grade observability and reliability

The team prefers Java with Spring Boot.

## Decision
Adopt Java with Spring Boot as the primary backend framework for MVP and beyond.

## Rationale
- Strong enterprise ecosystem and stability; excellent fit for complex workflows
- Mature security (Spring Security, OAuth2), observability (Micrometer/Actuator)
- Rich support for relational + document databases and messaging
- Team expertise and preference in Java, improving long-term maintainability

## Consequences
- Monorepo will be polyglot (JS/TS for web/mobile; Java for backend)
- Use OpenAPI contract-first to generate clients for TS (web/mobile)
- Real-time via Spring WebSocket/STOMP or Server-Sent Events; evaluate RSocket if needed
- Background processing via Spring Boot workers (scheduling) and/or Redis Streams/Kafka for queues

## Implementation Plan
- Create `apps/api-java` Spring Boot project (Java 21, Gradle or Maven)
- Dependencies (initial):
  - spring-boot-starter-web
  - spring-boot-starter-security, spring-boot-starter-oauth2-client, oauth2-resource-server (JWT)
  - spring-boot-starter-data-jpa, postgresql, flyway-core
  - spring-boot-starter-data-mongodb (or MongoDB driver) if needed for chat/engagement
  - spring-boot-starter-data-redis (cache, rate-limit, tokens); Redisson optional
  - spring-boot-starter-websocket (STOMP) or spring-boot-starter for SSE
  - springdoc-openapi-starter-webmvc-ui (OpenAPI/Swagger)
  - micrometer-registry-prometheus, spring-boot-starter-actuator (metrics/health)
  - mapstruct, lombok (DX) [optional]
  - resilience4j-spring-boot2 (resilience) [optional]
- Modules v1:
  - Auth & RBAC: OAuth login, JWT issuance, roles/permissions, audit log
  - Events: CRUD, branding, settings, microsite config
  - Tickets & Orders: ticket types, capacity, promo codes, payment intents (Stripe/Razorpay), webhooks
  - Check-in: QR generation, validation endpoints, offline sync support
  - Tasks: assignments, deadlines, status
  - Budget: categories, planned vs actual, vendors linkage
- Platform
  - OpenAPI spec in `packages/contracts/openapi.yaml`; generate TS clients for web/mobile
  - Observability: Actuator endpoints, Prometheus metrics, structured JSON logs
  - CI: build, tests, Docker image, SBOM; deploy to container platform (ECS/K8s)

## Migration from ADR 0001
- Keep ADR 0001 for historical context; ADR 0002 is the active decision.
- Architecture and repo docs updated to reflect Spring Boot.
