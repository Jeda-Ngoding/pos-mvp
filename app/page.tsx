import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function Home() {
  // Cek cookie sesi login (bisa sesuaikan dengan autentikasi Supabase kamu)
  const cookieStore = cookies();
  const token = cookieStore.get('sb-access-token');

  if (!token) {
    // Kalau belum login, redirect ke halaman login
    redirect('/login');
  } else {
    // Kalau sudah login, redirect ke dashboard POS
    redirect('/dashboard/pos');
  }

  // Return kosong karena redirect otomatis
  return null;
}
