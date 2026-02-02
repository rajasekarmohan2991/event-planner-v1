"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold text-red-600">Something went wrong!</h2>
      <button
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  )
}
