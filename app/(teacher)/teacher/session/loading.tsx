export default function Loading() {
  return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="text-center">
        <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse mx-auto mb-4" />
        <div className="h-4 w-56 bg-gray-100 rounded animate-pulse mx-auto" />
      </div>
    </div>
  )
}
