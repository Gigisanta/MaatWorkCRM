import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function ReportsLoading() {
  return (
    <div className="min-h-screen gradient-bg">
      <div className="lg:pl-[280px]">
        <div className="h-16 border-b border-white/5 px-6 flex items-center" />
        <main className="p-4 lg:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="glass border-white/10">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-10 w-10 rounded-lg bg-white/5" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24 bg-white/5" />
                    <Skeleton className="h-8 w-32 bg-white/5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="glass border-white/10">
                <CardContent className="p-6">
                  <Skeleton className="h-[300px] w-full bg-white/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
