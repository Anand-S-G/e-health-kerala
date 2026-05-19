import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { roomCode, type, payload } = await request.json();

  try {
    const signal = await prisma.webRTCSignal.create({
      data: {
        roomCode,
        type,
        payload: JSON.stringify(payload),
        senderId: session.user.id,
        receiverId: 'room',
      }
    });
    return NextResponse.json({ success: true, signal });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send signal' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const roomCode = searchParams.get('roomCode');

  if (!roomCode) return NextResponse.json({ error: 'Room code required' }, { status: 400 });

  try {
    const signals = await prisma.webRTCSignal.findMany({
      where: {
        roomCode,
        senderId: { not: session.user.id },
      },
      orderBy: { createdAt: 'asc' }
    });

    if (signals.length > 0) {
      await prisma.webRTCSignal.deleteMany({
        where: { id: { in: signals.map(s => s.id) } }
      });
    }

    return NextResponse.json({ success: true, signals });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to get signals' }, { status: 500 });
  }
}
