"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Brain, CheckCircle2, Clock, TrendingUp, AlertCircle,
  Star, BookOpen, Code2, Award, Globe, Zap, BarChart3,
  FileText, Link2, RotateCcw, Sparkles, Activity
} from "lucide-react";
import type { QuestionType, StudentMetrics, BrainRegionMeta } from "@/components/BrainVisualization";

// SSR-safe dynamic loading for Three.js WebGL canvas
const BrainVisualization = dynamic(() => import("@/components/BrainVisualization"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-[#F8FBFF] text-[#64748B] gap-3">
      <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold text-[#172033]">Initializing 3D Cognitive Neural Map...</span>
    </div>
  ),
});

const KNOWLEDGE_AREAS = [
  { name: "Data Structures & Algorithms", level: 82, status: "verified" },
  { name: "Object Oriented Programming", level: 75, status: "verified" },
  { name: "Database Management (SQL)", level: 68, status: "claimed" },
  { name: "Operating Systems", level: 60, status: "claimed" },
  { name: "Web Development", level: 88, status: "verified" },
  { name: "Machine Learning Basics", level: 45, status: "claimed" },
  { name: "Computer Networks", level: 55, status: "claimed" },
  { name: "Mathematics & Probability", level: 70, status: "verified" },
];

const TIMELINE = [
  { date: "Aug 2024", event: "GitHub connector synced — 320 contributions", type: "connector" },
  { date: "Jul 2024", event: "NPTEL Python Certificate uploaded & verified", type: "verified" },
  { date: "Jun 2024", event: "SY Semester 3 results added (CGPA 8.7)", type: "academic" },
  { date: "May 2024", event: "Hackathon finalist — MITAOE TechFest", type: "achievement" },
  { date: "Mar 2024", event: "Learning State initialised", type: "milestone" },
];

const FACTS = [
  { label: "Verified Facts", value: 12, color: "green" },
  { label: "Claimed Facts", value: 8, color: "orange" },
  { label: "Pending Review", value: 3, color: "blue" },
];

export default function LearningStatePage() {
  const [tab, setTab] = useState<"overview" | "knowledge" | "timeline" | "export">("overview");

  // 3D Brain Adaptive State
  const [questionType, setQuestionType] = useState<QuestionType>("math");
  const [skillLevel, setSkillLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [metrics, setMetrics] = useState<StudentMetrics>({
    accuracy: 0.84,
    speed: 0.72,
    attempts: 1,
    conceptMastery: 0.80,
    skillLevel: "intermediate",
  });

  const handleQuestionTypeChange = (qt: QuestionType) => {
    setQuestionType(qt);
  };

  const handleSkillLevelChange = (lvl: "beginner" | "intermediate" | "advanced") => {
    setSkillLevel(lvl);
    setMetrics((prev) => ({
      ...prev,
      skillLevel: lvl,
    }));
  };

  const simulateNextAttempt = () => {
    const newAcc = Math.min(0.98, Math.max(0.4, metrics.accuracy + (Math.random() * 0.2 - 0.1)));
    const newSpeed = Math.min(0.95, Math.max(0.35, metrics.speed + (Math.random() * 0.2 - 0.1)));
    const newMastery = Math.min(0.99, Math.max(0.45, metrics.conceptMastery + 0.04));
    setMetrics({
      accuracy: parseFloat(newAcc.toFixed(2)),
      speed: parseFloat(newSpeed.toFixed(2)),
      attempts: metrics.attempts + 1,
      conceptMastery: parseFloat(newMastery.toFixed(2)),
      skillLevel: skillLevel,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#172033]">Your Learning State</h2>
          <p className="text-sm text-[#4B5A73] mt-0.5">
            A living AI model of your academic profile — updated in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-[#DCFCE7] text-[#15803D] font-bold px-3 py-1.5 border border-[#172033] flex items-center gap-1.5 shadow-[2px_2px_0_#172033]">
            <span className="w-2 h-2 bg-[#16A34A] rounded-full animate-pulse" />
            Live Synapse
          </span>
          <button className="flex items-center gap-2 text-sm font-bold text-[#172033] border-2 border-[#172033] hover:bg-[#DBEAFE] shadow-[3px_3px_0_#172033] hover:text-[#2563EB] px-4 py-2 transition-all">
            <FileText className="w-4 h-4" /> Export State
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-[#EFF6FF] border-2 border-[#172033] p-1 shadow-[3px_3px_0_#172033] w-fit max-w-full">
        {(["overview", "knowledge", "timeline", "export"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-bold transition-all duration-200 capitalize ${
              tab === t ? "bg-[#2563EB] text-white border-2 border-[#172033] shadow-[2px_2px_0_#172033]" : "text-[#4B5A73] hover:text-[#172033]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* Score + 3D Brain Visualization Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="col-span-1 lg:col-span-2 bg-white border-2 border-[#172033] shadow-[5px_5px_0_#172033] p-5 sm:p-6 flex flex-col justify-between">
              {/* Header with Title and Live Pill */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-[#172033] flex items-center gap-2">
                      <Brain className="w-5 h-5 text-[#2563EB]" />
                      Cognitive Neural Activity Map
                    </h3>
                    <span className="text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 border border-[#86EFAC] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full animate-ping" />
                      Live Model
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Real-time 3D visualization of active lobes, neural pathways, and cognitive load
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="text-right">
                    <div className="text-2xl font-black text-[#2563EB] leading-none">
                      {Math.round(metrics.accuracy * 100)}
                      <span className="text-xs font-semibold text-[#64748B]"> / 100</span>
                    </div>
                    <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">State Score</div>
                  </div>
                </div>
              </div>

              {/* 3D Brain Canvas Container */}
              <div className="w-full h-[320px] sm:h-[380px] bg-[#070A17] border-2 border-[#172033] relative overflow-hidden shadow-[inset_0_0_45px_rgba(8,145,178,0.12),inset_0_0_90px_rgba(217,70,239,0.06)] mb-4">
                {/* Top Badges */}
                <div className="absolute left-3 top-3 z-10 flex items-center gap-2 pointer-events-none">
                  <span className="text-[10px] font-bold text-[#67e8f9] border border-[#164e63] bg-[#0b1224] px-2 py-0.5 shadow-[0_0_14px_rgba(34,211,238,0.18)]">
                    3D NEURAL MODEL
                  </span>
                  <span className="text-[10px] font-bold text-[#f0abfc] border border-[#86198f] bg-[#24102b] px-2 py-0.5 shadow-[0_0_14px_rgba(240,171,252,0.18)]">
                    LOD OPTIMIZED · 60 FPS
                  </span>
                </div>

                {/* 3D Brain Canvas Component */}
                <BrainVisualization
                  questionType={questionType}
                  metrics={metrics}
                  showOverlay={true}
                  className="w-full h-full"
                />
              </div>

              {/* Cognitive Controls: Question Type & Simulation Bar */}
              <div className="space-y-3 pt-3 border-t-2 border-[#E2E8F0]">
                {/* Question Type Filter Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-[#172033] mr-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                      Question Domain:
                    </span>
                    {[
                      { id: "math", label: "📐 Math & Logic" },
                      { id: "verbal", label: "📚 Verbal & Lang" },
                      { id: "spatial", label: "🧩 Spatial & 3D" },
                      { id: "memory", label: "🧠 Memory Recall" },
                      { id: "logic", label: "⚡ Analytical Deduction" },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleQuestionTypeChange(id as QuestionType)}
                        className={`px-3 py-1.5 text-xs font-bold border-2 border-[#172033] transition-all ${
                          questionType === id
                            ? "bg-[#2563EB] text-white shadow-[2px_2px_0_#172033]"
                            : "bg-white text-[#172033] hover:bg-[#EFF6FF]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Simulate Attempt Action */}
                  <button
                    type="button"
                    onClick={simulateNextAttempt}
                    className="px-3.5 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] border-2 border-[#172033] text-xs font-bold shadow-[2px_2px_0_#172033] flex items-center gap-1.5 shrink-0 transition-all active:translate-x-0.5 active:translate-y-0.5"
                    title="Simulate student solving next problem"
                  >
                    <Activity className="w-3.5 h-3.5 text-[#2563EB] animate-pulse" />
                    Simulate Next Attempt
                  </button>
                </div>

                {/* Skill Level & Live Metric Indicators */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-[#F8FBFF] p-2.5 border border-[#CBD5E1]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#64748B]">Student Focus Mode:</span>
                    {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handleSkillLevelChange(lvl)}
                        className={`px-2.5 py-0.5 text-[11px] font-bold uppercase transition-all ${
                          skillLevel === lvl
                            ? "bg-[#172033] text-white"
                            : "bg-white text-[#64748B] hover:text-[#172033] border border-[#CBD5E1]"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-[#64748B]">
                    <span>Accuracy: <strong className="text-[#172033]">{Math.round(metrics.accuracy * 100)}%</strong></span>
                    <span>Speed: <strong className="text-[#172033]">{Math.round(metrics.speed * 100)}%</strong></span>
                    <span>Mastery: <strong className="text-[#172033]">{Math.round(metrics.conceptMastery * 100)}%</strong></span>
                    <span>Attempt: <strong className="text-[#2563EB]">#{metrics.attempts}</strong></span>
                  </div>
                </div>

                <div className="text-[11px] text-[#64748B] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span>💡 <strong>Orbit Controls:</strong> Drag to rotate 360° · Scroll to zoom · Hover over any lobe to inspect real-time neural activation</span>
                  <span className="text-[10px] text-[#2563EB] font-mono">Synced with Learning State</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {FACTS.map(({ label, value, color }) => (
                <div key={label} className="bg-white border-2 border-[#172033] shadow-[3px_3px_0_#172033] p-4">
                  <div className={`text-2xl font-black ${color === "green" ? "text-[#15803D]" : color === "orange" ? "text-[#2563EB]" : "text-[#2563EB]"}`}>
                    {value}
                  </div>
                  <div className="text-sm text-[#4B5A73] mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="bg-white border-2 border-[#172033] shadow-[5px_5px_0_#172033] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-[#172033]">Profile Dimensions</h3>
              <span className="text-xs text-[#64748B]">Click any dimension to focus brain activation</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: BookOpen, label: "Academic", score: 84, color: "indigo", qType: "math" as QuestionType },
                { icon: Code2, label: "Technical", score: 72, color: "blue", qType: "logic" as QuestionType },
                { icon: Award, label: "Extra-curricular", score: 68, color: "violet", qType: "spatial" as QuestionType },
                { icon: Globe, label: "Language", score: 90, color: "green", qType: "verbal" as QuestionType },
              ].map(({ icon: Icon, label, score, color, qType }) => (
                <div
                  key={label}
                  onClick={() => handleQuestionTypeChange(qType)}
                  className={`text-center p-3 border-2 cursor-pointer transition-all hover:scale-105 ${
                    questionType === qType
                      ? "border-[#2563EB] bg-[#EFF6FF] shadow-[3px_3px_0_#2563EB]"
                      : "border-[#E2E8F0] hover:border-[#172033] hover:shadow-[3px_3px_0_#172033]"
                  }`}
                >
                  <div className={`w-12 h-12 mx-auto flex items-center justify-center mb-2 ${
                    color === "indigo" ? "bg-[#DBEAFE] text-[#2563EB]" :
                    color === "blue" ? "bg-[#DBEAFE] text-[#2563EB]" :
                    color === "violet" ? "bg-[#DBEAFE] text-[#2563EB]" :
                    "bg-[#DCFCE7] text-[#15803D]"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-lg font-black text-[#172033]">{score}</div>
                  <div className="text-xs text-[#4B5A73]">{label}</div>
                  <div className="mt-2 h-1.5 bg-[#E5E7EB] overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${score}%`,
                        backgroundColor:
                          color === "green" ? "#22C55E" : "#60A5FA",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Tab */}
      {tab === "knowledge" && (
        <div className="bg-white border-2 border-[#172033] shadow-[5px_5px_0_#172033] p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-[#172033]">Knowledge Base</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-[#15803D] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
              <span className="flex items-center gap-1.5 text-[#2563EB] font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> Claimed
              </span>
            </div>
          </div>
          <div className="space-y-4">
            {KNOWLEDGE_AREAS.map(({ name, level, status }) => (
              <div key={name} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-[#172033] truncate pr-2">{name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5  ${
                        status === "verified"
                          ? "bg-[#DCFCE7] text-[#15803D]"
                          : "bg-[#DBEAFE] text-[#2563EB]"
                      }`}>
                        {status}
                      </span>
                      <span className="text-sm font-black text-[#172033] w-8 text-right">{level}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-[#E5E7EB] overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${level}%`,
                        backgroundColor:
                          status === "verified" ? "#60A5FA" : "#60A5FA",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {tab === "timeline" && (
        <div className="bg-white border-2 border-[#172033] shadow-[5px_5px_0_#172033] p-6">
          <h3 className="font-black text-[#172033] mb-5">Learning State Timeline</h3>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[#E5E7EB]" />
            <div className="space-y-5">
              {TIMELINE.map(({ date, event, type }) => (
                <div key={event} className="flex gap-4 relative">
                  <div className={`w-10 h-10  flex items-center justify-center flex-shrink-0 z-10 ${
                    type === "verified" ? "bg-[#DCFCE7] text-[#15803D]" :
                    type === "connector" ? "bg-[#DBEAFE] text-[#2563EB]" :
                    type === "academic" ? "bg-[#DBEAFE] text-[#2563EB]" :
                    type === "achievement" ? "bg-[#DBEAFE] text-[#2563EB]" :
                    "bg-[#E5E7EB] text-[#4B5A73]"
                  }`}>
                    {type === "verified" ? <CheckCircle2 className="w-4 h-4" /> :
                     type === "connector" ? <Link2 className="w-4 h-4" /> :
                     type === "achievement" ? <Star className="w-4 h-4" /> :
                     type === "academic" ? <BookOpen className="w-4 h-4" /> :
                     <Zap className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 pt-1.5">
                    <p className="text-sm font-medium text-[#172033]">{event}</p>
                    <p className="text-xs text-[#718096] mt-0.5">{date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Export Tab */}
      {tab === "export" && (
        <div className="bg-white border-2 border-[#172033] shadow-[5px_5px_0_#172033] p-6">
          <h3 className="font-black text-[#172033] mb-2">Export Your Learning State</h3>
          <p className="text-sm text-[#4B5A73] mb-6">
            Your full Learning State (raw data) is ~400–500 MB. A compressed, human-readable export is available immediately.
            The full export will be emailed to you.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Compressed Summary", desc: "JSON — shareable, AI-readable format", icon: BarChart3, btn: "Download Now" },
              { label: "Full Raw Export", desc: "Complete data — email delivery (~10 min)", icon: FileText, btn: "Request Export" },
            ].map(({ label, desc, icon: Icon, btn }) => (
              <div key={label} className="border-2 border-[#172033] shadow-[4px_4px_0_#172033] p-5">
                <div className="w-10 h-10 bg-[#DBEAFE]  flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-[#2563EB]" />
                </div>
                <h4 className="font-bold text-[#172033] text-sm mb-1">{label}</h4>
                <p className="text-xs text-[#718096] mb-4">{desc}</p>
                <button className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold py-2.5  transition-colors">
                  {btn}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
