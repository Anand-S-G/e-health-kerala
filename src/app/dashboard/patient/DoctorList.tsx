'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

type Doctor = {
  id: string;
  specialization: string;
  user: { name: string };
  hospital: { name: string } | null;
};

export default function DoctorList({ doctors }: { doctors: Doctor[] }) {
  const [search, setSearch] = useState('');

  const filtered = doctors.filter(doc => {
    const term = search.toLowerCase();
    return doc.user.name.toLowerCase().includes(term) || 
           doc.specialization.toLowerCase().includes(term) || 
           (doc.hospital?.name || 'Independent').toLowerCase().includes(term);
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center space-x-2">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by name, specialty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm w-full text-slate-900 placeholder-slate-400"
        />
      </div>
      <div className="divide-y divide-slate-100 overflow-y-auto flex-grow">
        {filtered.length === 0 ? (
           <div className="p-6 text-center text-slate-500 text-sm">No doctors found matching "{search}"</div>
        ) : (
          filtered.map(doc => (
            <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
              <h4 className="font-bold text-slate-900">Dr. {doc.user.name}</h4>
              <p className="text-xs text-blue-600 font-medium mb-1">{doc.specialization}</p>
              <p className="text-xs text-slate-500 mb-3">{doc.hospital?.name || 'Independent'}</p>
              <Link href={`/dashboard/patient/book/${doc.id}`} className="block text-center w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                Book Slot
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
