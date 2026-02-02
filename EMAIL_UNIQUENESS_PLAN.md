# Email Uniqueness Implementation Plan

## USER REQUIREMENT
"Company should be created using unique email id and same email id cannot be used for individuals as well as company"

## CURRENT STATE

### User Model (line 81):
```prisma
email  String  @unique
```
✅ Already has unique constraint

### Tenant Model (line 151):
```prisma
billingEmail  String?
```
❌ Optional, not unique, not enforced

## PROBLEM
- Same email can be used for both User and Tenant
- No validation prevents email duplication across tables
- billingEmail is optional and not unique

## SOLUTION

### 1. Database Schema Changes

#### Add unique email to Tenant:
```prisma
model Tenant {
  // ... existing fields
  email           String          @unique  // NEW: Required unique email
  billingEmail    String?                  // Keep for backward compatibility
  // ... rest of fields
}
```

#### Create EmailRegistry for global uniqueness:
```prisma
model EmailRegistry {
  id          String   @id @default(cuid())
  email       String   @unique
  entityType  String   // 'USER' or 'TENANT'
  entityId    String   // userId or tenantId
  createdAt   DateTime @default(now())
  
  @@index([entityType, entityId])
  @@map("email_registry")
}
```

### 2. API Validation

#### Company Creation Endpoint:
```typescript
POST /api/super-admin/companies

Validation:
1. Check if email exists in User table
2. Check if email exists in Tenant table
3. Check if email exists in EmailRegistry
4. If any match found → Return error
5. If unique → Create tenant + Add to EmailRegistry
```

#### User Registration:
```typescript
POST /api/auth/signup

Validation:
1. Check if email exists in User table
2. Check if email exists in Tenant table
3. Check if email exists in EmailRegistry
4. If any match found → Return error
5. If unique → Create user + Add to EmailRegistry
```

### 3. Migration Steps

#### Step 1: Create EmailRegistry table
```sql
CREATE TABLE email_registry (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Step 2: Populate existing data
```typescript
// Migrate existing users
await prisma.emailRegistry.createMany({
  data: users.map(u => ({
    email: u.email,
    entityType: 'USER',
    entityId: u.id
  }))
});

// Migrate existing tenants
await prisma.emailRegistry.createMany({
  data: tenants.filter(t => t.billingEmail).map(t => ({
    email: t.billingEmail,
    entityType: 'TENANT',
    entityId: t.id
  }))
});
```

#### Step 3: Add email field to Tenant
```prisma
// Make billingEmail the primary email
// Add migration to copy billingEmail → email
```

### 4. Validation Helper Function

```typescript
async function isEmailAvailable(email: string): Promise<{
  available: boolean;
  usedBy?: 'USER' | 'TENANT';
  message?: string;
}> {
  // Check User table
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    return {
      available: false,
      usedBy: 'USER',
      message: 'Email already registered to a user account'
    };
  }

  // Check Tenant table
  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { email },
        { billingEmail: email }
      ]
    }
  });
  if (tenant) {
    return {
      available: false,
      usedBy: 'TENANT',
      message: 'Email already registered to a company'
    };
  }

  // Check EmailRegistry (redundant but safe)
  const registry = await prisma.emailRegistry.findUnique({
    where: { email }
  });
  if (registry) {
    return {
      available: false,
      usedBy: registry.entityType as 'USER' | 'TENANT',
      message: `Email already in use by ${registry.entityType.toLowerCase()}`
    };
  }

  return { available: true };
}
```

### 5. Implementation Files

#### Create validation utility:
- `/lib/email-validation.ts`

#### Update API routes:
- `/api/super-admin/companies/route.ts` (create company)
- `/api/auth/signup/route.ts` (user registration)
- `/api/admin/team/invite/route.ts` (team invitations)

#### Update Prisma schema:
- Add EmailRegistry model
- Add email field to Tenant
- Create migration

### 6. Error Messages

```typescript
const ERROR_MESSAGES = {
  EMAIL_USED_BY_USER: 'This email is already registered to a user account. Please use a different email.',
  EMAIL_USED_BY_COMPANY: 'This email is already registered to a company. Please use a different email.',
  EMAIL_INVALID: 'Please provide a valid email address.',
  EMAIL_REQUIRED: 'Email is required for company registration.'
};
```

### 7. Frontend Validation

#### Company Creation Form:
```typescript
const validateEmail = async (email: string) => {
  const res = await fetch('/api/validate-email', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  
  if (!data.available) {
    setError(`Email already in use by ${data.usedBy}`);
    return false;
  }
  return true;
};
```

## BENEFITS

1. ✅ **Global Email Uniqueness** - No duplicates across system
2. ✅ **Clear Error Messages** - Users know why email is rejected
3. ✅ **Data Integrity** - EmailRegistry as source of truth
4. ✅ **Easy Validation** - Single function checks all tables
5. ✅ **Audit Trail** - Track which entity owns which email

## TESTING

### Test Cases:
1. ✅ Create user with email → Create company with same email → Should fail
2. ✅ Create company with email → Create user with same email → Should fail
3. ✅ Create user with email1 → Create company with email2 → Should succeed
4. ✅ Update company email to existing user email → Should fail
5. ✅ Delete user → Email should be released for reuse

## ROLLOUT PLAN

### Phase 1: Add EmailRegistry (Non-breaking)
- Create EmailRegistry table
- Populate with existing data
- Add validation helper

### Phase 2: Update APIs (Validation only)
- Add email checks to company creation
- Add email checks to user registration
- Return clear error messages

### Phase 3: Schema Update (Breaking)
- Add required email to Tenant
- Migrate billingEmail → email
- Update all company creation flows

### Phase 4: Cleanup
- Remove redundant billingEmail checks
- Update documentation
- Add admin tools for email management

## IMMEDIATE ACTION

For quick implementation without schema changes:

```typescript
// Add to company creation API
const emailCheck = await prisma.user.findUnique({
  where: { email: companyEmail }
});

if (emailCheck) {
  return NextResponse.json(
    { error: 'Email already registered to a user account' },
    { status: 400 }
  );
}

const tenantCheck = await prisma.tenant.findFirst({
  where: { billingEmail: companyEmail }
});

if (tenantCheck) {
  return NextResponse.json(
    { error: 'Email already registered to another company' },
    { status: 400 }
  );
}
```

## STATUS
- [ ] EmailRegistry model created
- [ ] Validation helper implemented
- [ ] Company creation API updated
- [ ] User registration API updated
- [ ] Frontend validation added
- [ ] Migration script created
- [ ] Testing completed
- [ ] Documentation updated
