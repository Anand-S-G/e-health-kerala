import { Suspense } from 'react';
import AuthForm from './AuthForm';
import prisma from '@/lib/prisma';

export default async function AuthPage() {
  const hospitals = await prisma.hospital.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' }
  });

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading portal...</div>}>
      <AuthForm hospitals={hospitals} />
    </Suspense>
  );
}
