import { NextRequest, NextResponse } from 'next/server';
import { isEmailAvailable, isValidEmailFormat } from '@/lib/email-validation';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                {
                    available: false,
                    error: 'Email is required'
                },
                { status: 400 }
            );
        }

        // Validate format
        if (!isValidEmailFormat(email)) {
            return NextResponse.json({
                available: false,
                error: 'Invalid email format'
            });
        }

        // Check availability
        const result = await isEmailAvailable(email);

        return NextResponse.json({
            available: result.available,
            usedBy: result.usedBy,
            message: result.message
        });
    } catch (error) {
        console.error('Error validating email:', error);
        return NextResponse.json(
            { error: 'Failed to validate email' },
            { status: 500 }
        );
    }
}
