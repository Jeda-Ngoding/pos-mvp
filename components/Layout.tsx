'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-white p-4 shadow">
        <h2 className="font-bold text-lg mb-4">POS Menu</h2>
        <ul className="space-y-2 mb-6">
          <li><Link href="/dashboard/pos">POS</Link></li>
          <li><Link href="/dashboard/products">Products</Link></li>
          <li><Link href="/dashboard/reports">Reports</Link></li>
        </ul>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
