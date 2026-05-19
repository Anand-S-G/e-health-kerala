'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR' | 'HOSPITAL'>('PATIENT');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const requestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStep('VERIFY');
      } else {
        alert('Failed to send OTP');
      }
    } catch (err) {
      alert('Error connecting to server');
    }
    setLoading(false);
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, role, name }),
      });
      if (res.ok) {
        if (role === 'PATIENT') router.push('/dashboard/patient');
        if (role === 'DOCTOR') router.push('/dashboard/doctor');
        if (role === 'HOSPITAL') router.push('/dashboard/hospital');
      } else {
        const data = await res.json();
        alert(data.error || 'Verification failed');
      }
    } catch (err) {
      alert('Error connecting to server');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to E-Health Kerala
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Access your telemedicine portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-100">
          
          <div className="flex p-1 space-x-1 bg-slate-100 rounded-lg mb-8">
            <button 
              onClick={() => { setRole('PATIENT'); setStep('REQUEST'); }} 
              className={`w-full py-2.5 text-sm font-medium rounded-md transition-all ${role === 'PATIENT' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
              Patient
            </button>
            <button 
              onClick={() => { setRole('DOCTOR'); setStep('REQUEST'); }} 
              className={`w-full py-2.5 text-sm font-medium rounded-md transition-all ${role === 'DOCTOR' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
              Doctor
            </button>
            <button 
              onClick={() => { setRole('HOSPITAL'); setStep('REQUEST'); }} 
              className={`w-full py-2.5 text-sm font-medium rounded-md transition-all ${role === 'HOSPITAL' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
              Hospital
            </button>
          </div>

          {step === 'REQUEST' ? (
            <form className="space-y-6" onSubmit={requestOTP}>
              <div>
                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                <div className="mt-1">
                  <input type="text" required onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors" />
                </div>
                <p className="mt-1 text-xs text-slate-500">Only required if you are a new user.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email address</label>
                <div className="mt-1">
                  <input type="email" required onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors" />
                </div>
              </div>

              <div>
                <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50">
                  {loading ? 'Sending OTP...' : 'Send OTP to Email'}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={verifyOTP}>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-800">We've sent a 6-digit verification code to <strong>{email}</strong>.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Verification Code</label>
                <div className="mt-1">
                  <input type="text" required onChange={(e) => setCode(e.target.value)} placeholder="123456" className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center tracking-[0.5em] font-bold transition-colors" />
                </div>
              </div>
              <div>
                <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors disabled:opacity-50">
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
              </div>
              <div className="text-center">
                 <button type="button" onClick={() => setStep('REQUEST')} className="text-sm text-blue-600 hover:text-blue-500">Back to Email</button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
