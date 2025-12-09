# Repository Structure Proposal (Monorepo)

We will use a JavaScript/TypeScript monorepo (Turborepo or Nx). This enables shared types, UI, and tooling across web, mobile, and backend.

```
repo-root/
├─ apps/
│  ├─ web/                # Next.js (public microsites + organizer portal)
│  ├─ admin/              # Admin/Backoffice (optional separate Next.js)
│  ├─ mobile/             # React Native app
│  └─ api/                # NestJS backend
│
├─ packages/
│  ├─ ui/                 # Shared React UI components (web)
│  ├─ shared/             # Shared domain models, DTOs, validation
│  ├─ config/             # ESLint, prettier, tsconfig, jest presets
│  └─ utils/              # Cross-cutting utilities
│
├─ infra/
│  ├─ k8s/                # Manifests/helm or
│  ├─ terraform/          # Cloud infra (VPC, RDS, Redis, S3, etc.)
│  └─ github/             # CI/CD workflows
│
├─ docs/                  # Requirements, ADRs, architecture
│
├─ .github/workflows/     # CI/CD pipelines (lint, test, build, deploy)
├─ package.json           # Workspace root, scripts
├─ turbo.json             # If using Turborepo
├─ tsconfig.base.json
├─ .editorconfig
├─ .nvmrc                 # Node version pin
└─ README.md
```

## Tooling
- Package manager: `pnpm` (preferred) or `yarn` workspaces
- Build system: Turborepo (or Nx)
- Linting/Formatting: ESLint, Prettier
- Testing: Jest, React Testing Library, Supertest
- Type Checking: TypeScript strict mode
- Commit hooks: Husky + lint-staged
- Conventional commits + Changesets for versioning

## Scripts (root `package.json`)
- `dev`: run web, api, mobile in parallel
- `build`: build all
- `lint`, `test`, `typecheck`
- `deploy:*`: per-app deployment scripts

## Environment Management
- `.env` per app with `.env.example`
- Secrets via GitHub Actions OIDC + cloud secret manager in prod

## Next Steps
- Initialize monorepo with Turborepo
- Scaffold `apps/api` (NestJS), `apps/web` (Next.js), `apps/mobile` (Expo)
- Create `packages/shared` for DTOs/types and `packages/ui` for web components
- Set up CI workflows (lint/test/build) and preview deployments
