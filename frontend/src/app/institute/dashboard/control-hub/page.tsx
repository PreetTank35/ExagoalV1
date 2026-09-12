"use client";

import { useEffect, useState } from "react";
import { Gauge, SlidersHorizontal, ShieldCheck, Save, RotateCcw } from "lucide-react";
import { getApiBaseUrl, safeFetchJson } from "@/lib/api";

type Config = {
  profile: string;
  difficulty: { easy: number; medium: number; hard: number };
  bloom_levels: string[];
  question_types: { subjective: number; numerical: number; mcq: number };
  co_mapping: boolean;
  po_mapping: boolean;
  cross_disciplinary: boolean;
  formative_mode: boolean;
  no_duplicate_topics: boolean;
  balanced_marks: boolean;
  require_diagram: boolean;
  min_hard_questions: number;
  time_minutes: number;
  max_diagrams: number;
  temperature: number;
  top_p: number;
  max_tokens: number;
};

const DEFAULT_CONFIG: Config = {
  profile: "standard",
  difficulty: { easy: 30, medium: 50, hard: 20 },
  bloom_levels: ["remember", "understand", "apply", "analyze"],
  question_types: { subjective: 60, numerical: 25, mcq: 15 },
  co_mapping: true,
  po_mapping: true,
  cross_disciplinary: true,
  formative_mode: false,
  no_duplicate_topics: true,
  balanced_marks: true,
  require_diagram: false,
  min_hard_questions: 1,
  time_minutes: 180,
  max_diagrams: 3,
  temperature: 0.7,
  top_p: 0.9,
  max_tokens: 4000,
};

const api = getApiBaseUrl();

export default function ControlHubPage() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [status, setStatus] = useState("Loading configuration...");
  const instituteId = "default-institute";

  useEffect(() => {
    safeFetchJson<{ config: Config }>(`${api}/api/institute/config?institute_id=${instituteId}`).then((res) => {
      if (res.ok && res.data?.config) setConfig({ ...DEFAULT_CONFIG, ...res.data.config });
      setStatus(res.ok ? "Live configuration loaded" : "Using local defaults");
    });
  }, []);

  const update = (patch: Partial<Config>) => setConfig((current) => ({ ...current, ...patch }));
  const updateDifficulty = (key: keyof Config["difficulty"], value: number) =>
    setConfig((current) => ({ ...current, difficulty: { ...current.difficulty, [key]: value } }));
  const updateQuestionType = (key: keyof Config["question_types"], value: number) =>
    setConfig((current) => ({ ...current, question_types: { ...current.question_types, [key]: value } }));
  const toggleBloom = (level: string) =>
    setConfig((current) => ({
      ...current,
      bloom_levels: current.bloom_levels.includes(level)
        ? current.bloom_levels.filter((item) => item !== level)
        : [...current.bloom_levels, level],
    }));

  const save = async () => {
    setStatus("Saving configuration...");
    const res = await safeFetchJson(`${api}/api/institute/config?institute_id=${instituteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    });
    setStatus(res.ok ? "Saved to institute configuration" : res.error || "Save failed");
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="bg-gradient-to-br from-[#20165c] to-[#4b126f] text-white border-2 border-[#172033] shadow-[5px_5px_0_#172033] p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200 font-bold">Trust & Transparency · No-Code Configuration</p>
            <h1 className="text-3xl font-black mt-2">Control Hub</h1>
            <p className="text-sm text-indigo-100 mt-1 max-w-2xl">Set exam difficulty, cognitive levels, course outcomes, question mix, safety guardrails, and AI behavior without writing JSON or code.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-bold">● LIVE CONFIG</span>
        </div>
      </div>

      <section className="bg-white border-2 border-slate-200 p-5 shadow-sm">
        <h2 className="font-black flex items-center gap-2"><Gauge className="w-4 h-4 text-indigo-600" /> Exam Profile</h2>
        <div className="grid md:grid-cols-4 gap-3 mt-4">
          {["foundational", "standard", "advanced", "mastery"].map((profile) => (
            <button key={profile} onClick={() => update({ profile })} className={`text-left p-4 border-2 ${config.profile === profile ? "border-indigo-500 bg-indigo-50 shadow-[3px_3px_0_#6366f1]" : "border-slate-200"}`}>
              <span className="capitalize font-bold">{profile}</span>
              <p className="text-xs text-slate-500 mt-2">{profile === "foundational" ? "Recall and basic problem solving" : profile === "mastery" ? "Research-grade synthesis" : profile === "advanced" ? "Analytical multi-step reasoning" : "Balanced undergraduate assessment"}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white border-2 border-slate-200 p-5 shadow-sm">
        <h2 className="font-black flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-indigo-600" /> Difficulty Distribution</h2>
        <div className="grid md:grid-cols-3 gap-5 mt-5">
          {(["easy", "medium", "hard"] as const).map((key) => (
            <label key={key} className="space-y-2 block">
              <div className="flex justify-between text-sm font-bold capitalize"><span>{key}</span><span>{config.difficulty[key]}%</span></div>
              <input type="range" min="0" max="100" value={config.difficulty[key]} onChange={(e) => updateDifficulty(key, Number(e.target.value))} className="w-full accent-indigo-600" />
            </label>
          ))}
        </div>
      </section>

      <section className="bg-white border-2 border-slate-200 p-5 shadow-sm">
        <h2 className="font-black">Bloom&apos;s Taxonomy Levels</h2>
        <div className="flex flex-wrap gap-2 mt-4">
          {[["remember", "L1"], ["understand", "L2"], ["apply", "L3"], ["analyze", "L4"], ["evaluate", "L5"], ["create", "L6"]].map(([level, code]) => (
            <button key={level} onClick={() => toggleBloom(level)} className={`px-4 py-2 border-2 text-xs font-bold capitalize ${config.bloom_levels.includes(level) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200"}`}>{level} <span className="opacity-70">{code}</span></button>
          ))}
        </div>
      </section>

      <section className="bg-white border-2 border-slate-200 p-5 shadow-sm">
        <h2 className="font-black">Question Type Distribution</h2>
        <div className="grid md:grid-cols-3 gap-5 mt-5">
          {(["subjective", "numerical", "mcq"] as const).map((key) => (
            <label key={key} className="space-y-2 block"><div className="flex justify-between text-sm font-bold capitalize"><span>{key}</span><span>{config.question_types[key]}%</span></div><input type="range" min="0" max="100" value={config.question_types[key]} onChange={(e) => updateQuestionType(key, Number(e.target.value))} className="w-full accent-purple-600" /></label>
          ))}
        </div>
      </section>

      <section className="bg-white border-2 border-slate-200 p-5 shadow-sm">
        <h2 className="font-black flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-600" /> Alignment & Guardrails</h2>
        <div className="grid md:grid-cols-2 gap-3 mt-4">
          {([["co_mapping", "Course Objective mapping"], ["po_mapping", "Program Outcome mapping"], ["cross_disciplinary", "Cross-disciplinary integration"], ["formative_mode", "Formative assessment mode"], ["no_duplicate_topics", "Prevent duplicate topics"], ["balanced_marks", "Balance marks distribution"], ["require_diagram", "Require visual diagram"]] as const).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between border border-slate-200 p-3 text-sm font-semibold"><span>{label}</span><input type="checkbox" checked={config[key]} onChange={(e) => update({ [key]: e.target.checked })} className="w-5 h-5 accent-indigo-600" /></label>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <label className="text-sm font-semibold">Minimum hard questions<input type="number" min="0" max="25" value={config.min_hard_questions} onChange={(e) => update({ min_hard_questions: Number(e.target.value) })} className="mt-1 w-full border-2 border-slate-200 p-2" /></label>
          <label className="text-sm font-semibold">Time allocation (minutes)<input type="number" min="15" max="600" value={config.time_minutes} onChange={(e) => update({ time_minutes: Number(e.target.value) })} className="mt-1 w-full border-2 border-slate-200 p-2" /></label>
          <label className="text-sm font-semibold">Maximum diagrams<input type="number" min="0" max="10" value={config.max_diagrams} onChange={(e) => update({ max_diagrams: Number(e.target.value) })} className="mt-1 w-full border-2 border-slate-200 p-2" /></label>
        </div>
      </section>

      <section className="bg-white border-2 border-slate-200 p-5 shadow-sm">
        <h2 className="font-black">Advanced AI Parameters</h2>
        <div className="grid md:grid-cols-3 gap-5 mt-5">
          {([["temperature", "Temperature", 0, 1, 0.1], ["top_p", "Top-P", 0, 1, 0.05], ["max_tokens", "Max Tokens", 1000, 8000, 500]] as const).map(([key, label, min, max, step]) => (
            <label key={key} className="text-sm font-semibold">{label}: {config[key as keyof Config] as number}<input type="range" min={min} max={max} step={step} value={config[key as keyof Config] as number} onChange={(e) => update({ [key]: Number(e.target.value) })} className="mt-2 w-full accent-indigo-600" /></label>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between border-t-2 border-slate-200 pt-4"><span className="text-xs text-slate-500">{status}</span><div className="flex gap-2"><button onClick={() => setConfig(DEFAULT_CONFIG)} className="px-4 py-2 border-2 border-slate-300 text-sm font-bold flex gap-2 items-center"><RotateCcw className="w-4 h-4" /> Reset</button><button onClick={save} className="px-5 py-2 bg-indigo-600 text-white text-sm font-bold flex gap-2 items-center"><Save className="w-4 h-4" /> Save Configuration</button></div></div>
    </div>
  );
}
