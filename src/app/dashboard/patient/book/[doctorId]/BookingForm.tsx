'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function BookingForm({ doctorId }: { doctorId: string }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const datetime = new Date(`${date}T${time}`).toISOString();
      const roomCode = uuidv4(); // Generate a unique room code for WebRTC

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, datetime, roomCode }),
      });

      if (res.ok) {
        alert('Appointment Booked Successfully!');
        router.push('/dashboard/patient');
      } else {
        alert('Failed to book appointment.');
      }
    } catch (err) {
      alert('Error connecting to server.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleBook} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div>
        <label className="block text-sm font-medium text-slate-700">Date</label>
        <input type="date" required onChange={e => setDate(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Time</label>
        <input type="time" required onChange={e => setTime(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
        {loading ? 'Booking...' : 'Confirm Booking'}
      </button>
    </form>
  );
}
