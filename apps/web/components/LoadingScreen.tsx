'use client'



interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingScreen({ message = 'Loading...', fullScreen = true }: LoadingScreenProps) {
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          {/* Text Logo Replacement */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="bg-red-600 w-16 h-16 rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-red-200">
              <span className="text-white text-3xl font-bold">E</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Event Planner</h2>
          </div>
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="bg-red-600 w-10 h-10 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg font-bold">E</span>
          </div>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-red-500 mx-auto mb-3"></div>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  )
}
