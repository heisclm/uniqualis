import { MessageSquare } from "lucide-react";

export function EmptyFeed() {
  return (
    <div className="bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm text-center">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
        <MessageSquare className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-700">No evaluations yet</h3>
      <p className="text-slate-500 mt-2">When students submit feedback for your courses, they will appear here.</p>
    </div>
  );
}
