'use client'

export default function Error() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-800">Something went wrong</h1>
        <p className="text-slate-500 mt-2">An error occurred while loading this page.</p>
      </div>
    </div>
  )
}
