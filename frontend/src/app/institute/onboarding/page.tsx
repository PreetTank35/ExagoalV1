"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowLeft, CheckCircle2, Building2, Users,
  Database, BookOpen, Link2, FileText, Cpu
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Institute Details" },
  { id: 2, label: "Admin Setup" },
  { id: 3, label: "ERP Connect" },
  { id: 4, label: "Review" },
];

const ERP_STEPS = [
  { step: 1, title: "Paste your ERP Base URL", desc: "The root URL of your institution's ERP system (e.g., https://erp.mitaoe.ac.in)" },
  { step: 2, title: "Generate API Token in ERP", desc: "In your ERP admin panel, navigate to API Settings → Create Token with read-only student access." },
  { step: 3, title: "Paste Token & Fetch Permissions", desc: "Paste the token here. ExaGo will request only: student list, academic records, and extracurricular data." },
  { step: 4, title: "Confirm & Sync", desc: "Review which data will be synced. Click Confirm to start the initial import — usually takes 2–5 minutes." },
];

export default function InstituteOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [erpExpanded, setErpExpanded] = useState<number | null>(1);

  const [form, setForm] = useState({
    instituteName: "", type: "", affiliation: "", city: "", state: "",
    adminName: "", adminEmail: "", adminPhone: "", adminRole: "",
    erpUrl: "", erpToken: "",
  });
  const updateForm = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const finish = () => router.push("/institute/dashboard");

  return (
    <div className="min-h-screen bg-[#F8FBFF] flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b-2 border-[#172033] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#2563EB] border-2 border-[#172033] shadow-[3px_3px_0_#172033] flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-[#172033] font-black text-lg">ExaGo</span>
          <span className="ml-2 text-xs bg-[#DBEAFE] text-[#1D4ED8] border-2 border-[#172033] font-black px-2 py-0.5">
            Institute Setup
          </span>
        </div>
        <button onClick={() => router.push("/login")} className="text-sm font-bold text-[#4B5A73] hover:text-[#172033]">
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
                    className={`w-10 h-10 border-2 border-[#172033] flex items-center justify-center text-sm font-black transition-all ${
                      step > s.id ? "bg-[#16A34A] text-white" :
                      step === s.id ? "bg-[#2563EB] text-[#172033]" : "bg-[#E2E8F0] text-[#4B5A73]"
                    }`}
                  >
                    {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-black ${step === s.id ? "text-[#1D4ED8]" : "text-[#718096]"} hidden sm:block`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 mb-4 ${step > s.id ? "bg-[#2563EB]" : "bg-[#CBD5E1]"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 h-2 bg-[#E2E8F0] border-2 border-[#172033] overflow-hidden">
            <div
              className="h-full bg-[#2563EB] transition-all duration-500"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-2xl bg-white border-2 border-[#172033] shadow-[6px_6px_0_#172033]">

          {/* Step 1: Institute Details */}
          {step === 1 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 bg-[#DBEAFE] border-2 border-[#172033] flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#1D4ED8]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#172033]">Institute Details</h2>
                  <p className="text-sm text-[#4B5A73]">Basic information about your institution</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "instituteName", label: "Institution Name", placeholder: "MIT Academy of Engineering", col: 2 },
                  { key: "type", label: "Type", placeholder: "University / College / School" },
                  { key: "affiliation", label: "Affiliation / Board", placeholder: "Savitribai Phule Pune University" },
                  { key: "city", label: "City", placeholder: "Pune" },
                  { key: "state", label: "State", placeholder: "Maharashtra" },
                ].map(({ key, label, placeholder, col }) => (
                  <div key={key} className={col === 2 ? "col-span-2" : ""}>
                    <label className="block text-sm font-bold text-[#4B5A73] mb-1.5">{label}</label>
                    <input
                      type="text"
                      value={form[key as keyof typeof form]}
                      onChange={(e) => updateForm(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-4 py-2.5 border-2 border-[#CBD5E1] bg-[#FFFFFF] text-sm text-[#172033] outline-none focus:border-[#172033] transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Admin Setup */}
          {step === 2 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 bg-[#DBEAFE] border-2 border-[#172033] flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#1D4ED8]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#172033]">Admin Account</h2>
                  <p className="text-sm text-[#4B5A73]">The primary administrator for your institution</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { key: "adminName", label: "Full Name", placeholder: "Dr. Suresh Sharma" },
                  { key: "adminEmail", label: "Official Email", placeholder: "principal@mitaoe.ac.in", type: "email" },
                  { key: "adminPhone", label: "Phone", placeholder: "+91 98765 43210", type: "tel" },
                  { key: "adminRole", label: "Designation", placeholder: "Principal / HOD / Exam Controller" },
                ].map(({ key, label, placeholder, type = "text" }) => (
                  <div key={key}>
                    <label className="block text-sm font-bold text-[#4B5A73] mb-1.5">{label}</label>
                    <input
                      type={type}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => updateForm(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-4 py-2.5 border-2 border-[#CBD5E1] bg-[#FFFFFF] text-sm text-[#172033] outline-none focus:border-[#172033] transition-all"
                    />
                  </div>
                ))}
                <div className="bg-[#EFF6FF] border-2 border-[#172033] p-4">
                  <p className="text-xs text-[#334155] font-bold">
                    You can add more admins, teachers, and sub-admins after completing setup from the Institute Dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: ERP Connect */}
          {step === 3 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 bg-[#DBEAFE] border-2 border-[#172033] flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-[#1D4ED8]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#172033]">ERP Integration</h2>
                  <p className="text-sm text-[#4B5A73]">Skip this if you don't have an ERP system — you can always import data manually</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6 mt-3">
                <Database className="w-4 h-4 text-[#1D4ED8]" />
                <span className="text-xs font-semibold text-[#1D4ED8]">Supported ERP systems: Fedena, TrackAcad, College ERP, custom REST APIs</span>
              </div>

              {/* Step-by-step guide */}
              <div className="space-y-3">
                {ERP_STEPS.map(({ step: s, title, desc }) => (
                  <div key={s} className="border-2 border-[#172033] overflow-hidden">
                    <button
                      onClick={() => setErpExpanded(erpExpanded === s ? null : s)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F8FBFF] transition-colors"
                    >
                      <div className={`w-8 h-8 border-2 border-[#172033] flex items-center justify-center text-xs font-black flex-shrink-0 ${
                        erpExpanded === s ? "bg-[#2563EB] text-[#172033]" : "bg-[#E2E8F0] text-[#4B5A73]"
                      }`}>
                        {s}
                      </div>
                      <span className="text-sm font-black text-[#172033] text-left flex-1">{title}</span>
                    </button>
                    {erpExpanded === s && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-[#4B5A73] mb-3 ml-10">{desc}</p>
                        {s === 1 && (
                          <div className="ml-10">
                            <input
                              type="url"
                              value={form.erpUrl}
                              onChange={(e) => updateForm("erpUrl", e.target.value)}
                              placeholder="https://erp.yourinstitute.ac.in"
                              className="w-full px-4 py-2.5 border border-[#CBD5E1]  text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#172033]"
                            />
                          </div>
                        )}
                        {s === 3 && (
                          <div className="ml-10">
                            <input
                              type="password"
                              value={form.erpToken}
                              onChange={(e) => updateForm("erpToken", e.target.value)}
                              placeholder="Paste API token here"
                              className="w-full px-4 py-2.5 border border-[#CBD5E1]  text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#172033]"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-3">
                <button className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] border-2 border-[#172033] text-[#172033] text-sm font-black py-2.5 shadow-[3px_3px_0_#172033] transition-all flex items-center justify-center gap-2">
                  <Link2 className="w-4 h-4" /> Test Connection
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="text-sm font-bold text-[#4B5A73] hover:text-[#172033] px-4"
                >
                  Skip for now →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#E4F3E3] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#15803D]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#172033]">Review & Activate</h2>
                  <p className="text-sm text-[#4B5A73]">Your institute account will be created on activation</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: "Institute Details",
                    items: [
                      { label: "Name", value: form.instituteName || "—" },
                      { label: "Type", value: form.type || "—" },
                      { label: "Location", value: `${form.city || "—"}, ${form.state || "—"}` },
                    ],
                  },
                  {
                    title: "Admin Account",
                    items: [
                      { label: "Admin", value: form.adminName || "—" },
                      { label: "Email", value: form.adminEmail || "—" },
                      { label: "Role", value: form.adminRole || "—" },
                    ],
                  },
                  {
                    title: "ERP Integration",
                    items: [{ label: "Status", value: form.erpUrl ? "Configured" : "Skipped" }],
                  },
                ].map(({ title, items }) => (
                  <div key={title} className="border-2 border-[#172033] overflow-hidden">
                    <div className="bg-[#F8FBFF] px-4 py-2.5 border-b border-[#CBD5E1]">
                      <span className="text-xs font-black text-[#4B5A73] uppercase tracking-wide">{title}</span>
                    </div>
                    <div className="divide-y-2 divide-[#F1F5F9]">
                      {items.map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-sm text-[#4B5A73]">{label}</span>
                          <span className="text-sm font-black text-[#172033]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="bg-[#DBEAFE] border-2 border-[#172033] p-4">
                  <p className="text-sm text-[#334155] font-bold">
                    🏫 Your institute dashboard will be activated immediately. You can begin adding students, teachers, and course documents right away.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between px-8 py-5 border-t-2 border-[#172033]">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : router.push("/login")}
              className="flex items-center gap-2 text-sm font-medium text-[#718096] hover:text-[#334155]"
            >
              <ArrowLeft className="w-4 h-4" /> {step === 1 ? "Back to Login" : "Previous"}
            </button>
            <div className="text-xs text-[#718096]">Step {step} of {STEPS.length}</div>
            {step < STEPS.length ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] border-2 border-[#172033] text-[#172033] text-sm font-black px-5 py-2.5 shadow-[3px_3px_0_#172033] transition-all"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                className="flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] border-2 border-[#172033] text-white text-sm font-black px-5 py-2.5 shadow-[3px_3px_0_#172033] transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Activate Institute
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
