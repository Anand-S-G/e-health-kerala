import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'HOSPITAL') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hospital = await prisma.hospital.findUnique({
    where: { userId: session.user.id }
  });

  if (!hospital) {
    return NextResponse.json({ error: 'Hospital profile not found' }, { status: 404 });
  }

  try {
    const { name, email, specialization } = await request.json();

    if (!name || !email || !specialization) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: 'DOCTOR',
      }
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        specialization,
        hospitalId: hospital.id,
      },
      include: { user: true }
    });

    return NextResponse.json({ success: true, doctor });
  } catch (error) {
    console.error('Onboard Doctor Error:', error);
    return NextResponse.json({ error: 'Failed to onboard doctor' }, { status: 500 });
  }
}
