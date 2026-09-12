 "use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  Cpu,
  Settings,
  LogOut,
  Bell,
  ChevronRight,
  ChevronLeft,
  Building2,
  Menu,
  X,
  BookOpen,
  SlidersHorizontal,
} from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/institute/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/institute/dashboard/students",
    icon: GraduationCap,
    label: "Students",
  },
  {
    href: "/institute/dashboard/teachers",
    icon: Users,
    label: "Teachers",
  },
  {
    href: "/institute/dashboard/documents",
    icon: FileText,
    label: "Course Documents",
  },
  {
    href: "/institute/dashboard/exam",
    icon: Cpu,
    label: "Generate Exam",
  },
  {
    href: "/institute/dashboard/control-hub",
    icon: SlidersHorizontal,
    label: "Control Hub",
  },
  {
    href: "/institute/dashboard/settings",
    icon: Settings,
    label: "Settings",
  },
];

export default function InstituteDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [notifCount] = useState(5);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const currentPage =
    NAV_ITEMS.find((n) => n.href === pathname)?.label ?? "Dashboard";

  return (
    <div className="flex min-h-screen bg-[#F8FBFF] text-[#172033]">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-[#172033]/30 z-30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 bg-white border-r-2 border-[#172033] flex flex-col fixed top-0 left-0 h-full z-40 overflow-visible transition-all duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarCollapsed ? "w-20" : "w-64"}`}
      >
        {/* Brand */}
        <div
          className={`px-5 py-5 border-b-2 border-[#172033]/15 flex items-center ${
            sidebarCollapsed ? "justify-center px-3" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#2563EB] border-2 border-[#172033] shadow-[3px_3px_0_#172033] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>

            {!sidebarCollapsed && (
              <div>
                <span className="text-[#172033] font-extrabold text-base tracking-tight">
                  ExaGo
                </span>

                <div className="text-[10px] text-[#2563EB] font-extrabold uppercase tracking-[0.16em]">
                  Institute
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 border border-[#172033]/30 hover:bg-[#EFF6FF]"
          >
            <X className="w-4 h-4 text-[#172033]" />
          </button>
        </div>

        {/* Institute Card */}
        {!sidebarCollapsed && (
          <div className="mx-3 mt-5 p-3 bg-[#DBEAFE] border-2 border-[#172033] shadow-[3px_3px_0_#172033]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#BFDBFE] border border-[#2563EB] flex items-center justify-center text-[#2563EB] flex-shrink-0">
                <Building2 className="w-4 h-4" strokeWidth={2.2} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[#172033] truncate">
                  MIT AOE
                </p>

                <p className="text-xs text-[#4B5A73] truncate">
                  Dr. Suresh Sharma · Admin
                </p>
              </div>
            </div>
          </div>
        )}

        {sidebarCollapsed && (
          <div className="mx-3 mt-5 w-12 h-12 bg-[#DBEAFE] border-2 border-[#172033] shadow-[3px_3px_0_#172033] flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#2563EB]" strokeWidth={2.2} />
          </div>
        )}

        {/* Navigation */}
        <nav
          className={`flex-1 py-5 ${
            sidebarCollapsed ? "px-3" : "px-3"
          }`}
        >
          {!sidebarCollapsed && (
            <p className="text-[10px] font-extrabold text-[#2563EB] uppercase tracking-[0.18em] px-2 mb-3">
              Management
            </p>
          )}

          <div className="space-y-1.5">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
              const active = pathname === href;

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? label : undefined}
                  className={`group flex items-center ${
                    sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"
                  } py-2.5 text-sm font-bold border-2 transition-none ${
                    active
                      ? "bg-[#2563EB] text-white border-[#172033] shadow-[3px_3px_0_#172033]"
                      : "border-transparent text-[#172033] hover:bg-[#EFF6FF] hover:border-[#172033]/40"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      active ? "text-white" : "text-[#2563EB]"
                    }`}
                    strokeWidth={2.2}
                  />

                  {!sidebarCollapsed && (
                    <span className="flex-1">{label}</span>
                  )}

                  {active && !sidebarCollapsed && (
                    <ChevronRight
                      className="w-4 h-4 text-white"
                      strokeWidth={2.5}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Logout */}
        <div className="px-3 pb-4 border-t-2 border-[#172033]/15 pt-3">
          <button
            onClick={() => {
              setSidebarOpen(false);
              void createClient().auth.signOut().finally(() => router.push("/login"));
            }}
            title={sidebarCollapsed ? "Logout" : undefined}
            className={`flex items-center ${
              sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"
            } py-2.5 border-2 border-transparent text-sm font-bold text-[#172033] hover:bg-[#EFF6FF] hover:border-[#2563EB] hover:text-[#1D4ED8] w-full transition-none`}
          >
            <LogOut className="w-4 h-4" strokeWidth={2.2} />
            {!sidebarCollapsed && "Logout"}
          </button>
        </div>

        {/* Desktop Hide / Show Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          className="hidden lg:flex absolute top-1/2 -right-5 -translate-y-1/2 w-9 h-12 bg-[#2563EB] border-2 border-[#172033] shadow-[3px_3px_0_#172033] items-center justify-center hover:bg-[#1D4ED8] hover:translate-x-0.5 transition-all z-[60]"
        >
          {sidebarCollapsed ? (
            <ChevronRight
              className="w-5 h-5 text-white"
              strokeWidth={3}
            />
          ) : (
            <ChevronLeft
              className="w-5 h-5 text-white"
              strokeWidth={3}
            />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {/* Topbar */}
        <header className="bg-white border-b-2 border-[#172033]/20 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 border-2 border-transparent hover:bg-[#EFF6FF] hover:border-[#172033]"
            >
              <Menu className="w-5 h-5 text-[#2563EB]" strokeWidth={2.2} />
            </button>

            <div>
              <h1 className="text-base font-extrabold text-[#172033]">
                {currentPage}
              </h1>

              <p className="text-xs text-[#64748B]">
                MIT Academy of Engineering ·{" "}
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 border-2 border-transparent hover:bg-[#EFF6FF] hover:border-[#172033]">
              <Bell className="w-4 h-4 text-[#2563EB]" strokeWidth={2.2} />

              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-[#2563EB] border border-[#172033] text-white text-[9px] font-extrabold flex items-center justify-center">
                  {notifCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <div className="w-9 h-9 bg-[#2563EB] border-2 border-[#172033] shadow-[2px_2px_0_#172033] flex items-center justify-center text-white text-xs font-extrabold">
              SS
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}