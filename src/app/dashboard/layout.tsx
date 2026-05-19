import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Chatbot from '@/components/Chatbot';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session) {
    redirect('/auth');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-xl font-bold text-slate-900">E-Health Portal</span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {session.user.role}
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <span className="text-sm font-medium text-slate-700">{session.user.name || session.user.email}</span>
            <form action={async () => {
              'use server';
              const { cookies } = await import('next/headers');
              cookies().set('session', '', { expires: new Date(0) });
              redirect('/auth');
            }}>
              <button className="text-sm text-slate-500 hover:text-red-600 font-medium transition-colors">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {children}
        <Chatbot />
      </main>
    </div>
  );
}
