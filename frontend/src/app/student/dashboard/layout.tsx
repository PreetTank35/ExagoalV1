"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Brain,
  MessageCircle,
  Gamepad2,
  CalendarCheck2,
  Bell,
  Settings,
  LogOut,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  User,
  Menu,
  X,
  PanelLeftOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  {
    href: "/student/dashboard/learning-state",
    icon: Brain,
    label: "Learning State",
  },
  {
    href: "/student/dashboard/guru",
    icon: MessageCircle,
    label: "AI Guru",
  },
  {
    href: "/student/dashboard/planning",
    icon: CalendarCheck2,
    label: "Planning",
  },
  {
    href: "/student/dashboard/activities",
    icon: Gamepad2,
    label: "Activities",
  },
];

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [notifCount] = useState(3);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const currentPage =
    NAV_ITEMS.find((n) => n.href === pathname)?.label ?? "Dashboard";

  return (
    <div className="flex min-h-screen bg-[#F4F8FF] font-[Poppins] text-[#172033]">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-[#172033]/40 z-30 lg:hidden transition-opacity duration-300"
        />
      )}

      <aside
        className={`
          ${sidebarCollapsed ? "lg:w-20" : "lg:w-60"}
          w-60 flex-shrink-0 bg-white border-r-2 border-[#172033]
          flex flex-col fixed top-0 left-0 h-full z-40
          transition-all duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Sidebar Header */}
        <div
          className={`px-4 py-5 border-b-2 border-[#172033] flex items-center ${
            sidebarCollapsed ? "lg:justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-[#2563EB] border-2 border-[#172033] shadow-[3px_3px_0_#172033] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>

            <span
              className={`text-[#172033] font-black text-base truncate ${
                sidebarCollapsed ? "lg:hidden" : ""
              }`}
            >
              ExaGo
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 border-2 border-transparent hover:border-[#172033] hover:bg-[#DBEAFE] transition-colors"
            title="Close sidebar"
          >
            <X className="w-4 h-4 text-[#2563EB]" />
          </button>
        </div>

        {/* Desktop Hide / Show Button */}
        <button
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          className="
            hidden lg:flex
            absolute top-1/2 -translate-y-1/2 -right-[15px]
            w-7 h-10
            bg-[#2563EB]
            border-2 border-[#172033]
            shadow-[3px_3px_0_#172033]
            items-center justify-center
            z-50
            hover:bg-[#1D4ED8]
            active:translate-x-[2px]
            active:shadow-[1px_1px_0_#172033]
            transition-all
          "
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-white" strokeWidth={3} />
          ) : (
            <ChevronLeft className="w-4 h-4 text-white" strokeWidth={3} />
          )}
        </button>

        {/* Student Profile */}
        <div
          className={`mx-3 mt-4 p-3 bg-[#DBEAFE] border-2 border-[#172033] shadow-[3px_3px_0_#172033] ${
            sidebarCollapsed ? "lg:px-2 lg:flex lg:justify-center" : ""
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#2563EB] border-2 border-[#172033] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              JP
            </div>

            <div
              className={`min-w-0 ${sidebarCollapsed ? "lg:hidden" : ""}`}
            >
              <p className="text-sm font-black text-[#172033] truncate">
                Jayesh Patil
              </p>

              <p className="text-xs text-[#4B5A73] truncate">
                B.Tech · SY · MIT AOE
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p
            className={`text-[10px] font-black text-[#2563EB] uppercase tracking-wider px-2 mb-2 ${
              sidebarCollapsed ? "lg:text-center lg:px-0" : ""
            }`}
          >
            {sidebarCollapsed ? "•••" : "Main Menu"}
          </p>

          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 border-2 transition-all duration-150 ${
                  sidebarCollapsed ? "lg:justify-center lg:px-2" : ""
                } ${
                  active
                    ? "bg-[#2563EB] border-[#172033] text-white font-black shadow-[3px_3px_0_#172033]"
                    : "border-transparent text-[#4B5A73] font-bold hover:bg-[#EFF6FF] hover:border-[#172033] hover:text-[#172033]"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />

                <span
                  className={`flex-1 ${
                    sidebarCollapsed ? "lg:hidden" : ""
                  }`}
                >
                  {label}
                </span>

                {active && !sidebarCollapsed && (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-3 pb-4 space-y-1 border-t-2 border-[#172033] pt-3">
          <button
            title={sidebarCollapsed ? "Settings" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 border-2 border-transparent text-sm font-bold text-[#4B5A73] hover:bg-[#EFF6FF] hover:border-[#172033] hover:text-[#172033] w-full transition-colors ${
              sidebarCollapsed ? "lg:justify-center lg:px-2" : ""
            }`}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />

            <span className={sidebarCollapsed ? "lg:hidden" : ""}>
              Settings
            </span>
          </button>

          <button
            onClick={() => {
              setSidebarOpen(false);
              router.push("/login");
            }}
            title={sidebarCollapsed ? "Logout" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 border-2 border-transparent text-sm font-bold text-[#4B5A73] hover:bg-red-50 hover:border-red-600 hover:text-red-600 w-full transition-colors ${
              sidebarCollapsed ? "lg:justify-center lg:px-2" : ""
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />

            <span className={sidebarCollapsed ? "lg:hidden" : ""}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-60"
        }`}
      >
        {/* Top Header */}
        <header className="bg-white border-b-2 border-[#172033] px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 border-2 border-transparent hover:border-[#172033] hover:bg-[#DBEAFE] transition-colors"
              title="Open sidebar"
            >
              <Menu className="w-5 h-5 text-[#2563EB]" />
            </button>

            <div>
              <h1 className="text-base font-black text-[#172033]">
                {currentPage}
              </h1>

              <p className="text-xs text-[#718096]">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 border-2 border-transparent hover:border-[#172033] hover:bg-[#DBEAFE] transition-colors">
              <Bell className="w-4 h-4 text-[#2563EB]" />

              {notifCount > 0 && (
                <span className="absolute top-0 right-0 min-w-4 h-4 px-0.5 bg-[#2563EB] border-2 border-[#172033] text-[8px] font-black text-white flex items-center justify-center">
                  {notifCount}
                </span>
              )}
            </button>

            <button className="p-2 border-2 border-transparent hover:border-[#172033] hover:bg-[#DBEAFE] transition-colors">
              <User className="w-4 h-4 text-[#2563EB]" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}