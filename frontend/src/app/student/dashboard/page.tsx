import {
  Brain, TrendingUp, BookOpen, Target, ArrowRight,
  CheckCircle2, Clock, Zap, Award, GitBranch, Share2,
  Code2, Globe
} from "lucide-react";
import Link from "next/link";

const STATS = [
  { label: "Learning State Score", value: "84 / 100", change: "+6 this week", icon: Brain, color: "blue" },
  { label: "Verified Credentials", value: "12", change: "3 pending", icon: Award, color: "green" },
  { label: "Completed Goals", value: "8 / 15", change: "53% on track", icon: Target, color: "sky" },
  { label: "Streak", value: "14 days", change: "Personal best!", icon: Zap, color: "cyan" },
];

const RECENT = [
  { title: "GitHub commit activity synced", time: "2h ago", type: "connector" },
  { title: "Python DSA module completed", time: "Yesterday", type: "academic" },
  { title: "Hackathon certificate uploaded", time: "2 days ago", type: "document" },
  { title: "Institute verified your marksheet", time: "3 days ago", type: "verified" },
];

const CONNECTORS = [
  { id: "github", label: "GitHub", icon: GitBranch, connected: true },
  { id: "linkedin", label: "LinkedIn", icon: Share2, connected: true },
  { id: "leetcode", label: "LeetCode", icon: Code2, connected: false },
  { id: "portfolio", label: "Portfolio", icon: Globe, connected: false },
];

const COLORMAP: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  green: "bg-green-50 text-green-700 border-green-200",
  sky: "bg-sky-50 text-sky-700 border-sky-200",
  cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
};

export default function StudentDashboardHome() {
  return (
    <div className="space-y-6">
      <div className="bg-blue-600 border-2 border-slate-900 shadow-[6px_6px_0_0_#0f172a] p-6 text-white">
        <p className="text-blue-100 text-sm font-semibold mb-1">Welcome back 👋</p>
        <h2 className="text-2xl font-bold mb-1">Good morning, Jayesh!</h2>
        <p className="text-blue-50 text-sm max-w-lg">
          Your Learning State was last updated 2 hours ago. You have 3 goals due this week and 2 new activity suggestions.
        </p>
        <div className="flex gap-3 mt-4">
          <Link
            href="/student/dashboard/learning-state"
            className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 border-2 border-slate-900 shadow-[3px_3px_0_0_#0f172a] text-sm font-bold px-4 py-2 transition-all"
          >
            <Brain className="w-4 h-4" /> View Learning State
          </Link>
          <Link
            href="/student/dashboard/planning"
            className="flex items-center gap-2 bg-sky-100 text-slate-900 hover:bg-white border-2 border-slate-900 shadow-[3px_3px_0_0_#0f172a] text-sm font-bold px-4 py-2 transition-all"
          >
            <Target className="w-4 h-4" /> My Goals
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, change, icon: Icon, color }) => (
          <div key={label} className="bg-white border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] p-5">
            <div className={`w-10 h-10 flex items-center justify-center border-2 mb-3 ${COLORMAP[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-sm text-slate-600 mt-0.5">{label}</div>
            <div className="text-xs text-green-700 font-bold mt-1">{change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-white border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
            <button className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {RECENT.map(({ title, time, type }) => (
              <div key={title} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 border-2 flex items-center justify-center flex-shrink-0 ${
                    type === "connector"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : type === "academic"
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : type === "document"
                      ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                      : "bg-green-50 text-green-700 border-green-200"
                  }`}
                >
                  {type === "verified" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : type === "connector" ? (
                    <Zap className="w-4 h-4" />
                  ) : (
                    <BookOpen className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{title}</p>
                </div>
                <span className="text-xs text-slate-500 flex-shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {time}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Connectors</h3>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5">
              {CONNECTORS.filter((c) => c.connected).length}/{CONNECTORS.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {CONNECTORS.map(({ id, label, icon: Icon, connected }) => (
              <div key={id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 border-2 border-slate-200 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <span className="text-sm text-slate-700 flex-1">{label}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 border ${
                    connected
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-slate-50 text-slate-500 border-slate-200"
                  }`}
                >
                  {connected ? "Connected" : "Connect"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t-2 border-slate-200">
            <Link
              href="/student/dashboard/learning-state"
              className="text-xs text-blue-700 font-bold flex items-center gap-1 hover:underline"
            >
              <TrendingUp className="w-3 h-3" /> View Learning State impact
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            href: "/student/dashboard/learning-state",
            icon: Brain,
            title: "Learning State",
            desc: "View your AI-powered academic profile",
            color: "blue",
          },
          {
            href: "/student/dashboard/guru",
            icon: Zap,
            title: "Ask AI Guru",
            desc: "Get guidance, study plans, and advice",
            color: "sky",
          },
          {
            href: "/student/dashboard/activities",
            icon: BookOpen,
            title: "Activities",
            desc: "Explore hobby-based learning activities",
            color: "cyan",
          },
        ].map(({ href, icon: Icon, title, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="bg-white border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] p-5 hover:bg-blue-50 transition-all group"
          >
            <div
              className={`w-10 h-10 flex items-center justify-center mb-3 border-2 ${
                color === "blue"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : color === "sky"
                  ? "bg-sky-50 text-sky-700 border-sky-200"
                  : "bg-cyan-50 text-cyan-700 border-cyan-200"
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">{title}</h4>
            <p className="text-xs text-slate-600">{desc}</p>
            <div className="flex items-center gap-1 text-xs font-bold text-blue-700 mt-3 group-hover:gap-2 transition-all">
              Open <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
