interface SkeletonProps { className?: string; }

function Bone({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-lg bg-bg-hover ${className}`} />
  );
}

export function DocumentListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-bg-card">
          <Bone className="w-9 h-9 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-2/3" />
            <Bone className="h-3 w-1/3" />
          </div>
          <Bone className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function CollectionGridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Bone className="w-9 h-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3 w-1/2" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[...Array(3)].map((_, j) => <Bone key={j} className="h-12 rounded-lg" />)}
          </div>
          <Bone className="h-9 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5 space-y-3">
            <Bone className="w-10 h-10 rounded-xl" />
            <Bone className="h-7 w-16" />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="glass rounded-2xl p-5">
          <Bone className="h-4 w-40 mb-5" />
          <Bone className="h-52 rounded-xl" />
        </div>
        <div className="glass rounded-2xl p-5">
          <Bone className="h-4 w-24 mb-5" />
          <Bone className="h-52 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          {i % 2 === 0 && <Bone className="w-7 h-7 rounded-lg shrink-0" />}
          <div className={`space-y-1.5 max-w-[75%]`}>
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-4/5" />
            <Bone className="h-4 w-3/5" />
          </div>
          {i % 2 !== 0 && <Bone className="w-7 h-7 rounded-lg shrink-0" />}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(count, 4)} gap-4`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5 space-y-2">
          <Bone className="w-10 h-10 rounded-xl" />
          <Bone className="h-8 w-16" />
          <Bone className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function TableRowSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-1">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-border/50">
          {[...Array(cols)].map((_, j) => (
            <Bone key={j} className={`h-3.5 ${j === 0 ? 'w-1/3' : 'w-1/5'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 flex gap-5">
        <Bone className="w-16 h-16 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-3">
          <Bone className="h-6 w-48" />
          <Bone className="h-4 w-36" />
          <Bone className="h-3 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 space-y-2">
            <Bone className="h-6 w-12" />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
