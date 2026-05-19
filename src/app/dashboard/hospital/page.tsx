import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Users } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function HospitalDashboard() {
  const session = await getSession();
  if (session?.user.role !== 'HOSPITAL') redirect('/dashboard/' + session?.user.role.toLowerCase());

  const hospital = await prisma.hospital.findUnique({
    where: { userId: session.user.id },
    include: { doctors: { include: { user: true } } }
  });

  if (!hospital) return <div>Hospital profile not found.</div>;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-lg flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold mb-2">{hospital.name}</h1>
           <p className="text-slate-300">Hospital Code: <span className="font-mono bg-slate-800 px-2 py-1 rounded text-white">{hospital.code}</span></p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Users className="w-6 h-6 text-slate-500" /> Associated Doctors</h2>
            {hospital.doctors.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
                    <p className="text-slate-500 font-medium">No doctors associated yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {hospital.doctors.map(doc => (
                        <div key={doc.id} className="bg-white rounded-xl p-4 border border-slate-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-900">Dr. {doc.user.name}</h3>
                                <p className="text-sm text-slate-500">{doc.specialization}</p>
                            </div>
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">Active</span>
                        </div>
                    ))}
                </div>
            )}
          </div>
      </div>
    </div>
  );
}
