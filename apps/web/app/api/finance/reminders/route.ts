import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendInvoiceReminders } from '@/lib/email-notifications';

export const dynamic = 'force-dynamic';

// POST /api/finance/reminders - Trigger invoice reminder emails
// Can be called by cron job or manually by admin
export async function POST(req: NextRequest) {
    try {
        // Check for cron secret or admin session
        const cronSecret = req.headers.get('x-cron-secret');
        const isValidCron = cronSecret === process.env.CRON_SECRET;

        if (!isValidCron) {
            const session = await getServerSession(authOptions as any);
            if (!session?.user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            // Check if user is admin
            const user = session.user as any;
            if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
                return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
            }
        }

        console.log('📧 Triggering invoice reminders...');
        
        const result = await sendInvoiceReminders();

        return NextResponse.json({
            success: true,
            message: 'Invoice reminders processed',
            sent: result.sent,
            errors: result.errors,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error processing invoice reminders:', error);
        return NextResponse.json({ 
            error: 'Failed to process reminders',
            details: error.message 
        }, { status: 500 });
    }
}

// GET /api/finance/reminders - Get reminder status/stats
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Return info about reminder configuration
        return NextResponse.json({
            configured: {
                emailProvider: process.env.EMAIL_PROVIDER || 'none',
                cronSecret: !!process.env.CRON_SECRET
            },
            schedule: {
                description: 'Invoice reminders can be triggered via POST request',
                cronEndpoint: '/api/finance/reminders',
                recommendedSchedule: 'Daily at 9:00 AM'
            },
            templates: [
                'INVOICE_REMINDER - Sent 3 days before due date',
                'INVOICE_OVERDUE - Sent when invoice is past due'
            ]
        });
    } catch (error: any) {
        return NextResponse.json({ 
            error: 'Failed to get reminder info',
            details: error.message 
        }, { status: 500 });
    }
}
