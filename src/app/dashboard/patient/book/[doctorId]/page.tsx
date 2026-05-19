import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import BookingForm from './BookingForm';

export default async function BookAppointmentPage({ params }: { params: { doctorId: string } }) {
  const session = await getSession();
  if (session?.user.role !== 'PATIENT') redirect('/auth');

  const doctor = await prisma.doctor.findUnique({
    where: { id: params.doctorId },
    include: { user: true, hospital: true },
  });

  if (!doctor) return <div>Doctor not found.</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Book Appointment</h1>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-xl font-bold">Dr. {doctor.user.name}</h2>
        <p className="text-blue-600">{doctor.specialization}</p>
        <p className="text-slate-500">{doctor.hospital?.name || 'Independent Practice'}</p>
      </div>

      <BookingForm doctorId={doctor.id} />
    </div>
  );
}
