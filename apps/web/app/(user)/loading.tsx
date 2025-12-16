
export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="text-sm text-slate-500 animate-pulse">Loading user module...</p>
      </div>
    </div>
  )
}
