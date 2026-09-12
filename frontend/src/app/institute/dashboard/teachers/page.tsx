 "use client";

import { useState } from "react";
import {
  Plus,
  BookOpen,
  Mail,
  Phone,
  Shield,
  Trash2,
  Edit2,
} from "lucide-react";

const TEACHERS = [
  {
    id: 1,
    name: "Prof. Anil Sharma",
    subject: "Data Structures & Algorithms",
    email: "sharma@mitaoe.ac.in",
    phone: "+91 98765 00001",
    role: "Subject Head",
    docsUploaded: 4,
  },
  {
    id: 2,
    name: "Dr. Meena Kulkarni",
    subject: "Database Management Systems",
    email: "mkulkarni@mitaoe.ac.in",
    phone: "+91 98765 00002",
    role: "Faculty",
    docsUploaded: 2,
  },
  {
    id: 3,
    name: "Prof. Raj Joshi",
    subject: "Operating Systems",
    email: "rjoshi@mitaoe.ac.in",
    phone: "+91 98765 00003",
    role: "Faculty",
    docsUploaded: 1,
  },
  {
    id: 4,
    name: "Dr. Sunita Patil",
    subject: "Machine Learning",
    email: "spatil@mitaoe.ac.in",
    phone: "+91 98765 00004",
    role: "HOD",
    docsUploaded: 6,
  },
  {
    id: 5,
    name: "Prof. Vikram Desai",
    subject: "Computer Networks",
    email: "vdesai@mitaoe.ac.in",
    phone: "+91 98765 00005",
    role: "Faculty",
    docsUploaded: 2,
  },
];

const ROLE_STYLE: Record<string, string> = {
  HOD: "bg-[#DBEAFE] text-[#2563EB] border-[#172033]",
  "Subject Head": "bg-[#EFF6FF] text-[#2563EB] border-[#172033]",
  Faculty: "bg-[#F1F5F9] text-[#64748B] border-[#172033]",
};

export default function TeachersPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6 text-[#172033]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563EB] mb-1">
            Institute Faculty
          </p>

          <h2 className="text-3xl font-black text-[#172033]">
            Teachers
          </h2>

          <p className="text-sm text-[#64748B] mt-1">
            {TEACHERS.length} faculty members · Manage subjects and permissions
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white border-2 border-[#172033] text-sm font-black px-4 py-2.5 shadow-[4px_4px_0_#172033] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Teacher
        </button>
      </div>

      {/* Add Form (collapsible) */}
      {showForm && (
        <div className="bg-white border-2 border-[#172033] shadow-[5px_5px_0_#172033] p-6 max-w-lg">
          <h3 className="font-black text-[#172033] mb-4">
            Add New Teacher
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Full Name",
                placeholder: "Prof. Anil Sharma",
                col: 2,
              },
              {
                label: "Email",
                placeholder: "faculty@institute.edu",
              },
              {
                label: "Phone",
                placeholder: "+91 98765 43210",
              },
              {
                label: "Subject",
                placeholder: "Data Structures",
              },
              {
                label: "Role",
                placeholder: "HOD / Subject Head / Faculty",
              },
            ].map(({ label, placeholder, col }) => (
              <div
                key={label}
                className={col === 2 ? "col-span-2" : ""}
              >
                <label className="block text-xs font-bold text-[#64748B] mb-1">
                  {label}
                </label>

                <input
                  type="text"
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 border-2 border-[#CBD5E1] bg-[#F8FBFF] text-sm text-[#172033] outline-none focus:border-[#2563EB]"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-5">
            <button className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] border-2 border-[#172033] text-white text-sm font-black py-2.5 shadow-[3px_3px_0_#172033] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              Add Teacher
            </button>

            <button
              onClick={() => setShowForm(false)}
              className="px-4 text-sm font-bold text-[#64748B] hover:text-[#172033] border-2 border-[#CBD5E1] bg-white hover:bg-[#EFF6FF] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Teacher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {TEACHERS.map(
          ({
            id,
            name,
            subject,
            email,
            phone,
            role,
            docsUploaded,
          }) => (
            <div
              key={id}
              className="bg-white border-2 border-[#172033] shadow-[5px_5px_0_#172033] p-5 hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_#172033] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-[#DBEAFE] border-2 border-[#172033] flex items-center justify-center text-[#2563EB] font-black text-sm flex-shrink-0">
                    {name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#172033]">
                      {name}
                    </p>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 border-2 ${
                        ROLE_STYLE[role] || ROLE_STYLE.Faculty
                      }`}
                    >
                      {role}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button className="p-1.5 border-2 border-transparent hover:border-[#172033] hover:bg-[#EFF6FF] transition-colors">
                    <Edit2 className="w-3.5 h-3.5 text-[#64748B]" />
                  </button>

                  <button className="p-1.5 border-2 border-transparent hover:border-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-[#64748B] hover:text-red-600" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#64748B] mb-3">
                <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="font-bold text-[#334155]">
                  {subject}
                </span>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                  <Mail className="w-3 h-3 text-[#2563EB]" />
                  {email}
                </div>

                <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                  <Phone className="w-3 h-3 text-[#2563EB]" />
                  {phone}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t-2 border-[#E2E8F0] gap-3">
                <div className="flex items-center gap-1 text-xs text-[#94A3B8]">
                  <BookOpen className="w-3 h-3 text-[#2563EB]" />
                  <span>
                    {docsUploaded} course documents uploaded
                  </span>
                </div>

                <button className="flex items-center gap-1 text-xs font-black text-[#2563EB] hover:text-[#172033]">
                  <Shield className="w-3 h-3" />
                  Permissions
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}