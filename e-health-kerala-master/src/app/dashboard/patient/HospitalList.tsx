'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search, Building2, ChevronDown, ChevronUp, User } from 'lucide-react';

type Doctor = {
  id: string;
  specialization: string;
  userId: string;
  user: { name: string };
};

type Hospital = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  doctors: Doctor[];
};

type HospitalListProps = {
  hospitals: Hospital[];
  independentDoctors: Doctor[];
};

export default function HospitalList({ hospitals, independentDoctors }: HospitalListProps) {
  const [search, setSearch] = useState('');
  const [expandedHospital, setExpandedHospital] = useState<string | null>(null);

  const toggleHospital = (id: string) => {
    setExpandedHospital(prev => (prev === id ? null : id));
  };

  const filteredHospitals = hospitals.filter(h => {
    const term = search.toLowerCase();
    const matchHospital = h.name.toLowerCase().includes(term) || (h.address && h.address.toLowerCase().includes(term));
    const matchDoctor = h.doctors.some(
      doc => doc.user.name.toLowerCase().includes(term) || doc.specialization.toLowerCase().includes(term)
    );
    return matchHospital || matchDoctor;
  });

  const filteredIndependents = filteredIndependentsFunc(independentDoctors, search);

  function filteredIndependentsFunc(docs: Doctor[], searchTerm: string) {
    const term = searchTerm.toLowerCase();
    return docs.filter(doc => doc.user.name.toLowerCase().includes(term) || doc.specialization.toLowerCase().includes(term));
  }

  const totalResults = filteredHospitals.length + (filteredIndependents.length > 0 ? 1 : 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[550px]">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center space-x-2">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search hospitals, doctors, or specialties..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm w-full text-slate-900 placeholder-slate-400"
        />
      </div>

      <div className="divide-y divide-slate-100 overflow-y-auto flex-grow p-2 space-y-2">
        {totalResults === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">No results found matching "{search}"</div>
        ) : (
          <>
            {filteredHospitals.map(hospital => {
              const isExpanded = expandedHospital === hospital.id;
              return (
                <div key={hospital.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:border-slate-350">
                  <button 
                    onClick={() => toggleHospital(hospital.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">{hospital.name}</h4>
                        <p className="text-xs text-slate-500">{hospital.address || 'Kerala, India'} • {hospital.doctors.length} Doctors</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>

                  {isExpanded && (
                    <div className="bg-slate-50 border-t border-slate-100 p-4 space-y-3">
                      <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Available Doctors</h5>
                      {hospital.doctors.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No doctors currently registered at this hospital.</p>
                      ) : (
                        <div className="grid gap-3">
                          {hospital.doctors.map(doc => (
                            <div key={doc.id} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center hover:shadow-sm transition-all">
                              <div>
                                <h6 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-slate-400" /> Dr. {doc.user.name}
                                </h6>
                                <p className="text-xs text-blue-600 font-medium">{doc.specialization}</p>
                              </div>
                              <Link 
                                href={`/dashboard/patient/book/${doc.id}`} 
                                className="px-3.5 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors"
                              >
                                Book Slot
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredIndependents.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:border-slate-350">
                <button 
                  onClick={() => toggleHospital('independent')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">Independent Clinics</h4>
                      <p className="text-xs text-slate-500">{filteredIndependents.length} Doctors</p>
                    </div>
                  </div>
                  {expandedHospital === 'independent' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {expandedHospital === 'independent' && (
                  <div className="bg-slate-50 border-t border-slate-100 p-4 space-y-3">
                    <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Independent Doctors</h5>
                    <div className="grid gap-3">
                      {filteredIndependents.map(doc => (
                        <div key={doc.id} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center hover:shadow-sm transition-all">
                          <div>
                            <h6 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" /> Dr. {doc.user.name}
                            </h6>
                            <p className="text-xs text-blue-600 font-medium">{doc.specialization}</p>
                          </div>
                          <Link 
                            href={`/dashboard/patient/book/${doc.id}`} 
                            className="px-3.5 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors"
                          >
                            Book Slot
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
