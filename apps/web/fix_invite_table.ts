
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔧 Fixing Event Team Invitations Table...')

    try {
        // 1. Check if table exists
        const check = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'event_team_invitations'
      );
    `
        console.log('Table exists check:', check)

        // 2. Create Table explicitly (simplified)
        console.log('Creating table if not exists...')
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS event_team_invitations (
          id BIGSERIAL PRIMARY KEY,
          event_id BIGINT NOT NULL,
          tenant_id TEXT,
          email TEXT NOT NULL,
          role TEXT DEFAULT 'STAFF',
          token TEXT,
          invited_by BIGINT,
          status TEXT DEFAULT 'PENDING',
          expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(event_id, email)
      );
    `)
        console.log('✅ Table creation command executed.')

        // 3. Create Indexes
        await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_event_team_invitations_event ON event_team_invitations(event_id);
    `)
        await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_event_team_invitations_token ON event_team_invitations(token);
    `)
        console.log('✅ Indexes created.')

        // 4. Verify count for event 41
        const count = await prisma.$queryRaw`
      SELECT count(*) as count FROM event_team_invitations WHERE event_id = 41
    `
        console.log('Current invites for event 41:', count)

    } catch (e) {
        console.error('❌ Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
