import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { docuSignClient } from '@/lib/docusign';

export const dynamic = 'force-dynamic';

// GET /api/signatures/test-docusign - Test DocuSign connection
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 });
    }

    const results: any = {
        timestamp: new Date().toISOString(),
        configured: false,
        connection: 'not_tested',
        details: {}
    };

    try {
        // Check if environment variables are configured
        const envVars = {
            DOCUSIGN_INTEGRATION_KEY: !!process.env.DOCUSIGN_INTEGRATION_KEY,
            DOCUSIGN_SECRET_KEY: !!process.env.DOCUSIGN_SECRET_KEY,
            DOCUSIGN_ACCOUNT_ID: !!process.env.DOCUSIGN_ACCOUNT_ID,
            DOCUSIGN_BASE_PATH: process.env.DOCUSIGN_BASE_PATH || 'not set',
            DOCUSIGN_OAUTH_BASE_PATH: process.env.DOCUSIGN_OAUTH_BASE_PATH || 'not set'
        };

        results.details.environment = envVars;

        // Check if all required vars are present
        if (
            process.env.DOCUSIGN_INTEGRATION_KEY &&
            process.env.DOCUSIGN_SECRET_KEY &&
            process.env.DOCUSIGN_ACCOUNT_ID
        ) {
            results.configured = true;

            // Try to get access token
            try {
                const accessToken = await docuSignClient.getAccessToken();
                results.connection = 'success';
                results.details.accessToken = {
                    obtained: true,
                    length: accessToken.length,
                    preview: accessToken.substring(0, 20) + '...'
                };
                results.message = '✅ DocuSign is properly configured and connected!';
            } catch (error: any) {
                results.connection = 'failed';
                results.details.error = {
                    message: error.message,
                    type: error.constructor.name
                };
                results.message = '❌ DocuSign credentials are configured but connection failed. Check your Integration Key and Secret Key.';
            }
        } else {
            results.message = '⚠️ DocuSign is not configured. Add environment variables to enable DocuSign integration. The system will use simple canvas signatures instead.';
            results.details.missing = [];
            
            if (!process.env.DOCUSIGN_INTEGRATION_KEY) results.details.missing.push('DOCUSIGN_INTEGRATION_KEY');
            if (!process.env.DOCUSIGN_SECRET_KEY) results.details.missing.push('DOCUSIGN_SECRET_KEY');
            if (!process.env.DOCUSIGN_ACCOUNT_ID) results.details.missing.push('DOCUSIGN_ACCOUNT_ID');
        }

        return NextResponse.json(results);
    } catch (error: any) {
        return NextResponse.json({
            ...results,
            connection: 'error',
            message: '❌ Error testing DocuSign connection',
            error: error.message
        }, { status: 500 });
    }
}
