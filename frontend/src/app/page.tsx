'use client';

import { useRouter } from 'next/navigation';

import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/projects');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-gray-600">Redirecting to projects...</p>
    </div>
  );
}
