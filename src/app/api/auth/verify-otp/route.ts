import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, code, role, name, extraData } = await request.json();
    
    if (!email || !code || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const verification = await prisma.verificationCode.findUnique({ where: { email } });
    
    if (!verification || verification.code !== code) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    if (new Date() > verification.expiresAt) {
      return NextResponse.json({ error: 'Verification code expired' }, { status: 400 });
    }

    // Code is valid. Create or find user.
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      if (!name) return NextResponse.json({ error: 'Name is required for registration' }, { status: 400 });
      
      user = await prisma.user.create({
        data: { email, name, role },
      });

      // Handle role-specific profiles
      if (role === 'DOCTOR') {
        await prisma.doctor.create({
          data: {
            userId: user.id,
            specialization: extraData?.specialization || 'General',
            hospitalId: extraData?.hospitalId || null,
          }
        });
      } else if (role === 'HOSPITAL') {
        await prisma.hospital.create({
            data: {
                userId: user.id,
                name: name,
                code: `HOSP${Math.floor(Math.random()*10000)}`,
            }
        });
      }
    } else {
        // If user exists, but tries to login with a different role, we might want to allow it or deny it.
        // For simplicity, we just log them in if email matches.
    }

    // Clean up code
    await prisma.verificationCode.delete({ where: { email } });

    // Create session
    await createSession({ id: user.id, email: user.email, role: user.role });

    return NextResponse.json({ success: true, user });

  } catch (error) {
    console.error('OTP Verification Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
