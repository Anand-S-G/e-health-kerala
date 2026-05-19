'use client';
import { useState } from 'react';
import { Users, User, Calendar, IndianRupee, Plus, Trash2, Pause, Play, Clock, CheckCircle } from 'lucide-react';

type Doctor = {
  id: string;
  specialization: string;
  isPaused: boolean;
  userId: string;
  user: { name: string; email: string };
};

type AvailabilitySlot = {
  id: string;
  doctorId: string;
  datetime: string | Date;
  isBooked: boolean;
};

type HospitalManagerProps = {
  hospitalId: string;
  initialDoctors: Doctor[];
  initialAppointments: { patientId: string; fee: number }[];
  initialSlots: AvailabilitySlot[];
};

export default function HospitalManager({ 
  hospitalId, 
  initialDoctors, 
  initialAppointments,
  initialSlots
}: HospitalManagerProps) {
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);

  const [activeTab, setActiveTab] = useState<'doctors' | 'availability'>('doctors');

  // Onboard form states
  const [obName, setObName] = useState('');
  const [obEmail, setObEmail] = useState('');
  const [obSpec, setObSpec] = useState('');
  const [obLoading, setObLoading] = useState(false);
  const [obSuccess, setObSuccess] = useState('');
  const [obError, setObError] = useState('');

  // Availability slot planner states
  const [selectedDocId, setSelectedDocId] = useState('');
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [newSlots, setNewSlots] = useState<string[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotSuccess, setSlotSuccess] = useState('');
  const [slotError, setSlotError] = useState('');

  // Doctor list action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Compute analytics
  const totalDoctors = doctors.length;
  const totalAppointments = appointments.length;
  const uniquePatientsCount = new Set(appointments.map(a => a.patientId)).size;
  const revenueGenerated = appointments.reduce((sum, a: any) => sum + (a.fee || 500), 0);

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obName || !obEmail || !obSpec) return;
    setObLoading(true);
    setObSuccess('');
    setObError('');

    try {
      const res = await fetch('/api/hospital/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: obName, email: obEmail, specialization: obSpec })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDoctors(prev => [...prev, data.doctor]);
        setObSuccess(`Dr. ${obName} successfully onboarded!`);
        setObName('');
        setObEmail('');
        setObSpec('');
      } else {
        setObError(data.error || 'Failed to onboard doctor.');
      }
    } catch (err) {
      setObError('Network error occurred.');
    } finally {
      setObLoading(false);
    }
  };

  const handleTogglePause = async (docId: string, currentPaused: boolean) => {
    setActionLoading(docId);
    try {
      const res = await fetch(`/api/hospital/doctors/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaused: !currentPaused })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDoctors(prev => prev.map(d => d.id === docId ? data.doctor : d));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveDoctor = async (docId: string) => {
    if (!confirm('Are you sure you want to remove this doctor and all associated records?')) return;
    setActionLoading(docId);
    try {
      const res = await fetch(`/api/hospital/doctors/${docId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const removedDoc = doctors.find(d => d.id === docId);
        setDoctors(prev => prev.filter(d => d.id !== docId));
        if (removedDoc) {
          setSlots(prev => prev.filter(s => s.doctorId !== removedDoc.userId));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const addLocalSlot = () => {
    if (!slotDate || !slotTime) return;
    const datetimeStr = `${slotDate}T${slotTime}`;
    if (!newSlots.includes(datetimeStr)) {
      setNewSlots(prev => [...prev, datetimeStr].sort());
    }
  };

  const removeLocalSlot = (index: number) => {
    setNewSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAvailability = async () => {
    if (!selectedDocId || newSlots.length === 0) return;
    setSlotLoading(true);
    setSlotSuccess('');
    setSlotError('');

    try {
      const res = await fetch('/api/hospital/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: selectedDocId, slots: newSlots })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSlots(prev => [...prev, ...data.slots].sort((a,b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()));
        setSlotSuccess('Availability slots saved successfully!');
        setNewSlots([]);
        setSlotDate('');
        setSlotTime('');
      } else {
        setSlotError(data.error || 'Failed to save availability.');
      }
    } catch (err) {
      setSlotError('Network error occurred.');
    } finally {
      setSlotLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Doctors</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{totalDoctors}</h3>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3.5 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Patients</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{uniquePatientsCount}</h3>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-xl">
            <User className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Appointments</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{totalAppointments}</h3>
          </div>
          <div className="bg-violet-50 text-violet-600 p-3.5 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue Generated</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">₹{revenueGenerated.toLocaleString()}</h3>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3.5 rounded-xl flex items-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('doctors')}
          className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${activeTab === 'doctors' ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Doctors & Onboarding
        </button>
        <button 
          onClick={() => setActiveTab('availability')}
          className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${activeTab === 'availability' ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Availability Slots Planner
        </button>
      </div>

      {activeTab === 'doctors' ? (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-2xl font-bold text-slate-900">Manage Doctors</h3>
            {doctors.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No onboarded doctors yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {doctors.map(doc => (
                  <div key={doc.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg">Dr. {doc.user.name}</h4>
                          <p className="text-xs text-blue-600 font-medium mt-0.5">{doc.specialization}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${doc.isPaused ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {doc.isPaused ? 'Paused' : 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 font-mono">{doc.user.email}</p>
                    </div>

                    <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => handleTogglePause(doc.id, doc.isPaused)}
                        disabled={actionLoading === doc.id}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${doc.isPaused ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                      >
                        {doc.isPaused ? (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Resume</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pause Appointments</span>
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => handleRemoveDoctor(doc.id)}
                        disabled={actionLoading === doc.id}
                        className="py-2 px-3 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <form onSubmit={handleOnboard} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 sticky top-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" /> Onboard Doctor
              </h3>

              {obSuccess && <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-250 font-medium">{obSuccess}</div>}
              {obError && <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs border border-rose-250 font-medium">{obError}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Doctor Name *</label>
                <input 
                  type="text" 
                  required
                  value={obName}
                  onChange={e => setObName(e.target.value)}
                  placeholder="Dr. Anand Krishnan"
                  className="block w-full border border-slate-250 rounded-xl shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address *</label>
                <input 
                  type="email" 
                  required
                  value={obEmail}
                  onChange={e => setObEmail(e.target.value)}
                  placeholder="anand@example.com"
                  className="block w-full border border-slate-250 rounded-xl shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department / Specialty *</label>
                <input 
                  type="text" 
                  required
                  value={obSpec}
                  onChange={e => setObSpec(e.target.value)}
                  placeholder="e.g. Cardiology, Pediatrics, ENT"
                  className="block w-full border border-slate-250 rounded-xl shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 sm:text-sm"
                />
              </div>

              <button 
                type="submit" 
                disabled={obLoading}
                className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-50"
              >
                {obLoading ? 'Creating Doctor profile...' : 'Onboard Doctor'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 sticky top-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" /> Plan Time Slots
              </h3>

              {slotSuccess && <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-250 font-medium">{slotSuccess}</div>}
              {slotError && <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs border border-rose-250 font-medium">{slotError}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Doctor *</label>
                <select 
                  required
                  value={selectedDocId}
                  onChange={e => {
                    setSelectedDocId(e.target.value);
                    setNewSlots([]);
                  }}
                  className="block w-full border border-slate-250 rounded-xl shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 sm:text-sm bg-white"
                >
                  <option value="">-- Choose a doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.userId}>Dr. {d.user.name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date *</label>
                  <input 
                    type="date"
                    value={slotDate}
                    onChange={e => setSlotDate(e.target.value)}
                    className="block w-full border border-slate-250 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 sm:text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Time *</label>
                  <input 
                    type="time"
                    value={slotTime}
                    onChange={e => setSlotTime(e.target.value)}
                    className="block w-full border border-slate-250 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 sm:text-sm bg-white"
                  />
                </div>
              </div>

              <button 
                type="button"
                onClick={addLocalSlot}
                disabled={!selectedDocId || !slotDate || !slotTime}
                className="w-full bg-slate-100 text-slate-800 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-200 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Slot to List
              </button>

              {newSlots.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-150">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New Slots Scheduled</p>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-150">
                    {newSlots.map((s, idx) => (
                      <span key={s} className="bg-white border border-slate-200 px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 shadow-sm">
                        {new Date(s).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        <button type="button" onClick={() => removeLocalSlot(idx)} className="text-rose-500 hover:text-rose-700 font-bold">×</button>
                      </span>
                    ))}
                  </div>

                  <button 
                    type="button"
                    onClick={handleSaveAvailability}
                    disabled={slotLoading}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
                  >
                    {slotLoading ? 'Saving Slots...' : 'Publish Slots Now'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-2xl font-bold text-slate-900">Current Doctor Availabilities</h3>
            {slots.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No availability slots registered yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {doctors.map(doc => {
                  const docSlots = slots.filter(s => s.doctorId === doc.userId);
                  if (docSlots.length === 0) return null;
                  return (
                    <div key={doc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="font-bold text-slate-900">Dr. {doc.user.name}</h4>
                          <p className="text-xs text-blue-600 font-medium">{doc.specialization}</p>
                        </div>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">{docSlots.length} Slots</span>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {docSlots.map(slot => (
                          <div 
                            key={slot.id} 
                            className={`px-3 py-2 rounded-xl text-xs border font-medium flex items-center gap-1.5 ${slot.isBooked ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}
                          >
                            {slot.isBooked ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                            <span>{new Date(slot.datetime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
