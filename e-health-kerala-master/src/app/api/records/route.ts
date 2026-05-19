import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'DOCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { patientId, diagnosis, prescription, notes } = await request.json();

    if (!patientId || !diagnosis || !prescription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const record = await prisma.medicalRecord.create({
      data: {
        patientId,
        doctorId: session.user.id,
        diagnosis,
        prescription,
        notes,
      }
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Create Record Error:', error);
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
  }
}
