export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-800">403 - Unauthorized</h1>
        <p className="text-slate-500 mt-2">You do not have permission to access this page.</p>
        <a href="/login" className="mt-4 inline-block text-blue-600 font-medium">Return to Login</a>
      </div>
    </div>
  )
}
