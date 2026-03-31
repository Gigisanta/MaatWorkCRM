import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function PipelineLoading() {
  return (
    <div className="min-h-screen gradient-bg">
      <div className="lg:pl-[220px]">
        <div className="h-16 border-b border-white/5 px-6 flex items-center">
          <Skeleton className="h-4 w-32 bg-white/5" />
        </div>
        <main className="p-4 lg:p-6">
          {/* Page title */}
          <div className="mb-6 space-y-2">
            <Skeleton className="h-8 w-48 bg-white/5" />
            <Skeleton className="h-4 w-64 bg-white/5" />
          </div>
          {/* Pipeline columns */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((col) => (
              <div
                key={col}
                className="min-w-[280px] max-w-[280px] flex flex-col gap-3"
              >
                {/* Column header */}
                <div className="px-1 py-2 rounded-lg bg-white/3 border border-white/6 border-t-2" style={{ borderTopColor: "hsl(270 50% 50%)" }}>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-20 bg-white/5" />
                    <Skeleton className="h-5 w-6 bg-white/5 rounded" />
                  </div>
                </div>
                {/* Contact cards */}
                {[1, 2, 3].map((card) => (
                  <Card key={card} className="glass border-white/8">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24 bg-white/5" />
                        <Skeleton className="h-5 w-12 bg-white/5 rounded" />
                      </div>
                      <Skeleton className="h-3 w-32 bg-white/5" />
                      <Skeleton className="h-3 w-20 bg-white/5" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
