import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  );
}
