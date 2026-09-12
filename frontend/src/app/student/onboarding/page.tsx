"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowLeft, CheckCircle2, User, BookOpen, Upload,
  Link2, ClipboardList, GitBranch, Share2, Code2, Award, Globe,
  FileText, Camera, X, BookMarked
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Academic Info" },
  { id: 2, label: "Background" },
  { id: 3, label: "Upload Docs" },
  { id: 4, label: "Connectors" },
  { id: 5, label: "Review" },
];

const CONNECTORS = [
  { id: "github", label: "GitHub", icon: GitBranch, desc: "Repos, contributions, streak" },
  { id: "linkedin", label: "LinkedIn", icon: Share2, desc: "Profile, endorsements" },
  { id: "leetcode", label: "LeetCode", icon: Code2, desc: "Problem solving rating" },
  { id: "certifications", label: "Coursera / NPTEL", icon: Award, desc: "Course certificates" },
  { id: "kaggle", label: "Kaggle", icon: Globe, desc: "Datasets, notebooks, rank" },
  { id: "hackerrank", label: "HackerRank", icon: Code2, desc: "Skill badges" },
  { id: "portfolio", label: "Portfolio Website", icon: Globe, desc: "Personal site / blog" },
  { id: "youtube", label: "YouTube / Content", icon: Globe, desc: "Creator profile" },
  { id: "twitter", label: "Social Media", icon: Globe, desc: "Public profile summary" },
  { id: "codechef", label: "CodeChef", icon: Code2, desc: "Competitive rating" },
];

export default function StudentOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [connected, setConnected] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Form state
  const [form, setForm] = useState({
    fullName: "", rollNo: "", institution: "", course: "", year: "",
    language: "", region: "", hobbies: "", interests: "",
  });

  const updateForm = (k: string, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleConnector = (id: string) =>
    setConnected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  const mockUpload = (name: string) =>
    setUploadedFiles((f) => [...f, name]);

  const removeFile = (name: string) =>
    setUploadedFiles((f) => f.filter((x) => x !== name));

  const finish = () => router.push("/student/dashboard");

  return (
    <div className="min-h-screen bg-[#F8FBFF] flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b-2 border-[#172033] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#2563EB] border-2 border-[#172033] shadow-[3px_3px_0_#172033] flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-[#172033] font-black text-lg">ExaGo</span>
          <span className="ml-2 text-xs bg-[#DBEAFE] text-[#1D4ED8] font-bold px-2 py-0.5 ">
            Student Setup
          </span>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="text-sm text-[#4B5A73] hover:text-[#334155]"
        >
          Exit
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center py-10 px-4">
        {/* Step Indicator */}
        <div className="w-full max-w-2xl mb-10">
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-10 border-2 border-[#172033] flex items-center justify-center text-sm font-black transition-all duration-300 ${
                      step > s.id
                        ? "bg-[#DCFCE7] text-white"
                        : step === s.id
                        ? "bg-[#2563EB] text-white"
                        : "bg-[#E2E8F0] text-[#4B5A73]"
                    }`}
                  >
                    {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-medium ${
                      step === s.id ? "text-[#1D4ED8]" : "text-[#718096]"
                    } hidden sm:block`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 mb-4 transition-all duration-300 ${
                      step > s.id ? "bg-[#2563EB]" : "bg-[#E2E8F0]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-[#E2E8F0] border-2 border-[#172033]  overflow-hidden">
            <div
              className="h-full bg-[#2563EB]  transition-all duration-500"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-2xl bg-white border-2 border-[#172033] shadow-[6px_6px_0_#172033]">
          {/* Step 1: Academic Info */}
          {step === 1 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#DBEAFE]  flex items-center justify-center">
                  <User className="w-5 h-5 text-[#1D4ED8]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#172033]">Academic Information</h2>
                  <p className="text-sm text-[#4B5A73]">Tell us about your academic background</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "fullName", label: "Full Name", placeholder: "Jayesh Patil", col: 2 },
                  { key: "rollNo", label: "Roll / Student ID", placeholder: "MIT2024001" },
                  { key: "institution", label: "Institution", placeholder: "MIT Academy of Engineering" },
                  { key: "course", label: "Course / Programme", placeholder: "B.Tech Computer Engineering" },
                  { key: "year", label: "Current Year", placeholder: "2nd Year (SY)", col: 2 },
                ].map(({ key, label, placeholder, col }) => (
                  <div key={key} className={col === 2 ? "col-span-2" : ""}>
                    <label className="block text-sm font-medium text-[#334155] mb-1.5">{label}</label>
                    <input
                      type="text"
                      value={form[key as keyof typeof form]}
                      onChange={(e) => updateForm(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-4 py-2.5 border-2 border-[#CBD5E1]  text-sm text-[#172033] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#172033] transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Background */}
          {step === 2 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#DBEAFE]  flex items-center justify-center">
                  <BookMarked className="w-5 h-5 text-[#1D4ED8]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#172033]">Personal Background</h2>
                  <p className="text-sm text-[#4B5A73]">Help us build your Learning State accurately</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: "language", label: "Preferred Language", placeholder: "e.g. Marathi, Hindi, English" },
                  { key: "region", label: "Region / State", placeholder: "e.g. Maharashtra, Pune" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-[#334155] mb-1.5">{label}</label>
                    <input
                      type="text"
                      value={form[key as keyof typeof form]}
                      onChange={(e) => updateForm(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-4 py-2.5 border-2 border-[#CBD5E1]  text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#172033] transition-all"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-1.5">Hobbies & Interests</label>
                  <textarea
                    rows={3}
                    value={form.hobbies}
                    onChange={(e) => updateForm("hobbies", e.target.value)}
                    placeholder="Chess, coding competitions, photography, music production…"
                    className="w-full px-4 py-2.5 border-2 border-[#CBD5E1]  text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#172033] transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-1.5">Academic Strengths / Goals</label>
                  <textarea
                    rows={3}
                    value={form.interests}
                    onChange={(e) => updateForm("interests", e.target.value)}
                    placeholder="I'm strong in Data Structures and want to pursue ML research…"
                    className="w-full px-4 py-2.5 border-2 border-[#CBD5E1]  text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#172033] transition-all resize-none"
                  />
                </div>

                <div className="bg-[#DBEAFE] border border-[#172033]  p-4">
                  <p className="text-xs text-[#1D4ED8] font-medium">
                    💡 This data is used to build your <strong>Learning State</strong> — a living AI model of your
                    academic profile. It stays private and is only visible to your institute admins.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Upload Docs */}
          {step === 3 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#DBEAFE]  flex items-center justify-center">
                  <Upload className="w-5 h-5 text-[#1D4ED8]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#172033]">Upload Documents</h2>
                  <p className="text-sm text-[#4B5A73]">Certificates, marksheets, awards — anything that represents you</p>
                </div>
              </div>

              {/* Upload Zone */}
              <div
                onClick={() => mockUpload(`Document_${uploadedFiles.length + 1}.pdf`)}
                className="border-2 border-dashed border-[#172033] hover:border-[#1D4ED8] hover:bg-[#DBEAFE]/30  p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 mb-4"
              >
                <div className="w-12 h-12 bg-[#F1F5F9]  flex items-center justify-center">
                  <Upload className="w-6 h-6 text-[#718096]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-[#334155]">Click to upload or drag and drop</p>
                  <p className="text-xs text-[#718096] mt-1">PDF, JPG, PNG up to 20MB · OCR will extract text automatically</p>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {[
                  { icon: FileText, label: "Marksheets" },
                  { icon: Award, label: "Certificates" },
                  { icon: Camera, label: "Scan Physical Docs" },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    onClick={() => mockUpload(`${label}_${uploadedFiles.length + 1}.jpg`)}
                    className="flex flex-col items-center gap-2 p-3 border-2 border-[#CBD5E1]  hover:border-[#172033] hover:bg-[#DBEAFE] transition-all text-sm text-[#4B5A73] hover:text-[#1D4ED8] font-medium"
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Uploaded files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#4B5A73] uppercase tracking-wide mb-2">Uploaded</p>
                  {uploadedFiles.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-3 bg-[#DCFCE7] border border-[#172033]  px-3 py-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#15803D] flex-shrink-0" />
                      <span className="text-sm text-[#15803D] flex-1">{f}</span>
                      <button onClick={() => removeFile(f)}>
                        <X className="w-3.5 h-3.5 text-[#15803D] hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Connectors */}
          {step === 4 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#DBEAFE]  flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-[#1D4ED8]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#172033]">Platform Connectors</h2>
                  <p className="text-sm text-[#4B5A73]">Connect your profiles — {connected.length} of 10+ connected</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CONNECTORS.map(({ id, label, icon: Icon, desc }) => (
                  <button
                    key={id}
                    onClick={() => toggleConnector(id)}
                    className={`flex items-center gap-3 p-4 border-2 text-left transition-all duration-200 ${
                      connected.includes(id)
                        ? "border-[#172033] bg-[#DBEAFE]"
                        : "border-[#CBD5E1] hover:border-[#172033] hover:bg-[#F8FBFF]"
                    }`}
                  >
                    <div
                      className={`w-9 h-9  flex items-center justify-center flex-shrink-0 ${
                        connected.includes(id) ? "bg-[#DBEAFE]" : "bg-[#F1F5F9]"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${connected.includes(id) ? "text-[#1D4ED8]" : "text-[#4B5A73]"}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-bold ${
                          connected.includes(id) ? "text-[#1D4ED8]" : "text-[#334155]"
                        }`}
                      >
                        {label}
                      </p>
                      <p className="text-xs text-[#718096] truncate">{desc}</p>
                    </div>
                    <div
                      className={`w-4 h-4  border-2 flex-shrink-0 ${
                        connected.includes(id) ? "bg-[#2563EB] border-[#172033]" : "border-[#172033]"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <p className="text-xs text-[#718096] mt-4 text-center">
                You can add more connectors anytime from your dashboard settings.
              </p>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#DCFCE7]  flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-[#15803D]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#172033]">Review & Submit</h2>
                  <p className="text-sm text-[#4B5A73]">Your Learning State will be initialised on submission</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: "Academic Info",
                    items: [
                      { label: "Name", value: form.fullName || "—" },
                      { label: "Institution", value: form.institution || "—" },
                      { label: "Course", value: form.course || "—" },
                    ],
                  },
                  {
                    title: "Background",
                    items: [
                      { label: "Language", value: form.language || "—" },
                      { label: "Region", value: form.region || "—" },
                    ],
                  },
                  {
                    title: "Documents Uploaded",
                    items: uploadedFiles.length > 0
                      ? uploadedFiles.map((f) => ({ label: f, value: "✓ Uploaded" }))
                      : [{ label: "No documents", value: "Skipped" }],
                  },
                  {
                    title: "Connectors",
                    items:
                      connected.length > 0
                        ? [{ label: "Connected", value: connected.join(", ") }]
                        : [{ label: "Connections", value: "None selected" }],
                  },
                ].map(({ title, items }) => (
                  <div key={title} className="border-2 border-[#CBD5E1]  overflow-hidden">
                    <div className="bg-[#F8FBFF] px-4 py-2.5 border-b-2 border-[#172033]">
                      <span className="text-xs font-black text-[#4B5A73] uppercase tracking-wide">{title}</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {items.map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between px-4 py-2.5 gap-4">
                          <span className="text-sm text-[#4B5A73]">{label}</span>
                          <span className="text-sm font-medium text-[#172033] text-right max-w-xs break-words">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="bg-[#DBEAFE] border border-[#172033]  p-4">
                  <p className="text-sm text-[#334155] font-medium">
                    🚀 Your Learning State will be initialised and your institute admin will be notified.
                    You can update your profile and add more data anytime from the dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between px-8 py-5 border-t border-[#CBD5E1]">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : router.push("/login")}
              className="flex items-center gap-2 text-sm font-medium text-[#4B5A73] hover:text-[#334155] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {step === 1 ? "Back to Login" : "Previous"}
            </button>

            <div className="text-xs text-[#718096]">Step {step} of {STEPS.length}</div>

            {step < STEPS.length ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] border-2 border-[#172033] text-[#172033] shadow-[3px_3px_0_#172033] text-sm font-bold px-5 py-2.5  transition-all"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-5 py-2.5  transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Submit & Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
