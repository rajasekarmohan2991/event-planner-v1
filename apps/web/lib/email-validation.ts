import prisma from './prisma';

export interface EmailAvailabilityResult {
    available: boolean;
    usedBy?: 'USER' | 'TENANT';
    message?: string;
    entityId?: string;
}

/**
 * Check if an email is available for use across the entire system
 * Checks both User and Tenant tables to ensure global uniqueness
 */
export async function isEmailAvailable(email: string): Promise<EmailAvailabilityResult> {
    if (!email || !email.trim()) {
        return {
            available: false,
            message: 'Email is required'
        };
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check User table
    const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true }
    });

    if (user) {
        return {
            available: false,
            usedBy: 'USER',
            message: 'This email is already registered to a user account. Please use a different email.',
            entityId: user.id.toString()
        };
    }

    // Check Tenant table (billingEmail)
    const tenant = await prisma.tenant.findFirst({
        where: {
            billingEmail: normalizedEmail
        },
        select: { id: true, name: true }
    });

    if (tenant) {
        return {
            available: false,
            usedBy: 'TENANT',
            message: 'This email is already registered to a company. Please use a different email.',
            entityId: tenant.id
        };
    }

    return {
        available: true,
        message: 'Email is available'
    };
}

/**
 * Validate email format
 */
export function isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Comprehensive email validation for company/tenant creation
 */
export async function validateCompanyEmail(email: string): Promise<{
    valid: boolean;
    error?: string;
}> {
    // Check format
    if (!isValidEmailFormat(email)) {
        return {
            valid: false,
            error: 'Please provide a valid email address'
        };
    }

    // Check availability
    const availability = await isEmailAvailable(email);

    if (!availability.available) {
        return {
            valid: false,
            error: availability.message
        };
    }

    return { valid: true };
}

/**
 * Comprehensive email validation for user registration
 */
export async function validateUserEmail(email: string): Promise<{
    valid: boolean;
    error?: string;
}> {
    // Check format
    if (!isValidEmailFormat(email)) {
        return {
            valid: false,
            error: 'Please provide a valid email address'
        };
    }

    // Check availability
    const availability = await isEmailAvailable(email);

    if (!availability.available) {
        return {
            valid: false,
            error: availability.message
        };
    }

    return { valid: true };
}
