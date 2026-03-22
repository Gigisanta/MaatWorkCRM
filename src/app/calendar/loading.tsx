export default function Loading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
