# Epic 1: Authentication & Role Management

## Technical Implementation Guide

### 1. Dependencies
```bash
# Core
npm install next-auth @auth/prisma-adapter @prisma/client bcryptjs

# Types
npm install -D @types/bcryptjs

# Email (for verification/password reset)
npm install nodemailer
```

### 2. Database Schema (Prisma)
```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  ORGANIZER
  USER
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model User {
  id             String    @id @default(cuid())
  name           String?
  email          String    @unique
  emailVerified  DateTime? @map("email_verified")
  password       String?   @db.Text
  role           UserRole  @default(USER)
  image          String?
  accounts       Account[]
  sessions       Session[]
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@map("users")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### 3. File Structure
```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── forgot-password/
│   │       └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   └── (protected)/
│       ├── admin/
│       │   └── page.tsx
│       ├── organizer/
│       │   └── page.tsx
│       └── user/
│           └── page.tsx
├── components/
│   └── auth/
│       ├── LoginForm.tsx
│       ├── RegisterForm.tsx
│       └── ForgotPasswordForm.tsx
└── lib/
    ├── auth.ts
    └── prisma.ts
```

### 4. Implementation Steps

1. **Setup Prisma**
   - Initialize Prisma
   - Set up database connection
   - Run initial migration

2. **Configure NextAuth**
   - Create auth configuration
   - Set up JWT strategy
   - Configure providers (Credentials, Google, etc.)

3. **Create Auth Pages**
   - Login with email/password
   - Registration form
   - Forgot password flow
   - Email verification

4. **Role-Based Access Control**
   - Middleware for route protection
   - Role-based redirects
   - Protected API routes

5. **Email Service**
   - Setup Nodemailer
   - Email templates
   - Verification emails
   - Password reset emails

### 5. Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/eventplanner"

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Email (for development)
EMAIL_SERVER=smtp://user:pass@smtp.example.com:587
EMAIL_FROM=noreply@yourapp.com

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### 6. Testing
- [ ] Unit tests for auth functions
- [ ] E2E tests for auth flows
- [ ] Role-based access tests
- [ ] Password reset flow test

### 7. Documentation
- [ ] API documentation
- [ ] Setup instructions
- [ ] Troubleshooting guide
