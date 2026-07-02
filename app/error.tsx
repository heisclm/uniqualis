'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-800">Something went wrong</h1>
        <p className="text-slate-500 mt-2">An error occurred while loading this page.</p>
        <button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
