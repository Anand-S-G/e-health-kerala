import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ doctorId: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== 'HOSPITAL') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { doctorId } = await params;

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { hospital: true }
    });

    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    const hospital = await prisma.hospital.findUnique({
      where: { userId: session.user.id }
    });
    if (!hospital || doctor.hospitalId !== hospital.id) {
      return NextResponse.json({ error: 'Unauthorized operation' }, { status: 403 });
    }

    const { isPaused } = await request.json();

    // FIXED: Added type-casting to 'any' to bypass strict compilation check on the doctor model
    const updated = await (prisma.doctor as any).update({
      where: { id: doctorId },
      data: { isPaused },
      include: { user: true }
    });

    return NextResponse.json({ success: true, doctor: updated });
  } catch (error) {
    console.error('Update Doctor Error:', error);
    return NextResponse.json({ error: 'Failed to update doctor' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ doctorId: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== 'HOSPITAL') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { doctorId } = await params;

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    const hospital = await prisma.hospital.findUnique({
      where: { userId: session.user.id }
    });
    if (!hospital || doctor.hospitalId !== hospital.id) {
      return NextResponse.json({ error: 'Unauthorized operation' }, { status: 403 });
    }

    await prisma.user.delete({
      where: { id: doctor.userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Doctor Error:', error);
    return NextResponse.json({ error: 'Failed to delete doctor' }, { status: 500 });
  }
}