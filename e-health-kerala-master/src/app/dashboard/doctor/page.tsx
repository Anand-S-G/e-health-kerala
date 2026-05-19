import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Calendar, Video, Clock } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import RecordManager from './RecordManager';

export default async function DoctorDashboard() {
  const session = await getSession();
  if (session?.user.role !== 'DOCTOR') redirect('/dashboard/' + session?.user.role.toLowerCase());

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
    include: { hospital: true }
  });

  if (!doctor) return <div>Doctor profile not found.</div>;

  // Fetch upcoming appointments
  const appointments = await prisma.appointment.findMany({
    where: { doctorId: session.user.id },
    include: { patient: true },
    orderBy: { datetime: 'asc' },
  });

  // Fetch patient medical records created by this doctor
  const records = await prisma.medicalRecord.findMany({
    where: { doctorId: session.user.id },
    include: { patient: { select: { name: true, email: true } } },
    orderBy: { date: 'desc' },
  });

  // Extract unique patients from appointments to select for record creation
  const patientsMap = new Map();
  appointments.forEach(apt => {
    patientsMap.set(apt.patient.id, {
      id: apt.patient.id,
      name: apt.patient.name,
      email: apt.patient.email,
    });
  });
  const patients = Array.from(patientsMap.values());

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-800 rounded-2xl p-8 text-white shadow-lg flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold mb-2">Dr. {session.user.name}</h1>
           <p className="text-emerald-100">{doctor.specialization} • {doctor.hospital?.name || 'Independent'}</p>
        </div>
        <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/30 hidden sm:block">
          <p className="text-sm font-medium">Appointments Today: {appointments.filter(a => new Date(a.datetime).toDateString() === new Date().toDateString()).length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-slate-500" /> Your Schedule
          </h2>
          {appointments.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No appointments scheduled.</p>
            </div>
          ) : (
             <div className="space-y-4">
              {appointments.map(apt => (
                <div key={apt.id} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{apt.patient.name}</h3>
                      <p className="text-sm text-slate-500">{apt.patient.email}</p>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mb-6">
                    <p className="text-sm font-medium text-slate-700 bg-slate-50 inline-block px-3 py-1 rounded-md border border-slate-100">
                      {new Date(apt.datetime).toLocaleString()}
                    </p>
                  </div>
                  {apt.roomCode ? (
                    <Link href={`/call/${apt.roomCode}`} className="w-full flex justify-center items-center space-x-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                      <Video className="w-4 h-4" />
                      <span>Start Video Call</span>
                    </Link>
                  ) : (
                    <button className="w-full flex justify-center items-center space-x-2 bg-slate-100 text-slate-400 px-4 py-2.5 rounded-lg font-medium cursor-not-allowed">
                      <Video className="w-4 h-4" />
                      <span>Call Link Pending</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medical Records Section */}
        <div className="lg:col-span-2 space-y-6">
          <RecordManager initialRecords={records as any} patients={patients} />
        </div>
      </div>
    </div>
  );
}
