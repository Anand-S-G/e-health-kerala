'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

type Slot = {
  id: string;
  datetime: string | Date;
};

export default function BookingForm({ doctorId, slots }: { doctorId: string; slots: Slot[] }) {
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) {
      alert('Please select a time slot.');
      return;
    }
    setLoading(true);

    try {
      const chosenSlot = slots.find(s => s.id === selectedSlotId);
      if (!chosenSlot) {
        alert('Invalid slot selected.');
        setLoading(false);
        return;
      }

      const datetime = new Date(chosenSlot.datetime).toISOString();
      const roomCode = uuidv4();

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, datetime, roomCode, slotId: selectedSlotId }),
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
        <label className="block text-sm font-semibold text-slate-700 mb-2">Available Time Slots</label>
        {slots.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No available slots at this time. Please check back later or choose another doctor.</p>
        ) : (
          <div className="grid gap-3 max-h-60 overflow-y-auto p-1">
            {slots.map(slot => (
              <label 
                key={slot.id} 
                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition ${selectedSlotId === slot.id ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
              >
                <input 
                  type="radio" 
                  name="slot" 
                  value={slot.id} 
                  checked={selectedSlotId === slot.id}
                  onChange={() => setSelectedSlotId(slot.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="text-sm text-slate-900 font-medium">
                  {new Date(slot.datetime).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <button 
        type="submit" 
        disabled={loading || slots.length === 0 || !selectedSlotId} 
        className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Booking...' : 'Confirm Booking'}
      </button>
    </form>
  );
}
