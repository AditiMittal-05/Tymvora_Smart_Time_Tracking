import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, FolderKanban, Activity, CheckSquare,
  BarChart3, TrendingUp, ChevronLeft, ClipboardList, Timer,
  Shield, CalendarDays, UserCog, Briefcase, Building2,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/auth.store";

export function Sidebar({ open, onToggle }) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "super_admin";
  const isApprover = user?.can_approve_timesheets === true;

  const navSections = [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "Timesheets",
      items: [
        { label: "My Timesheets", path: "/timesheets", icon: ClipboardList },
        { label: "Log Time", path: "/timesheets/entry", icon: Timer },
        { label: "Weekly View", path: "/timesheets/weekly", icon: FolderKanban },
      ],
    },
    ...(isApprover ? [{
      label: "Approvals",
      items: [
        { label: "Team Approvals", path: "/approvals", icon: CheckSquare },
      ],
    }] : []),
    {
      label: "Insights",
      items: [
        { label: "Reports", path: "/reports", icon: BarChart3 },
        { label: "Analytics", path: "/analytics", icon: TrendingUp },
      ],
    },
    ...(isSuperAdmin ? [{
      label: "Administration",
      items: [
        { label: "User Management", path: "/users", icon: Users },
        { label: "Manager Setup", path: "/manager-setup", icon: UserCog },
        { label: "Projects", path: "/projects", icon: FolderKanban },
        { label: "Activities", path: "/activities", icon: Activity },
        { label: "Holiday Management", path: "/holidays", icon: CalendarDays },
        { label: "Designation Master", path: "/designation-master", icon: Briefcase },
        { label: "Department Master", path: "/department-master", icon: Building2 },
        { label: "Audit Logs", path: "/audit-logs", icon: Shield },
      ],
    }] : []),
  ];

  return (
    <motion.aside
      animate={{ width: open ? 220 : 68 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 h-full sidebar-gradient text-white z-40 flex flex-col overflow-visible"
      style={{ willChange: "width" }}
    >
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className={cn(
        "flex items-center h-16 border-b border-white/[0.07] flex-shrink-0 relative",
        open ? "px-5 gap-3" : "justify-center"
      )}>
        {/* Hex logo mark */}
        <div className="relative flex-shrink-0 w-8 h-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #10B981 100%)" }}>
            <span className="text-base leading-none">🐝</span>
          </div>
          <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100"
            style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.5), rgba(16,185,129,0.5))", filter: "blur(6px)" }} />
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 min-w-0"
            >
              <h1 className="text-sm font-bold tracking-tight text-white leading-none">HourHive</h1>
              <p className="text-[10px] font-medium tracking-wide mt-0.5"
                style={{ background: "linear-gradient(90deg,#60A5FA,#34D399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Smart Workforce Platform
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Collapse toggle — fixed to sidebar right edge ─────── */}
      <motion.button
        onClick={onToggle}
        animate={{ left: open ? 220 - 14 : 68 - 14 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        className="fixed top-[72px] w-7 h-7 rounded-full flex items-center justify-center z-[1000]"
        style={{
          background: "linear-gradient(135deg, #2563EB, #10B981)",
          boxShadow: "0 0 0 3px var(--pg-bg), 0 2px 10px rgba(37,99,235,0.5)",
        }}
      >
        <motion.div
          animate={{ rotate: open ? 0 : 180 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          <ChevronLeft className="h-3.5 w-3.5 text-white" />
        </motion.div>
      </motion.button>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto scrollbar-sidebar py-3 px-2 space-y-0.5">
        {navSections.map((section, si) => (
          <div key={section.label} className={si > 0 ? "mt-1" : ""}>
            <AnimatePresence>
              {open && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-3 mb-1.5 mt-3 first:mt-0"
                >
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>
            {!open && si > 0 && <div className="mx-3 my-1.5 h-px bg-white/[0.07]" />}
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                item={item}
                open={open}
                active={location.pathname === item.path}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* ── User footer ──────────────────────────────────────── */}
      <div className="border-t border-white/[0.07] flex-shrink-0 p-3">
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 px-2 py-2"
          >
            <UserAvatar user={user} isSuperAdmin={isSuperAdmin} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/90 truncate leading-none">{user?.full_name}</p>
              <p className="text-[10px] text-white/40 font-medium mt-0.5">
                {isSuperAdmin ? "Super Admin" : user?.can_approve_timesheets ? "Manager" : "Employee"}
              </p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
          </motion.div>
        ) : (
          <div className="flex justify-center py-1">
            <UserAvatar user={user} isSuperAdmin={isSuperAdmin} size="sm"
              title={`${user?.full_name} (${isSuperAdmin ? "Super Admin" : "Employee"})`} />
          </div>
        )}
      </div>
    </motion.aside>
  );
}

function UserAvatar({ user, isSuperAdmin, size = "sm", title }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-9 h-9 text-sm";
  return (
    <div
      title={title}
      className={cn("rounded-full flex items-center justify-center font-bold text-white flex-shrink-0", sz)}
      style={{
        background: isSuperAdmin
          ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
          : "linear-gradient(135deg, #2563EB 0%, #10B981 100%)",
        boxShadow: isSuperAdmin ? "0 0 10px rgba(245,158,11,0.3)" : "0 0 10px rgba(37,99,235,0.3)",
      }}
    >
      {user?.full_name?.charAt(0).toUpperCase()}
    </div>
  );
}

function NavLink({ item, open, active }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      title={!open ? item.label : undefined}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-200 group overflow-visible",
        active
          ? "text-white"
          : "text-white/45 hover:text-white/85 hover:bg-white/[0.07]"
      )}
      style={active ? {
        background: "linear-gradient(135deg, rgba(37,99,235,0.85) 0%, rgba(16,185,129,0.7) 100%)",
        boxShadow: "0 2px 12px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
      } : undefined}
    >
      {/* Active glow blob */}
      {active && (
  <>
    <div
      className="absolute inset-0 rounded-xl opacity-30"
      style={{
        background:
          "radial-gradient(ellipse at 30% 50%, rgba(59,130,246,0.6), transparent 70%)",
      }}
    />

    <div
      className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary shadow-glow"
    />
  </>
)}
      <Icon className={cn(
        "h-4 w-4 flex-shrink-0 relative z-10 transition-transform duration-200",
        active ? "text-white" : "text-current",
        !active && "group-hover:scale-110"
      )} />

      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "text-sm font-medium truncate relative z-10",
              active ? "font-semibold text-white" : ""
            )}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {active && open && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0 relative z-10" />
      )}
    </Link>
  );
}
