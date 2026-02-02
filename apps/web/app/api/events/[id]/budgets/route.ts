import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import { getTenantId } from '@/lib/tenant-context'
export const dynamic = 'force-dynamic'

// GET - List all budgets for an event
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    try {
        const budgets = await prisma.eventBudget.findMany({
            where: { eventId: params.id },
            orderBy: { category: 'asc' }
        })

        // Calculate totals
        const totals = budgets.reduce((acc, budget) => ({
            budgeted: acc.budgeted + Number(budget.budgeted),
            spent: acc.spent + Number(budget.spent),
            remaining: acc.remaining + Number(budget.remaining)
        }), { budgeted: 0, spent: 0, remaining: 0 })

        return NextResponse.json({ budgets, totals })
    } catch (error: any) {
        console.error('Get budgets error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST - Create new budget category
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const permError = await checkPermissionInRoute('events.manage_budget', 'Create Budget')
    if (permError) return permError

    try {
        const body = await req.json()
        const { category, description, budgeted, notes } = body
        const tenantId = getTenantId()

        if (!category || !budgeted) {
            return NextResponse.json({ message: 'Category and budgeted amount required' }, { status: 400 })
        }

        const budget = await prisma.eventBudget.create({
            data: {
                eventId: params.id,
                category,
                description,
                budgeted: Number(budgeted),
                spent: 0,
                remaining: Number(budgeted),
                status: 'ACTIVE',
                notes,
                tenantId
            }
        })

        return NextResponse.json({ message: 'Budget created', budget }, { status: 201 })
    } catch (error: any) {
        console.error('Create budget error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH - Update budget (spent amount)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const permError = await checkPermissionInRoute('events.manage_budget', 'Update Budget')
    if (permError) return permError

    try {
        const body = await req.json()
        const { budgetId, spent, budgeted, description, notes } = body

        if (!budgetId) {
            return NextResponse.json({ message: 'Budget ID required' }, { status: 400 })
        }

        const current = await prisma.eventBudget.findUnique({
            where: { id: budgetId }
        })

        if (!current) {
            return NextResponse.json({ message: 'Budget not found' }, { status: 404 })
        }

        const newBudgeted = budgeted !== undefined ? Number(budgeted) : Number(current.budgeted)
        const newSpent = spent !== undefined ? Number(spent) : Number(current.spent)
        const newRemaining = newBudgeted - newSpent
        const newStatus = newRemaining < 0 ? 'EXCEEDED' : newRemaining === 0 ? 'COMPLETED' : 'ACTIVE'

        const updated = await prisma.eventBudget.update({
            where: { id: budgetId },
            data: {
                ...(budgeted !== undefined && { budgeted: newBudgeted }),
                ...(spent !== undefined && { spent: newSpent }),
                remaining: newRemaining,
                status: newStatus,
                ...(description !== undefined && { description }),
                ...(notes !== undefined && { notes })
            }
        })

        return NextResponse.json({ message: 'Budget updated', budget: updated })
    } catch (error: any) {
        console.error('Update budget error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE - Delete budget category
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const permError = await checkPermissionInRoute('events.manage_budget', 'Delete Budget')
    if (permError) return permError

    try {
        const { searchParams } = new URL(req.url)
        const budgetId = searchParams.get('budgetId')

        if (!budgetId) {
            return NextResponse.json({ message: 'Budget ID required' }, { status: 400 })
        }

        await prisma.eventBudget.delete({
            where: { id: budgetId }
        })

        return NextResponse.json({ message: 'Budget deleted' })
    } catch (error: any) {
        console.error('Delete budget error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
