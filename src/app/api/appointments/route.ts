import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'PATIENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { doctorId, datetime, roomCode } = await request.json();

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientId: session.user.id,
        doctorId,
        datetime: new Date(datetime),
        roomCode,
        status: 'SCHEDULED',
      }
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Booking failed' }, { status: 500 });
  }
}
