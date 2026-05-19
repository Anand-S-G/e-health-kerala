import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'PATIENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { doctorId, datetime, roomCode, slotId } = await request.json();

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.create({
        data: {
          patientId: session.user.id,
          doctorId,
          datetime: new Date(datetime),
          roomCode,
          status: 'SCHEDULED',
        }
      });

      if (slotId) {
        await tx.availabilitySlot.update({
          where: { id: slotId },
          data: { isBooked: true }
        });
      }

      return apt;
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Booking failed' }, { status: 500 });
  }
}
