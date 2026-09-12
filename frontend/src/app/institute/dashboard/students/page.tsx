"use client";
import { useState } from "react";
import {
  Search, Plus, Upload, CheckCircle2, AlertCircle,
  Clock, Filter, Download, Eye, MoreHorizontal,
  GraduationCap, Trash2, ChevronDown
} from "lucide-react";

type VerifyStatus = "verified" | "pending" | "unverified";

const STUDENTS = [
  { id: 1, name: "Jayesh Patil", rollNo: "CS2401", course: "B.Tech CSE", year: "SY", stateScore: 84, status: "verified" as VerifyStatus, joined: "Aug 2024" },
  { id: 2, name: "Priya Deshmukh", rollNo: "CS2402", course: "B.Tech CSE", year: "SY", stateScore: 78, status: "verified" as VerifyStatus, joined: "Aug 2024" },
  { id: 3, name: "Rahul Kulkarni", rollNo: "CS2403", course: "B.Tech CSE", year: "SY", stateScore: 62, status: "pending" as VerifyStatus, joined: "Aug 2024" },
  { id: 4, name: "Sneha Joshi", rollNo: "CS2404", course: "B.Tech CSE", year: "SY", stateScore: 90, status: "verified" as VerifyStatus, joined: "Aug 2024" },
  { id: 5, name: "Amol Shinde", rollNo: "CS2405", course: "B.Tech CSE", year: "SY", stateScore: 55, status: "unverified" as VerifyStatus, joined: "Aug 2024" },
  { id: 6, name: "Kavya Rao", rollNo: "CS2406", course: "B.Tech CSE", year: "TY", stateScore: 71, status: "pending" as VerifyStatus, joined: "Jul 2023" },
  { id: 7, name: "Rohan Mehta", rollNo: "CS2407", course: "B.Tech IT", year: "FY", stateScore: 45, status: "unverified" as VerifyStatus, joined: "Aug 2024" },
];

const STATUS_STYLE: Record<VerifyStatus, string> = {
  verified: "bg-[#DCFCE7] text-[#15803D] border-[#172033]",
  pending: "bg-[#FEF3C7] text-[#92400E] border-[#172033]",
  unverified: "bg-[#F1F5F9] text-[#64748B] border-[#172033]",
};

const STATUS_ICON: Record<VerifyStatus, React.ElementType> = {
  verified: CheckCircle2,
  pending: Clock,
  unverified: AlertCircle,
};

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | VerifyStatus>("all");
  const [inputWindowOpen, setInputWindowOpen] = useState(true);
  const [tab, setTab] = useState<"list" | "add" | "bulk">("list");

  const filtered = STUDENTS.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6 text-[#172033]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#172033]">Student Management</h2>
          <p className="text-sm text-[#64748B] mt-1">{STUDENTS.length} students enrolled · {STUDENTS.filter(s => s.status === "pending").length} pending verification</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Input Window Toggle */}
          <div className={`flex items-center gap-2 px-3 py-2 border-2 border-[#172033] text-sm font-black transition-all shadow-[3px_3px_0_#172033] ${inputWindowOpen ? "bg-[#DCFCE7] border-[#172033] text-[#15803D]" : "bg-[#F1F5F9] border-[#172033] text-[#64748B]"}`}>
            <div className={`w-2 h-2  ${inputWindowOpen ? "bg-[#2563EB]" : "bg-[#94A3B8]"}`} />
            <span>Student Input {inputWindowOpen ? "Open" : "Closed"}</span>
            <button
              onClick={() => setInputWindowOpen(!inputWindowOpen)}
              className={`ml-1 w-9 h-5 border-2 border-[#172033] relative transition-all ${inputWindowOpen ? "bg-[#2563EB]" : "bg-[#E2E8F0]"}`}
            >
              <div className={`w-3.5 h-3.5 bg-white border-2 border-[#172033] absolute top-0.5 transition-all ${inputWindowOpen ? "left-4" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-[#DBEAFE] p-1 border-2 border-[#172033] w-fit max-w-full">
        {([
          { key: "list", label: "Student List" },
          { key: "add", label: "+ Add Student" },
          { key: "bulk", label: "⬆ Bulk Import" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 border-2 border-transparent text-sm font-black transition-all duration-200 ${tab === key ? "bg-[#2563EB] text-[#172033] border-[#172033] shadow-[2px_2px_0_#172033]" : "text-[#64748B] hover:text-[#172033]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Student List */}
      {tab === "list" && (
        <div className="bg-white border-2 border-[#172033] shadow-[5px_5px_0_#172033] overflow-hidden">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b-2 border-[#172033]">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or roll no…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border-2 border-[#CBD5E1] bg-[#F8FBFF] text-sm text-[#172033] outline-none focus:border-[#172033]"
              />
            </div>
            <div className="flex flex-wrap gap-1 bg-[#F8FBFF] p-0.5 border-2 border-[#CBD5E1] w-full sm:w-auto justify-start">
              {(["all", "verified", "pending", "unverified"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`px-3 py-1.5 border-2 border-transparent text-xs font-black capitalize transition-all ${filterStatus === f ? "bg-[#2563EB] text-[#172033] border-[#172033] shadow-[2px_2px_0_#172033]" : "text-gray-500"}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 text-sm font-medium text-[#172033] font-black border-2 border-[#172033] bg-white px-3 py-2 shadow-[2px_2px_0_#172033] hover:bg-[#DBEAFE] transition-colors w-full sm:w-auto justify-center">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#EFF6FF] border-b-2 border-[#172033]">
                  <th className="text-left px-5 py-3 text-xs font-black text-[#64748B] uppercase tracking-wide">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-black text-[#64748B] uppercase tracking-wide">Roll No</th>
                  <th className="text-left px-4 py-3 text-xs font-black text-[#64748B] uppercase tracking-wide">Course</th>
                  <th className="text-left px-4 py-3 text-xs font-black text-[#64748B] uppercase tracking-wide">State Score</th>
                  <th className="text-left px-4 py-3 text-xs font-black text-[#64748B] uppercase tracking-wide">Verification</th>
                  <th className="text-left px-4 py-3 text-xs font-black text-[#64748B] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#F1F5F9]">
                {filtered.map(({ id, name, rollNo, course, year, stateScore, status }) => {
                  const Icon = STATUS_ICON[status];
                  return (
                    <tr key={id} className="hover:bg-[#F8FBFF] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#DBEAFE] border-2 border-[#172033] flex items-center justify-center text-[#2563EB] font-black text-xs flex-shrink-0">
                            {name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#172033]">{name}</p>
                            <p className="text-xs text-[#94A3B8]">{year}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[#334155]">{rollNo}</td>
                      <td className="px-4 py-3.5 text-sm text-[#334155]">{course}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#E2E8F0] border border-[#172033] overflow-hidden w-16">
                            <div className="h-full bg-[#2563EB]" style={{ width: `${stateScore}%` }} />
                          </div>
                          <span className="text-sm font-black text-[#172033]">{stateScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 border-2 ${STATUS_STYLE[status]}`}>
                          <Icon className="w-3 h-3" /> {status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 border-2 border-transparent hover:border-[#172033] hover:bg-[#DBEAFE] transition-colors" title="View profile">
                            <Eye className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#2563EB]" />
                          </button>
                          {status !== "verified" && (
                            <button className="p-1.5 border-2 border-transparent hover:border-[#172033] hover:bg-[#DCFCE7] transition-colors" title="Verify">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#15803D]" />
                            </button>
                          )}
                          <button className="p-1.5 border-2 border-transparent hover:border-red-600 hover:bg-red-50 transition-colors" title="Remove">
                            <Trash2 className="w-3.5 h-3.5 text-[#94A3B8] hover:text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-[#94A3B8]">
                <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No students found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Student */}
      {tab === "add" && (
        <div className="bg-white border-2 border-[#172033] shadow-[5px_5px_0_#172033] p-6 max-w-lg">
          <h3 className="font-black text-[#172033] mb-4">Add Student Manually</h3>
          <div className="space-y-3">
            {[
              { label: "Full Name", placeholder: "Jayesh Patil" },
              { label: "Roll Number", placeholder: "CS2401" },
              { label: "Email", placeholder: "jayesh@college.edu" },
              { label: "Course", placeholder: "B.Tech Computer Engineering" },
              { label: "Year", placeholder: "2nd Year (SY)" },
            ].map(({ label, placeholder }) => (
              <div key={label}>
                <label className="block text-sm font-bold text-[#64748B] mb-1.5">{label}</label>
                <input
                  type="text"
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 border-2 border-[#CBD5E1] bg-[#F8FBFF] text-sm text-[#172033] outline-none focus:border-[#172033]"
                />
              </div>
            ))}
            <button className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] border-2 border-[#172033] text-[#172033] text-sm font-black py-2.5 shadow-[3px_3px_0_#172033] transition-all mt-2 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </div>
        </div>
      )}

      {/* Bulk Import */}
      {tab === "bulk" && (
        <div className="space-y-4 max-w-lg">
          <div className="bg-white border-2 border-[#172033] shadow-[5px_5px_0_#172033] p-6">
            <h3 className="font-bold text-gray-900 mb-2">Bulk Import via Excel / CSV</h3>
            <p className="text-sm text-[#64748B] mb-4">
              Download the template, fill in student data, and upload the file. OCR is supported for scanned sheets.
            </p>
            <div className="flex gap-3 mb-5">
              <button className="flex items-center gap-2 text-sm font-black text-[#172033] border-2 border-[#172033] bg-[#DBEAFE] hover:bg-[#BFDBFE] px-4 py-2 shadow-[3px_3px_0_#172033] transition-all">
                <Download className="w-4 h-4" /> Download Template
              </button>
            </div>
            <div className="border-2 border-dashed border-[#172033] hover:border-[#2563EB] p-10 text-center cursor-pointer transition-colors hover:bg-[#EFF6FF]">
              <Upload className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#334155]">Click to upload .xlsx or .csv</p>
              <p className="text-xs text-[#94A3B8] mt-1">Max 5MB · Up to 2000 rows</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200  p-4">
            <p className="text-sm text-amber-900 font-bold">
              ⚠️ You can also connect your ERP system for automatic imports from the Institute Settings page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
