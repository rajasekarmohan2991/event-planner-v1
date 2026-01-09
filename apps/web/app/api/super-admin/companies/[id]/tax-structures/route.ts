
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getTaxTemplatesForCountry } from '@/lib/tax-templates';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        let taxes = await prisma.taxStructure.findMany({
            where: { tenantId: params.id },
            orderBy: { createdAt: 'desc' }
        });

        // If no tax structures exist, auto-populate based on company country
        if (taxes.length === 0) {
            console.log('No tax structures found, auto-populating based on country...');
            
            const company = await prisma.tenant.findUnique({
                where: { id: params.id },
                select: { country: true }
            });

            if (company?.country) {
                const templates = getTaxTemplatesForCountry(company.country);
                console.log(`Creating ${templates.length} tax structures for country: ${company.country}`);

                // Create tax structures from templates
                const createdTaxes = await Promise.all(
                    templates.map(template =>
                        prisma.taxStructure.create({
                            data: {
                                name: template.name,
                                rate: template.rate,
                                description: template.description,
                                isDefault: template.isDefault,
                                tenantId: params.id
                            }
                        })
                    )
                );

                taxes = createdTaxes;
                console.log(`Successfully created ${taxes.length} tax structures`);
            }
        }

        return NextResponse.json({ taxes });
    } catch (error: any) {
        console.error('Error fetching/creating taxes:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta
        });
        return NextResponse.json({ 
            message: 'Failed to fetch taxes',
            details: error.message 
        }, { status: 500 });
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

        console.log('Creating tax structure:', { name, rate, description, isDefault, tenantId: params.id });

        // Validate required fields
        if (!name || rate === undefined || rate === null) {
            return NextResponse.json({ 
                message: 'Name and rate are required',
                details: { name, rate }
            }, { status: 400 });
        }

        // Validate rate is a valid number
        const parsedRate = parseFloat(rate);
        if (isNaN(parsedRate)) {
            return NextResponse.json({ 
                message: 'Rate must be a valid number',
                details: { rate }
            }, { status: 400 });
        }

        // If setting as default, unset others
        if (isDefault) {
            await prisma.taxStructure.updateMany({
                where: { tenantId: params.id, isDefault: true },
                data: { isDefault: false }
            });
        }

        const tax = await prisma.taxStructure.create({
            data: {
                name,
                rate: parsedRate,
                description: description || '',
                isDefault: isDefault || false,
                tenantId: params.id
            }
        });

        console.log('Tax structure created successfully:', tax);
        return NextResponse.json({ tax }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating tax structure:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });
        return NextResponse.json({ 
            message: error.message || 'Failed to create tax structure',
            details: error.meta || error.code || 'Unknown error'
        }, { status: 500 });
    }
}
