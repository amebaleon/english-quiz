export default function Loading() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse mb-6" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
