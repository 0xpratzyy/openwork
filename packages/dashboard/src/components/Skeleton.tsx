export function CardSkeleton() {
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-5 space-y-3">
      <div className="skeleton h-5 w-32" />
      <div className="skeleton h-4 w-48" />
      <div className="skeleton h-4 w-24" />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-dark-card border border-dark-border rounded-lg p-4 flex gap-4 items-center">
          <div className="skeleton h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-3 w-64" />
          </div>
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
