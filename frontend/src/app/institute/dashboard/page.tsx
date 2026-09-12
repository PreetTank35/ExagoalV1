"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  FileText,
  Cpu,
  ArrowRight,
  Database,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const STATS = [
  {
    label: "Total Students",
    value: "1,248",
    change: "+12 this week",
    icon: GraduationCap,
    color: "teal",
  },
  {
    label: "Verified Data Points",
    value: "8,432",
    change: "92% accuracy",
    icon: CheckCircle2,
    color: "green",
  },
  {
    label: "Pending Verifications",
    value: "34",
    change: "Action needed",
    icon: AlertCircle,
    color: "amber",
  },
  {
    label: "Active Teachers",
    value: "86",
    change: "Across 24 subjects",
    icon: Users,
    color: "blue",
  },
];

const RECENT_ACTIVITY = [
  {
    text: "Jayesh Patil submitted Learning State profile",
    time: "2h ago",
    type: "student",
  },
  {
    text: "Prof. Sharma uploaded DSA course objectives",
    time: "3h ago",
    type: "doc",
  },
  {
    text: "14 marksheets pending verification",
    time: "4h ago",
    type: "verify",
  },
  {
    text: "Batch CS-SY-A: Input window opened",
    time: "Yesterday",
    type: "access",
  },
  {
    text: "ERP sync completed — 120 students imported",
    time: "Yesterday",
    type: "erp",
  },
];

const COLORMAP: Record<string, string> = {
  teal: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  green: "bg-[#F0FDF4] text-green-700 border-[#BBF7D0]",
  amber: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
};

const ACTIVITY_COLORS: Record<string, string> = {
  student: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  doc: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  verify: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  access: "bg-[#F0FDF4] text-green-700 border-[#BBF7D0]",
  erp: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
};

export default function InstituteDashboardHome() {
  const ITEMS_PER_PAGE = 3;

  const [activityPage, setActivityPage] = useState(0);

  const totalPages = Math.ceil(
    RECENT_ACTIVITY.length / ITEMS_PER_PAGE
  );

  const startIndex = activityPage * ITEMS_PER_PAGE;

  const visibleActivities = RECENT_ACTIVITY.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const goToPrevious = () => {
    setActivityPage((current) =>
      current === 0 ? totalPages - 1 : current - 1
    );
  };

  const goToNext = () => {
    setActivityPage((current) =>
      current === totalPages - 1 ? 0 : current + 1
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE]  p-6 text-[#172033] shadow-[4px_4px_0px_#172033]">
        <p className="text-[#2563EB] text-sm font-bold uppercase tracking-wider mb-1">
          Institute Dashboard
        </p>

        <h2 className="text-2xl font-bold mb-1">
          Welcome, Dr. Sharma
        </h2>

        <p className="text-[#4B5A73] text-sm max-w-lg">
          34 student data points are pending verification. 3 exam
          generation requests are queued.
        </p>

        <div className="flex gap-3 mt-4">
          <Link
            href="/institute/dashboard/students"
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold px-4 py-2  border border-[#172033] shadow-[3px_3px_0px_#0f172a] transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Review Verifications
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/institute/dashboard/exam"
            className="flex items-center gap-2 bg-white hover:bg-[#EFF6FF] text-[#172033] text-sm font-semibold px-4 py-2  border border-[#172033] shadow-[3px_3px_0px_#0f172a] transition-all"
          >
            <Cpu className="w-4 h-4 text-[#2563EB]" />
            Generate Exam
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(
          ({ label, value, change, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-white  border border-[#172033] p-5 shadow-[4px_4px_0px_#172033]"
            >
              <div
                className={`w-10 h-10 border  flex items-center justify-center mb-3 ${COLORMAP[color]}`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="text-2xl font-bold text-[#172033]">
                {value}
              </div>

              <div className="text-sm font-semibold text-[#4B5A73] mt-0.5">
                {label}
              </div>

              <div className="text-xs text-[#718096] font-medium mt-1">
                {change}
              </div>
            </div>
          )
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="col-span-1 lg:col-span-2 bg-white  border border-[#172033] shadow-[4px_4px_0px_#172033] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
            <div>
              <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider mb-1">
                Activity Log
              </p>

              <h3 className="text-base font-bold text-[#172033]">
                Recent Activity
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#2563EB] font-semibold mr-1">
                View all
              </span>

              {/* Previous Button */}
              <button
                type="button"
                onClick={goToPrevious}
                aria-label="Previous recent activities"
                className="w-8 h-8 flex items-center justify-center border border-slate-300  bg-white text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB] hover:border-[#2563EB] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Next Button */}
              <button
                type="button"
                onClick={goToNext}
                aria-label="Next recent activities"
                className="w-8 h-8 flex items-center justify-center border border-teal-700  bg-white text-[#2563EB] hover:bg-[#2563EB] hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Activity Slider */}
          <div className="divide-y divide-slate-200">
            {visibleActivities.map(
              ({ text, time, type }) => (
                <div
                  key={text}
                  className="flex items-center gap-3 px-5 py-3.5"
                >
                  <div
                    className={`w-8 h-8  border flex items-center justify-center flex-shrink-0 ${ACTIVITY_COLORS[type]}`}
                  >
                    {type === "student" ? (
                      <GraduationCap className="w-4 h-4" />
                    ) : type === "doc" ? (
                      <FileText className="w-4 h-4" />
                    ) : type === "verify" ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : type === "erp" ? (
                      <Database className="w-4 h-4" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </div>

                  <span className="text-sm text-[#4B5A73] flex-1">
                    {text}
                  </span>

                  <span className="text-xs text-[#94A3B8] flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {time}
                  </span>
                </div>
              )
            )}
          </div>

          {/* Slider Indicators */}
          <div className="flex items-center justify-center gap-2 py-3 border-t border-[#E2E8F0]">
            {Array.from({ length: totalPages }).map(
              (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Go to activity slide ${index + 1}`}
                  onClick={() => setActivityPage(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    activityPage === index
                      ? "w-7 bg-[#2563EB]"
                      : "w-2 bg-slate-300 hover:bg-[#93C5FD]"
                  }`}
                />
              )
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          {/* Quick Actions */}
          <div className="bg-white  border border-[#172033] shadow-[4px_4px_0px_#172033] overflow-hidden">
            <div className="px-4 py-4 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-bold text-[#172033]">
                Quick Actions
              </h3>
            </div>

            <div className="divide-y divide-slate-200">
              {[
                {
                  label: "Bulk Import Students",
                  href: "/institute/dashboard/students",
                  icon: GraduationCap,
                },
                {
                  label: "Add Teacher",
                  href: "/institute/dashboard/teachers",
                  icon: Users,
                },
                {
                  label: "Upload Course Document",
                  href: "/institute/dashboard/documents",
                  icon: FileText,
                },
                {
                  label: "Generate New Exam",
                  href: "/institute/dashboard/exam",
                  icon: Cpu,
                },
              ].map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-[#4B5A73] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] transition-all group"
                >
                  <Icon className="w-4 h-4 text-[#2563EB]" />

                  {label}

                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-[#2563EB] group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          </div>

          {/* Learning State Health */}
          <div className="bg-[#172033]  border border-[#172033] p-4 shadow-[4px_4px_0px_#2563EB] text-white">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#93C5FD]" />
              Learning State Health
            </h3>

            <div className="space-y-3">
              {[
                {
                  label: "Avg State Score",
                  value: "72 / 100",
                  percent: 72,
                },
                {
                  label: "Fully Onboarded",
                  value: "1,140 students",
                  percent: 91,
                },
                {
                  label: "Connector Avg",
                  value: "4.2 per student",
                  percent: 70,
                },
                {
                  label: "Data Coverage",
                  value: "91%",
                  percent: 91,
                },
              ].map(({ label, value, percent }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#CBD5E1]">
                      {label}
                    </span>

                    <span className="font-semibold text-white">
                      {value}
                    </span>
                  </div>

                  <div className="h-1.5 bg-[#334155] border border-[#475569]">
                    <div
                      className="h-full bg-[#60A5FA]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}