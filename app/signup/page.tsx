'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);
    alert('Check your email for confirmation link!');
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <h1 className="text-3xl font-bold mb-6">Signup POS</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="border rounded p-2 mb-4 w-64"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="border rounded p-2 mb-6 w-64"
      />
      <button
        onClick={handleSignup}
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
      >
        Signup
      </button>
    </div>
  );
}
