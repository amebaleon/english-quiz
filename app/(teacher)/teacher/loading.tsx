export default function Loading() {
  return (
    <div className="p-8">
      <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse mb-6" />

      <div className="grid grid-cols-2 gap-4 mb-8 max-w-lg">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-10 w-16 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-8 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 max-w-2xl">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
            <div>
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
