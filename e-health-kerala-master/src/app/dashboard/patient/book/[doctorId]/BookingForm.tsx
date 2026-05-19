'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Check, CreditCard, Shield, Calendar, Users, Info } from 'lucide-react';

type Slot = {
  id: string;
  datetime: string | Date;
};

export default function BookingForm({ doctorId, slots }: { doctorId: string; slots: Slot[] }) {
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [consultationType, setConsultationType] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [paymentType, setPaymentType] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Slot, 2: Config, 3: Payment (if online)
  const [loading, setLoading] = useState(false);
  
  // Checkout mock states
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const router = useRouter();

  const getFee = () => {
    return consultationType === 'ONLINE' ? 500 : 150;
  };

  const handleNextStep = () => {
    if (step === 1 && !selectedSlotId) return;
    if (step === 2) {
      if (paymentType === 'ONLINE') {
        setStep(3);
        return;
      }
    }
    handleBook();
  };

  const handleBook = async () => {
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
      const fee = getFee();
      const paymentStatus = paymentType === 'ONLINE' ? 'PAID' : 'PENDING';

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          doctorId, 
          datetime, 
          roomCode, 
          slotId: selectedSlotId,
          type: consultationType,
          paymentType,
          paymentStatus,
          fee
        }),
      });

      if (res.ok) {
        alert(
          paymentType === 'ONLINE' 
            ? 'Payment Successful! Appointment Booked Successfully.' 
            : 'OP Ticket Booked! Please pay at the hospital counter.'
        );
        router.push('/dashboard/patient');
      } else {
        alert('Failed to book appointment.');
      }
    } catch (err) {
      alert('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Progress Tracker */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span className={step >= 1 ? 'text-blue-600' : ''}>1. Select Slot</span>
        <span className="text-slate-300">➔</span>
        <span className={step >= 2 ? 'text-blue-600' : ''}>2. Consultation Info</span>
        {paymentType === 'ONLINE' && (
          <>
            <span className="text-slate-300">➔</span>
            <span className={step >= 3 ? 'text-blue-600' : ''}>3. Secure Checkout</span>
          </>
        )}
      </div>

      <div className="p-6">
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Choose Availability Slot
            </h3>
            {slots.length === 0 ? (
              <div className="text-center py-8">
                <Info className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 italic">No available slots at this time. Please check back later or choose another doctor.</p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-60 overflow-y-auto pr-1">
                {slots.map(slot => (
                  <label 
                    key={slot.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${selectedSlotId === slot.id ? 'bg-blue-50/60 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <input 
                        type="radio" 
                        name="slot" 
                        value={slot.id} 
                        checked={selectedSlotId === slot.id}
                        onChange={() => setSelectedSlotId(slot.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span className="text-sm text-slate-900 font-semibold">
                        {new Date(slot.datetime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    {selectedSlotId === slot.id && <Check className="w-4 h-4 text-blue-600" />}
                  </label>
                ))}
              </div>
            )}

            <button 
              onClick={() => setStep(2)}
              disabled={!selectedSlotId}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Consultation Settings</h3>

            {/* Consultation Type */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Consultation Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setConsultationType('ONLINE');
                    setPaymentType('ONLINE'); // Online consultation requires online payment
                  }}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between h-28 transition ${consultationType === 'ONLINE' ? 'bg-blue-50/60 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                >
                  <span className="font-bold text-slate-900 text-sm">Telemedicine</span>
                  <div>
                    <span className="text-xs text-slate-500 block">Online video call</span>
                    <span className="text-sm font-extrabold text-blue-600 mt-1 block">₹500</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setConsultationType('OFFLINE')}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between h-28 transition ${consultationType === 'OFFLINE' ? 'bg-blue-50/60 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                >
                  <span className="font-bold text-slate-900 text-sm">Normal OP Ticket</span>
                  <div>
                    <span className="text-xs text-slate-500 block">Consult directly at hospital</span>
                    <span className="text-sm font-extrabold text-blue-600 mt-1 block">₹150</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Method</label>
              {consultationType === 'ONLINE' ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-slate-500" />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Online Payment Required</span>
                    <span className="text-[11px] text-slate-500">Telemedicine sessions must be pre-paid online.</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentType('ONLINE')}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between h-24 transition ${paymentType === 'ONLINE' ? 'bg-blue-50/60 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                  >
                    <span className="font-bold text-slate-900 text-sm">Pay Online</span>
                    <span className="text-[11px] text-slate-500">Secure digital checkout</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('OFFLINE')}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between h-24 transition ${paymentType === 'OFFLINE' ? 'bg-blue-50/60 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                  >
                    <span className="font-bold text-slate-900 text-sm">Pay at Counter</span>
                    <span className="text-[11px] text-slate-500">Cash/Card at hospital</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-slate-200 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Back
              </button>
              <button 
                type="button"
                onClick={handleNextStep}
                className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
              >
                {paymentType === 'ONLINE' ? 'Go to Payment' : 'Confirm & Book'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && paymentType === 'ONLINE' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" /> Secure Payment Gateway
              </h3>
              <span className="text-sm font-extrabold text-blue-600">₹{getFee()}</span>
            </div>

            {/* Mock Checkout Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cardholder Name</label>
                <input 
                  type="text" 
                  placeholder="Anand Krishnan"
                  className="block w-full border border-slate-250 rounded-xl shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 sm:text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Card Number</label>
                <input 
                  type="text" 
                  required
                  maxLength={16}
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="4111 2222 3333 4444"
                  className="block w-full border border-slate-250 rounded-xl shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 sm:text-sm bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Expiry Date</label>
                  <input 
                    type="text" 
                    required
                    maxLength={5}
                    value={expiry}
                    onChange={e => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="block w-full border border-slate-250 rounded-xl shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 sm:text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">CVV</label>
                  <input 
                    type="password" 
                    required
                    maxLength={3}
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, ''))}
                    placeholder="***"
                    className="block w-full border border-slate-250 rounded-xl shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 sm:text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-xl flex items-start gap-2.5">
              <Shield className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-800 block">Secure 256-bit SSL Connection</span>
                <span className="text-[10px] text-emerald-600 block">Your payment credentials are fully encrypted and simulated.</span>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 border border-slate-200 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Back
              </button>
              <button 
                onClick={handleBook}
                disabled={loading || !cardNumber || !expiry || !cvv}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : `Pay ₹${getFee()} & Book`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
