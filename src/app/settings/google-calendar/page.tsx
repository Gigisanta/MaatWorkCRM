'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GoogleCalendarPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/calendar');
  }, [router]);

  return null;
}
