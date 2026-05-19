import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Calendar, Video, Clock } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function PatientDashboard() {
  const session = await getSession();
  if (session?.user.role !== 'PATIENT') redirect('/dashboard/' + session?.user.role.toLowerCase());

  // Fetch upcoming appointments
  const appointments = await prisma.appointment.findMany({
    where: { patientId: session.user.id },
    include: { doctor: true },
    orderBy: { datetime: 'asc' },
  });

  // Fetch doctors for booking
  const doctors = await prisma.doctor.findMany({
    include: { user: true, hospital: true },
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
          <h2 className="text-2xl font-bold text-slate-900">Upcoming Appointments</h2>
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
        </div>

        {/* Book Appointment Section */}
        <div>
           <h2 className="text-2xl font-bold text-slate-900 mb-6">Book a Doctor</h2>
           <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <p className="text-sm font-medium text-slate-600">Available Specialists</p>
              </div>
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {doctors.map(doc => (
                  <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <h4 className="font-bold text-slate-900">Dr. {doc.user.name}</h4>
                    <p className="text-xs text-blue-600 font-medium mb-1">{doc.specialization}</p>
                    <p className="text-xs text-slate-500 mb-3">{doc.hospital?.name || 'Independent'}</p>
                    <Link href={`/dashboard/patient/book/${doc.id}`} className="block text-center w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                      Book Slot
                    </Link>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
