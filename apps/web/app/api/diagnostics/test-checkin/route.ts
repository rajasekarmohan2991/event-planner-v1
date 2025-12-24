
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { POST as checkInPost } from '../../events/[id]/checkin-simple/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    try {
        // 1. Find an event to test with
        const event = await prisma.event.findFirst();
        if (!event) {
            return NextResponse.json({ message: 'No events found in database to test check-in' });
        }

        console.log(`🧪 Testing check-in for event ${event.id}`);

        // 2. Create a dummy registration
        const reg = await prisma.registration.create({
            data: {
                eventId: event.id,
                status: 'APPROVED',
                email: 'test-checkin-runner@example.com',
                dataJson: JSON.stringify({ name: 'Test Runner' })
            }
        });

        console.log(`👤 Created test registration ${reg.id}`);

        // 3. Construct check-in request payload
        // Token with registrationId and eventId
        const tokenPayload = {
            registrationId: reg.id,
            eventId: event.id.toString()
        };
        const token = JSON.stringify(tokenPayload);

        // 4. Simulate Check-in Pass 1 (Should Succeed)
        const req1 = new NextRequest('http://localhost/api/checkin', {
            method: 'POST',
            body: JSON.stringify({ token })
        });

        // We mock the params that Next.js would pass
        const res1 = await checkInPost(req1, { params: { id: event.id.toString() } });
        const data1 = await res1.json();

        // 5. Simulate Check-in Pass 2 (Should Fail as Duplicate)
        const req2 = new NextRequest('http://localhost/api/checkin', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
        const res2 = await checkInPost(req2, { params: { id: event.id.toString() } });
        const data2 = await res2.json();

        // 6. Cleanup
        await prisma.registration.delete({ where: { id: reg.id } });
        console.log(`🧹 Cleaned up registration ${reg.id}`);

        const passed = res1.status === 200 && res2.status === 400 && data2.already === true;

        return NextResponse.json({
            test: 'Check-in Logic Test',
            status: passed ? 'PASSED' : 'FAILED',
            details: {
                event: { id: event.id.toString() },
                registration: { id: reg.id },
                pass1: {
                    status: res1.status,
                    ok: data1.ok,
                    message: data1.message
                },
                pass2: {
                    status: res2.status,
                    already: data2.already,
                    message: data2.message
                }
            }
        });

    } catch (error: any) {
        console.error('Test failed', error);
        return NextResponse.json({
            error: error.toString(),
            stack: error.stack
        }, { status: 500 });
    }
}
