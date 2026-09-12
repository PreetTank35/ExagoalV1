"use client";

import { useState } from "react";
import {
  Gamepad2,
  Brain,
  Music,
  Puzzle,
  BookOpen,
  Star,
  Clock,
  ArrowRight,
  Zap,
} from "lucide-react";

type Tab = "suggested" | "mind-games" | "learning";

const ACTIVITIES = [
  {
    id: 1,
    tab: "suggested",
    title: "Chess Puzzles",
    category: "Strategy",
    icon: Puzzle,
    color: "indigo",
    desc: "Recommended based on your chess hobby. Tactical puzzles to sharpen pattern recognition — directly benefits your DSA problem solving.",
    time: "15–20 min",
    impact: "Logic & Pattern Recognition",
    link: "https://chess.com/puzzles",
  },
  {
    id: 2,
    tab: "suggested",
    title: "Competitive Coding Sprint",
    category: "Technical",
    icon: Zap,
    color: "blue",
    desc: "A 30-min LeetCode sprint tailored to your weak areas — arrays and graph problems.",
    time: "30 min",
    impact: "DSA & Problem Solving",
    link: "https://leetcode.com",
  },
  {
    id: 3,
    tab: "suggested",
    title: "Open Source Contribution",
    category: "Technical",
    icon: BookOpen,
    color: "green",
    desc: "Find a good-first-issue on GitHub in a Python repo. Contributes directly to your Learning State GitHub score.",
    time: "1–2 hours",
    impact: "GitHub Connector + Technical Score",
    link: "https://goodfirstissue.dev",
  },
  {
    id: 4,
    tab: "mind-games",
    title: "Sudoku Blitz",
    category: "Mind Game",
    icon: Brain,
    color: "violet",
    desc: "Fast-paced Sudoku to train numerical logic. Not brain rot — builds concentration.",
    time: "10 min",
    impact: "Cognitive Speed",
    link: "#",
  },
  {
    id: 5,
    tab: "mind-games",
    title: "Word Association Game",
    category: "Mind Game",
    icon: Star,
    color: "orange",
    desc: "Build vocabulary across technical and general domains. Good for language-heavy exams.",
    time: "5–10 min",
    impact: "Vocabulary + Language State",
    link: "#",
  },
  {
    id: 6,
    tab: "mind-games",
    title: "Memory Matrix",
    category: "Mind Game",
    icon: Puzzle,
    color: "blue",
    desc: "Short-term memory training. Scientifically linked to better exam recall.",
    time: "5 min",
    impact: "Working Memory",
    link: "#",
  },
  {
    id: 7,
    tab: "learning",
    title: "MIT OpenCourseWare — Algorithms",
    category: "Academic",
    icon: BookOpen,
    color: "indigo",
    desc: "Free MIT lecture on algorithm design. Aligns with your DSA goal and 82% score.",
    time: "45 min",
    impact: "DSA Knowledge Base",
    link: "https://ocw.mit.edu",
  },
  {
    id: 8,
    tab: "learning",
    title: "Kaggle Intro to ML Course",
    category: "Academic",
    icon: Brain,
    color: "green",
    desc: "Hands-on ML basics. Directly addresses your weakest area (45%) — structured and free.",
    time: "2–3 hours",
    impact: "ML Knowledge Base +20",
    link: "https://kaggle.com/learn",
  },
];

const COLORMAP: Record<string, string> = {
  indigo: "bg-[#DBEAFE] text-[#2563EB] border-[#172033]",
  blue: "bg-[#DBEAFE] text-[#2563EB] border-[#172033]",
  green: "bg-[#DCFCE7] text-[#15803D] border-[#172033]",
  violet: "bg-[#DBEAFE] text-[#2563EB] border-[#172033]",
  orange: "bg-[#DBEAFE] text-[#2563EB] border-[#172033]",
};

export default function ActivitiesPage() {
  const [tab, setTab] = useState<Tab>("suggested");

  const filtered = ACTIVITIES.filter((a) => a.tab === tab);

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 overflow-x-hidden">
      <div className="min-w-0">
        <h2 className="text-2xl font-extrabold text-[#172033]">
          Activities
        </h2>

        <p className="text-sm text-[#4B5A73] mt-0.5">
          Curated based on your Learning State — not brain rot, just growth 🌱
        </p>
      </div>

      <div className="w-full max-w-full overflow-x-auto">
        <div className="flex gap-1 bg-[#EFF6FF] p-1 border-2 border-[#172033] shadow-[3px_3px_0_0_#172033] w-fit max-w-full">
          {(
            [
              { key: "suggested", label: "🎯 Suggested For You" },
              { key: "mind-games", label: "🧩 Mind Games" },
              { key: "learning", label: "📚 Learning Resources" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-bold whitespace-nowrap transition-all ${
                tab === key
                  ? "bg-[#2563EB] text-white border-2 border-[#172033] shadow-[2px_2px_0_0_#172033]"
                  : "text-[#4B5A73] hover:bg-white hover:text-[#172033]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full min-w-0 bg-[#EFF6FF] border-2 border-[#172033] shadow-[3px_3px_0_0_#172033] px-4 py-3 flex items-start gap-2.5">
        <Gamepad2 className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" />

        <p className="text-sm text-[#4B5A73] font-medium leading-relaxed min-w-0">
          Every activity you complete contributes to your Learning State.
          Completing 3+ activities this week unlocks a badge.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full min-w-0">
        {filtered.map(
          ({
            id,
            title,
            category,
            icon: Icon,
            color,
            desc,
            time,
            impact,
            link,
          }) => (
            <div
              key={id}
              className="w-full min-w-0 bg-white border-2 border-[#172033] shadow-[4px_4px_0_0_#172033] p-5 hover:bg-[#F8FBFF] transition-all group flex flex-col"
            >
              <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                <div
                  className={`w-10 h-10 flex-shrink-0 flex items-center justify-center border-2 ${COLORMAP[color]}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <span className="text-xs font-bold bg-[#EFF3F8] text-[#4B5A73] border-2 border-[#172033] px-2.5 py-1 whitespace-nowrap">
                  {category}
                </span>
              </div>

              <h4 className="text-sm font-extrabold text-[#172033] mb-1 break-words">
                {title}
              </h4>

              <p className="text-xs text-[#4B5A73] leading-relaxed flex-1 min-w-0 break-words">
                {desc}
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 pt-3 border-t-2 border-[#172033] min-w-0">
                <div className="flex items-center gap-1 text-xs text-[#718096] flex-shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {time}
                </div>

                <div className="flex items-center gap-1 text-xs text-[#2563EB] font-bold flex-1 min-w-0">
                  <Star className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="break-words">{impact}</span>
                </div>

                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] group-hover:gap-1.5 transition-all flex-shrink-0"
                >
                  Start
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          )
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-[#718096]">
          <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No activities in this category yet.</p>
        </div>
      )}
    </div>
  );
}
