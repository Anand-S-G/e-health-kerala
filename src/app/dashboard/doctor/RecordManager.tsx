'use client';
import { useState } from 'react';
import { FileText, PlusCircle, Search, User, ClipboardList } from 'lucide-react';

type Patient = {
  id: string;
  name: string;
  email: string;
};

type Record = {
  id: string;
  patientId: string;
  diagnosis: string;
  prescription: string;
  notes: string | null;
  date: string | Date;
  patient: { name: string; email: string };
};

type RecordManagerProps = {
  initialRecords: Record[];
  patients: Patient[];
};

export default function RecordManager({ initialRecords, patients }: RecordManagerProps) {
  const [records, setRecords] = useState<Record[]>(initialRecords);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');

  // Form states
  const [patientId, setPatientId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !diagnosis || !prescription) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, diagnosis, prescription, notes }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Medical record created successfully!');
        const selectedPatient = patients.find(p => p.id === patientId);
        const newRecord: Record = {
          ...data.record,
          patient: {
            name: selectedPatient?.name || 'Unknown',
            email: selectedPatient?.email || '',
          }
        };
        setRecords(prev => [newRecord, ...prev]);

        // Reset form
        setPatientId('');
        setDiagnosis('');
        setPrescription('');
        setNotes('');
        setActiveTab('list');
      } else {
        setErrorMsg(data.error || 'Failed to create record.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(rec => {
    const term = search.toLowerCase();
    return rec.patient.name.toLowerCase().includes(term) || 
           rec.diagnosis.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('list')}
          className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${activeTab === 'list' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          View Patient Records
        </button>
        <button 
          onClick={() => setActiveTab('add')}
          className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${activeTab === 'add' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Add Medical Record
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm max-w-md">
            <Search className="w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by patient name or diagnosis..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm w-full text-slate-900 placeholder-slate-400"
            />
          </div>

          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No medical records found.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredRecords.map(rec => (
                <div key={rec.id} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">Diagnosis: {rec.diagnosis}</h4>
                      <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5 text-slate-400" /> {rec.patient.name} ({rec.patient.email})
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                      {new Date(rec.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-2">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Prescription</h5>
                    <p className="text-slate-800 text-sm whitespace-pre-wrap">{rec.prescription}</p>
                  </div>
                  {rec.notes && (
                    <p className="text-slate-650 text-xs italic mt-2">Notes: {rec.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 max-w-2xl">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-emerald-600" /> Write Medical Record
          </h3>

          {successMsg && <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-sm border border-emerald-200">{successMsg}</div>}
          {errorMsg && <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-sm border border-rose-200">{errorMsg}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Patient *</label>
            <select 
              required
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              className="block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
            >
              <option value="">-- Choose a patient --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Diagnosis *</label>
            <input 
              type="text" 
              required
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              placeholder="e.g. Acute Bronchitis, Hypertension"
              className="block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Prescription & Advice *</label>
            <textarea 
              required
              rows={4}
              value={prescription}
              onChange={e => setPrescription(e.target.value)}
              placeholder="e.g. Paracetamol 650mg - 1-0-1 after food for 3 days."
              className="block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Additional Notes (Optional)</label>
            <textarea 
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Refer to specialist if symptoms persist."
              className="block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Creating...' : 'Create Record'}
          </button>
        </form>
      )}
    </div>
  );
}
