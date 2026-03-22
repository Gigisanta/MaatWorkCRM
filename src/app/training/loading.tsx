export default function Loading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-40 bg-white/5 rounded animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
