
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const taxes = await prisma.taxStructure.findMany({
            where: { tenantId: params.id },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ taxes });
    } catch (error: any) {
        console.error('Error fetching taxes:', error);
        return NextResponse.json({ message: 'Failed to fetch taxes' }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { name, rate, description, isDefault } = body;

        // If setting as default, unset others?
        if (isDefault) {
            await prisma.taxStructure.updateMany({
                where: { tenantId: params.id, isDefault: true },
                data: { isDefault: false }
            });
        }

        const tax = await prisma.taxStructure.create({
            data: {
                name,
                rate: parseFloat(rate),
                description,
                isDefault: isDefault || false,
                tenantId: params.id
            }
        });

        return NextResponse.json({ tax }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating tax:', error);
        return NextResponse.json({ message: error.message || 'Failed to create tax structure' }, { status: 500 });
    }
}
