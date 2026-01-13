
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string; taxId: string }> | { id: string; taxId: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { name, rate, description, isDefault, globalTemplateId, isCustom } = body;

        // Handle isDefault logic: update others to false
        if (isDefault) {
            await prisma.taxStructure.updateMany({
                where: { tenantId: params.id, isDefault: true, id: { not: params.taxId } },
                data: { isDefault: false }
            });
        }

        // If using a global template, verify it exists
        if (globalTemplateId) {
            const template = await prisma.globalTaxTemplate.findUnique({
                where: { id: globalTemplateId }
            });
            if (!template) {
                return NextResponse.json({
                    message: 'Global tax template not found',
                    details: { globalTemplateId }
                }, { status: 400 });
            }
        }

        const tax = await prisma.taxStructure.update({
            where: { id: params.taxId },
            data: {
                name,
                rate: parseFloat(rate),
                description,
                isDefault: isDefault || false,
                globalTemplateId: globalTemplateId || null,
                isCustom: isCustom === true || !globalTemplateId
            },
            include: {
                globalTemplate: true
            }
        });

        return NextResponse.json({ tax });
    } catch (error: any) {
        console.error('Update tax error:', error);
        return NextResponse.json({ message: 'Failed to update tax' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string; taxId: string }> | { id: string; taxId: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        await prisma.taxStructure.delete({
            where: { id: params.taxId }
        });
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error: any) {
        console.error('Delete tax error:', error);
        return NextResponse.json({ message: 'Failed to delete tax' }, { status: 500 });
    }
}
