export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
