export function SkeletonBlock({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-[#e8e9e2] ${className}`} />
}

export function DashboardSkeleton({ message = 'Loading dashboard data…' }) {
  return <div role="status" aria-live="polite" aria-busy="true" className="space-y-5">
    <span className="sr-only">{message}</span>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => <div key={index} className="dashboard-card p-5">
        <SkeletonBlock className="h-2.5 w-24" /><SkeletonBlock className="mt-4 h-8 w-16" />
      </div>)}
    </div>
    <div className="dashboard-card p-5 lg:p-7">
      <SkeletonBlock className="h-4 w-44" /><SkeletonBlock className="mt-3 h-3 w-72 max-w-full" />
      <div className="mt-7 space-y-3">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="grid grid-cols-[1fr_.7fr_.4fr] gap-4">
          <SkeletonBlock className="h-10" /><SkeletonBlock className="h-10" /><SkeletonBlock className="h-10" />
        </div>)}
      </div>
    </div>
    <p className="text-center text-xs font-semibold text-muted">{message}</p>
  </div>
}

export function DetailSkeleton({ message = 'Loading details…' }) {
  return <div role="status" aria-live="polite" aria-busy="true" className="dashboard-card max-w-3xl space-y-5 p-6">
    <span className="sr-only">{message}</span>
    <SkeletonBlock className="size-14 rounded-full" /><SkeletonBlock className="h-6 w-52" /><SkeletonBlock className="h-3 w-72 max-w-full" />
    <div className="grid gap-4 pt-3 sm:grid-cols-2"><SkeletonBlock className="h-24" /><SkeletonBlock className="h-24" /><SkeletonBlock className="h-24 sm:col-span-2" /></div>
    <p className="text-xs font-semibold text-muted">{message}</p>
  </div>
}
