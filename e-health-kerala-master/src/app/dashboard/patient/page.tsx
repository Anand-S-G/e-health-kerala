import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Calendar, Video, Clock, FileText } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import HospitalList from './HospitalList';

export default async function PatientDashboard() {
  const session = await getSession();
  if (session?.user.role !== 'PATIENT') redirect('/dashboard/' + session?.user.role.toLowerCase());

  // Fetch upcoming appointments
  const appointments = await prisma.appointment.findMany({
    where: { patientId: session.user.id },
    include: { doctor: true },
    orderBy: { datetime: 'asc' },
  });

  // Fetch hospitals for booking
  const hospitals = await prisma.hospital.findMany({
    include: {
      doctors: {
        where: { isPaused: false },
        include: { user: true }
      }
    }
  });

  // Fetch independent doctors
  const independentDoctors = await prisma.doctor.findMany({
    where: { hospitalId: null, isPaused: false },
    include: { user: true },
  });

  // Fetch patient medical records
  const records = await (prisma as any).medicalRecord.findMany({
    where: { patientId: session.user.id },
    include: { doctor: true },
    orderBy: { date: 'desc' },
  });

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {session.user.name}</h1>
        <p className="text-blue-100">Here's your health overview for today.</p>
      </div>

      {/* Quick Actions & Upcoming Appointments */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-slate-500" /> Upcoming Appointments
          </h2>
          {appointments.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No upcoming appointments</p>
            </div>
          ) : (
             <div className="space-y-4">
              {appointments.map(apt => (
                <div key={apt.id} className="bg-white rounded-xl p-6 border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Dr. {apt.doctor.name}</h3>
                      <p className="text-sm text-slate-500">{new Date(apt.datetime).toLocaleString()}</p>
                    </div>
                  </div>
                  {apt.roomCode && (
                    <Link href={`/call/${apt.roomCode}`} className="flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-200 transition-colors">
                      <Video className="w-4 h-4" />
                      <span>Join Call</span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Medical Records Section */}
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-slate-500" /> Your Medical Records
            </h2>
            {records.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
                <p className="text-slate-500 font-medium">No medical records available.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record: any) => (
                  <div key={record.id} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">Diagnosis: {record.diagnosis}</h3>
                        <p className="text-sm text-slate-500">Prescribed by Dr. {record.doctor.name}</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-2">
                      <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Prescription</h4>
                      <p className="text-slate-800 text-sm whitespace-pre-wrap">{record.prescription}</p>
                    </div>
                    {record.notes && (
                      <p className="text-slate-600 text-xs italic mt-2">Notes: {record.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Book Appointment Section */}
        <div>
           <h2 className="text-2xl font-bold text-slate-900 mb-6">Book via Hospital</h2>
           <HospitalList hospitals={hospitals as any} independentDoctors={independentDoctors as any} />
        </div>
      </div>
    </div>
  );
}
