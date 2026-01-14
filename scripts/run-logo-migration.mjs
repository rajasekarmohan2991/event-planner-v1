// Script to add logo column to tenants table
// Run with: cd apps/web && node ../../scripts/run-logo-migration.mjs

import prisma from '../apps/web/lib/prisma.ts';

async function main() {
    console.log('🔧 Adding logo column to tenants table...');

    try {
        // Add logo column
        await prisma.$executeRawUnsafe(`
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo TEXT;
    `);

        console.log('✅ Logo column added successfully!');

        // Verify it was added
        const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' AND column_name = 'logo';
    `;

        if (result.length > 0) {
            console.log('✅ Verification successful - logo column exists');
            console.log('   Column details:', result[0]);
        } else {
            console.log('⚠️  Warning: Could not verify column (but it might still exist)');
        }

    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('✅ Logo column already exists - no action needed');
        } else {
            console.error('❌ Error:', error.message);
            throw error;
        }
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });
