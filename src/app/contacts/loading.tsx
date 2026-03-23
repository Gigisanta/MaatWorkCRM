import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function ContactsLoading() {
  return (
    <div className="min-h-screen gradient-bg">
      <div className="lg:pl-[220px]">
        <div className="h-16 border-b border-white/5 px-6 flex items-center" />
        <main className="p-4 lg:p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="glass border-white/10">
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-3 w-20 bg-white/5" />
                  <Skeleton className="h-8 w-16 bg-white/5" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="glass border-white/10">
            <CardContent className="p-0 p-4">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-4 w-4 bg-white/5" />
                    <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40 bg-white/5" />
                      <Skeleton className="h-3 w-24 bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
