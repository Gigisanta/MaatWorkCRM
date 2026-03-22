export default function Loading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-32 bg-white/5 rounded animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
