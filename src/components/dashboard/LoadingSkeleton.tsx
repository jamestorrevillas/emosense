// src/components/dashboard/LoadingSkeleton.tsx
export function LoadingSkeleton() {
  return (
    <div className="container py-8">
      {/* Static Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Dashboard</h1>
        <p className="text-slate-600">Welcome back to your EmoSense dashboard</p>
      </div>

      {/* Loading Content */}
      <div className="animate-pulse space-y-8">        
        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid gap-4 md:grid-cols-7">
          {/* Recent Projects */}
          <div className="col-span-4 space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="col-span-3 space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}