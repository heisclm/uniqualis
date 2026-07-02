import { MessageSquareDashed } from "lucide-react";

interface EmptyFeedProps {
  title?: string;
  description?: string;
}

export function EmptyFeed({ 
  title = "You're all caught up for the semester!", 
  description = "When students submit feedback, it will appear here." 
}: EmptyFeedProps) {
  return (
    <div className="p-16 rounded-[2rem] border-2 border-dashed border-slate-200/60 bg-slate-50/50 text-center flex flex-col items-center justify-center transition-all duration-500 hover:bg-slate-50">
      <div className="w-20 h-20 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-full flex items-center justify-center mb-6 text-teal-400 relative">
        <div className="absolute inset-0 rounded-full border border-teal-100 animate-[spin_4s_linear_infinite]"></div>
        <MessageSquareDashed className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-display font-bold text-slate-800 tracking-tight">{title}</h3>
      <p className="text-slate-500 mt-2 max-w-sm">{description}</p>
    </div>
  );
}
