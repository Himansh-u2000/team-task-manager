export function SkeletonBlock({ className }) {
  return <div className={`bg-[#f0eeeb] rounded animate-pulse ${className || ''}`} />;
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      {[...Array(lines)].map((_, i) => (
        <SkeletonBlock
          key={i}
          className={`h-3 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }) {
  return (
    <div className={`bg-white rounded-lg border border-[#e8e5e0] p-4 ${className || ''}`}>
      <div className="flex items-start gap-3">
        <SkeletonBlock className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
        <SkeletonBlock className="w-12 h-5 shrink-0 rounded" />
      </div>
    </div>
  );
}

export function SkeletonListItem({ className }) {
  return (
    <div className={`p-2.5 bg-[#faf9f7] rounded-md border border-[#f0eeeb] ${className || ''}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <SkeletonBlock className="h-3.5 w-48 mb-1.5" />
          <SkeletonBlock className="h-2.5 w-32" />
        </div>
        <SkeletonBlock className="shrink-0 h-5 w-16 rounded" />
      </div>
    </div>
  );
}
