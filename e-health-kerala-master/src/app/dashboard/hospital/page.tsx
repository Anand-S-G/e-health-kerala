import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import HospitalManager from './HospitalManager';

export default async function HospitalDashboard() {
  const session = await getSession();
  if (session?.user.role !== 'HOSPITAL') redirect('/dashboard/' + session?.user.role.toLowerCase());

  const hospital = await prisma.hospital.findUnique({
    where: { userId: session.user.id },
    include: { doctors: { include: { user: true } } }
  });

  if (!hospital) return <div>Hospital profile not found.</div>;

  const doctorUserIds = hospital.doctors.map(d => d.userId);

  // Fetch appointments for doctors at this hospital
  const appointments = await prisma.appointment.findMany({
    where: { doctorId: { in: doctorUserIds } },
    select: { patientId: true }
  });

  // Fetch availability slots for doctors at this hospital
  const slots = await prisma.availabilitySlot.findMany({
    where: { doctorId: { in: doctorUserIds } },
    orderBy: { datetime: 'asc' }
  });

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-lg flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold mb-2">{hospital.name}</h1>
           <p className="text-slate-300">Hospital Code: <span className="font-mono bg-slate-800 px-2 py-1 rounded text-white">{hospital.code}</span></p>
        </div>
      </div>

      <HospitalManager 
        hospitalId={hospital.id} 
        initialDoctors={hospital.doctors as any} 
        initialAppointments={appointments}
        initialSlots={slots as any}
      />
    </div>
  );
}
