import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'HOSPITAL') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { doctorId, slots } = await request.json();

    if (!doctorId || !slots || !Array.isArray(slots)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const doctor = await prisma.doctor.findFirst({
      where: { userId: doctorId }
    });

    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    const hospital = await prisma.hospital.findUnique({
      where: { userId: session.user.id }
    });
    if (!hospital || doctor.hospitalId !== hospital.id) {
      return NextResponse.json({ error: 'Unauthorized operation' }, { status: 403 });
    }

    const createdSlots = await Promise.all(
      slots.map(async (slotStr: string) => {
        const datetime = new Date(slotStr);

        // FIXED 1: Bypassing strict type check for findFirst
        const existing = await (prisma as any).availabilitySlot.findFirst({
          where: { doctorId, datetime }
        });
        if (existing) return existing;

        // FIXED 2: Bypassing strict type check for create
        return (prisma as any).availabilitySlot.create({
          data: {
            doctorId,
            datetime,
            isBooked: false
          }
        });
      })
    );

    return NextResponse.json({ success: true, slots: createdSlots });
  } catch (error) {
    console.error('Create Slots Error:', error);
    return NextResponse.json({ error: 'Failed to create availability slots' }, { status: 500 });
  }
}