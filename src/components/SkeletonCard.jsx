export default function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-line wide" />
      <div className="skeleton-line full" />
      <div className="skeleton-line short" />
    </div>
  )
}
