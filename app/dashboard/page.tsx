'use client';

import { useUser } from '@supabase/auth-helpers-react';

export default function DashboardPage() {
  const { user } = useUser();
  return <div>Hello, {user?.email}</div>;
}
