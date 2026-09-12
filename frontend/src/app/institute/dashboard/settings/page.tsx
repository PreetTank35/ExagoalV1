"use client";

import { useState } from "react";
import {
  Database,
  Link2,
  CheckCircle2,
  Shield,
  Bell,
  RefreshCw,
  Trash2,
  Globe,
} from "lucide-react";

const ERP_STEPS = [
  {
    n: 1,
    label: "Paste your ERP Base URL",
    input: "url",
  },
  {
    n: 2,
    label: "Generate API Token in ERP Admin → API Settings",
  },
  {
    n: 3,
    label: "Paste token & grant read permissions",
    input: "token",
  },
  {
    n: 4,
    label: "Confirm & sync student data",
  },
];

const INSTITUTE_DETAILS = [
  {
    label: "Institute Name",
    value: "MIT Academy of Engineering",
  },
  {
    label: "Type",
    value: "University / Autonomous",
  },
  {
    label: "Affiliation",
    value: "Savitribai Phule Pune University",
  },
  {
    label: "City, State",
    value: "Pune, Maharashtra",
  },
  {
    label: "ExaGo Plan",
    value: "Pro — NEP Compliant",
  },
  {
    label: "Account Since",
    value: "August 2024",
  },
];

const ACCESS_CONTROL = [
  {
    label: "Student can edit their own profile",
    enabled: true,
  },
  {
    label: "Teachers can upload course documents",
    enabled: true,
  },
  {
    label: "Teachers can generate exam drafts",
    enabled: false,
  },
  {
    label: "Sub-admins can verify student data",
    enabled: true,
  },
  {
    label: "Student input window (global)",
    enabled: true,
  },
];

const NOTIFICATIONS = [
  {
    label: "New student onboarding requests",
    enabled: true,
  },
  {
    label: "Verification queue updates",
    enabled: true,
  },
  {
    label: "ERP sync alerts",
    enabled: false,
  },
  {
    label: "Exam generated successfully",
    enabled: true,
  },
];

export default function SettingsPage() {
  const [erpConnected, setErpConnected] = useState(false);
  const [erpUrl, setErpUrl] = useState("");
  const [erpToken, setErpToken] = useState("");
  const [expandERP, setExpandERP] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl text-[#172033]">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563EB] mb-1">
          Institute Administration
        </p>

        <h2 className="text-3xl font-black text-[#172033]">
          Settings
        </h2>

        <p className="text-sm text-[#64748B] mt-1">
          Manage institute preferences, ERP integration, and access control
        </p>
      </div>

      {/* Institute Details */}
      <div className="bg-white border-2 border-[#172033] shadow-[5px_5px_0_#172033] p-6">
        <h3 className="font-black text-[#172033] mb-5 flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#2563EB]" />
          Institute Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {INSTITUTE_DETAILS.map(({ label, value }) => (
            <div key={label}>
              <label className="block text-xs font-bold text-[#64748B] mb-1">
                {label}
              </label>

              <input
                defaultValue={value}
                className="w-full px-3 py-2.5 border-2 border-[#CBD5E1] bg-[#F8FBFF] text-sm font-medium text-[#172033] outline-none focus:border-[#172033]"
              />
            </div>
          ))}
        </div>

        <button
          className="mt-5 text-sm font-black text-[#172033] border-2 border-[#172033] bg-[#DBEAFE] px-4 py-2.5 shadow-[3px_3px_0_#172033] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
        >
          Save Changes
        </button>
      </div>

      {/* ERP Integration */}
      <div className="bg-white border-2 border-[#172033] shadow-[5px_5px_0_#172033] p-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3 className="font-black text-[#172033] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#2563EB]" />
            ERP Integration
          </h3>

          <span
            className={`text-xs font-black px-2.5 py-1 border-2 ${
              erpConnected
                ? "bg-[#DCFCE7] text-[#15803D] border-[#15803D]"
                : "bg-[#E2E8F0] text-[#64748B] border-[#94A3B8]"
            }`}
          >
            {erpConnected ? "Connected" : "Not Connected"}
          </span>
        </div>

        <p className="text-sm text-[#64748B] mb-4 leading-6">
          Connect your institution's existing ERP to auto-import student
          records, academic data, and extracurricular tracking. Supported:
          Fedena, TrackAcad, College ERP, custom REST APIs.
        </p>

        <button
          onClick={() => setExpandERP(!expandERP)}
          className="flex items-center gap-2 text-sm font-black text-[#2563EB] hover:text-[#172033] mb-4"
        >
          <Link2 className="w-4 h-4" />
          {erpConnected
            ? "Manage ERP Connection"
            : "Connect ERP System"}
        </button>

        {expandERP && (
          <div className="space-y-4 border-2 border-[#CBD5E1] bg-[#F8FBFF] p-4">
            {ERP_STEPS.map(({ n, label, input }) => (
              <div key={n} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 border-2 border-[#172033] bg-[#2563EB] text-[#172033] text-xs font-black flex items-center justify-center flex-shrink-0">
                    {n}
                  </div>

                  <span className="text-sm font-bold text-[#172033]">
                    {label}
                  </span>
                </div>

                {input === "url" && (
                  <input
                    type="url"
                    value={erpUrl}
                    onChange={(e) => setErpUrl(e.target.value)}
                    placeholder="https://erp.yourinstitute.ac.in"
                    className="w-full px-3 py-2.5 border-2 border-[#CBD5E1] bg-white text-sm text-[#172033] outline-none focus:border-[#172033]"
                    style={{ width: "calc(100% - 2rem)" }}
                  />
                )}

                {input === "token" && (
                  <input
                    type="password"
                    value={erpToken}
                    onChange={(e) => setErpToken(e.target.value)}
                    placeholder="Paste API token"
                    className="w-full px-3 py-2.5 border-2 border-[#CBD5E1] bg-white text-sm text-[#172033] outline-none focus:border-[#172033]"
                  />
                )}
              </div>
            ))}

            <div className="flex gap-2 pt-2 flex-wrap">
              <button
                onClick={() => setErpConnected(true)}
                className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] border-2 border-[#172033] text-[#172033] text-sm font-black px-4 py-2.5 shadow-[3px_3px_0_#172033] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Test & Connect
              </button>

              {erpConnected && (
                <button
                  onClick={() => setErpConnected(false)}
                  className="flex items-center gap-2 text-sm font-black text-red-600 border-2 border-red-600 bg-red-50 hover:bg-red-100 px-4 py-2.5 shadow-[3px_3px_0_#172033] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Disconnect
                </button>
              )}
            </div>
          </div>
        )}

        {erpConnected && (
          <div className="flex items-center gap-2 mt-4 text-xs font-bold text-[#166534] bg-[#DCFCE7] border-2 border-[#15803D] px-3 py-2.5">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />

            <span>
              ERP connected — Last synced: Today 8:30 AM · 1,248 students
            </span>

            <button className="ml-auto flex items-center gap-1 font-black hover:text-[#172033]">
              <RefreshCw className="w-3 h-3" />
              Sync Now
            </button>
          </div>
        )}
      </div>

      {/* Access Control */}
      <div className="bg-white border-2 border-[#172033] shadow-[5px_5px_0_#172033] p-6">
        <h3 className="font-black text-[#172033] mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#2563EB]" />
          Access Control
        </h3>

        <div className="space-y-0">
          {ACCESS_CONTROL.map(({ label, enabled }, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b-2 border-[#E2E8F0] last:border-0 gap-4"
            >
              <span className="text-sm text-[#334155]">
                {label}
              </span>

              <div
                className={`w-11 h-6 border-2 border-[#172033] relative flex-shrink-0 ${
                  enabled ? "bg-[#2563EB]" : "bg-[#E2E8F0]"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white border-2 border-[#172033] absolute top-0.5 transition-all ${
                    enabled ? "left-5" : "left-0.5"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white border-2 border-[#172033] shadow-[5px_5px_0_#172033] p-6">
        <h3 className="font-black text-[#172033] mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#2563EB]" />
          Notification Preferences
        </h3>

        <div className="space-y-0">
          {NOTIFICATIONS.map(({ label, enabled }, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b-2 border-[#E2E8F0] last:border-0 gap-4"
            >
              <span className="text-sm text-[#334155]">
                {label}
              </span>

              <div
                className={`w-11 h-6 border-2 border-[#172033] relative flex-shrink-0 ${
                  enabled ? "bg-[#2563EB]" : "bg-[#E2E8F0]"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white border-2 border-[#172033] absolute top-0.5 transition-all ${
                    enabled ? "left-5" : "left-0.5"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
