import { Suspense } from 'react';
import ReclutamientoPage from './components/reclutamiento-page';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReclutamientoRoute() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Skeleton className="h-8 w-8 rounded-full" /></div>}>
      <ReclutamientoPage />
    </Suspense>
  );
}
