export function ContactDrawerSkeleton() {
  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0E0F12] border-l border-white/10 z-50 animate-pulse">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-white/5 rounded" />
          <div className="h-8 w-8 bg-white/5 rounded" />
        </div>

        {/* Contact info */}
        <div className="space-y-4">
          <div className="h-4 w-20 bg-white/5 rounded" />
          <div className="h-8 w-48 bg-white/5 rounded" />
        </div>

        {/* Tabs */}
        <div className="flex gap-4">
          <div className="h-8 w-20 bg-white/5 rounded" />
          <div className="h-8 w-20 bg-white/5 rounded" />
          <div className="h-8 w-20 bg-white/5 rounded" />
        </div>

        {/* Content placeholders */}
        <div className="space-y-3">
          <div className="h-12 bg-white/5 rounded" />
          <div className="h-12 bg-white/5 rounded" />
          <div className="h-12 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  );
}
