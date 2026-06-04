'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getRole, roleHome } from '@/lib/auth';

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace(roleHome(getRole() ?? ''));
    } else {
      router.replace('/login');
    }
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
