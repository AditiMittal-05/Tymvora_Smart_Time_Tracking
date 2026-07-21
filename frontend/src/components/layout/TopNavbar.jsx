import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, Bell, LogOut, Key, ChevronDown, ChevronRight,
  Shield, User, Sun, Moon,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useProfileStore } from "@/store/profile.store";
import { useAdminProfileStore } from "@/store/admin-profile.store";
import { useThemeStore } from "@/store/theme.store";
import { cn } from "@/utils/cn";
import { TymvoraLogo } from "@/components/shared/TymvoraLogo";

const breadcrumbMap = {
  "/dashboard": "Dashboard",
  "/timesheets": "My Timesheets",
  "/timesheets/entry": "Log Time",
  "/timesheets/weekly": "Weekly View",
  "/approvals": "Approval Queue",
  "/users": "User Management",
  "/organization": "Org Hierarchy",
  "/approver-mapping": "Approver Mapping",
  "/projects": "Project Management",
  "/activities": "Activity Management",
  "/reports": "Reports",
  "/analytics": "Analytics",
  "/change-password": "Change Password",
  "/audit-logs": "Audit Logs",
  "/holidays": "Holiday Management",
  "/profile": "My Profile",
};

export function TopNavbar({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";
  const employeeAvatar = useProfileStore((s) => s.avatar);
  const adminAvatar = useAdminProfileStore((s) => s.avatar);
  const avatar = isSuperAdmin ? adminAvatar : employeeAvatar;
  const { theme, setTheme } = useThemeStore();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const pageTitle = breadcrumbMap[location.pathname] || "Tymvora";
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const avatarGradient = isSuperAdmin
    ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
    : "linear-gradient(135deg, #2563EB 0%, #10B981 100%)";

  const avatarGlow = isSuperAdmin
    ? "0 0 12px rgba(245,158,11,0.4)"
    : "0 0 12px rgba(37,99,235,0.4)";

  return (
    <header
      className="h-16 flex items-center gap-3 px-4 z-40 flex-shrink-0 relative"
      style={{
        background: "linear-gradient(90deg, #0C1524 0%, #0F172A 40%, #111827 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* Subtle top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: "linear-gradient(90deg, transparent, rgba(37,99,235,0.4), rgba(16,185,129,0.3), transparent)" }}
      />

      {/* Sidebar toggle */}
      <motion.button
        onClick={onMenuToggle}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.07] transition-all flex-shrink-0"
      >
        <Menu className="h-5 w-5" />
      </motion.button>

      {/* Divider */}
      <div className="w-px h-6 bg-white/[0.08] flex-shrink-0" />

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm min-w-0">
        <span className="text-white/30 font-medium hidden sm:block tracking-wide">Tymvora</span>
        <ChevronRight className="h-3.5 w-3.5 text-white/20 hidden sm:block flex-shrink-0" />
        <span className="font-semibold text-white/90 truncate">{pageTitle}</span>
      </div>

      <div className="flex-1" />

      {/* Theme toggle */}
      <motion.button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.07] transition-all flex-shrink-0"
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <Sun className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <Moon className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notification bell */}
      <div className="relative flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => { setBellOpen((p) => !p); setMenuOpen(false); }}
          className="relative p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.07] transition-all"
        >
          <motion.div
            animate={bellOpen ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Bell className="h-5 w-5" />
          </motion.div>
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-[1.5px]"
            style={{ background: "#10B981", borderColor: "#0F172A" }}
          />
        </motion.button>

        <AnimatePresence>
          {bellOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="absolute right-0 top-12 w-72 rounded-2xl z-50 overflow-hidden"
                style={{
                  background: "#0F172A",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
                }}
              >
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <p className="text-sm font-semibold text-white/90">Notifications</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
                    All clear
                  </span>
                </div>
                <div className="py-8 text-center">
                  <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    <Bell className="h-4 w-4 text-white/30" />
                  </div>
                  <p className="text-sm text-white/40 font-medium">You're all caught up</p>
                  <p className="text-xs text-white/25 mt-1">No new notifications</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/[0.08] flex-shrink-0" />

      {/* User menu */}
      <div className="relative flex-shrink-0">
        <motion.button
          onClick={() => { setMenuOpen((p) => !p); setBellOpen(false); }}
          whileHover={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl transition-all"
        >
          {/* Avatar */}
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                style={{ boxShadow: avatarGlow }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: avatarGradient, boxShadow: avatarGlow }}
              >
                {initials}
              </div>
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: "#10B981", borderColor: "#0F172A" }}
            />
          </div>

          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-white/90 leading-none">{user?.full_name}</p>
            <p className="text-[10px] mt-0.5 font-medium"
              style={{ background: "linear-gradient(90deg,#60A5FA,#34D399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {isSuperAdmin ? "Super Admin" : user?.can_approve_timesheets ? "Approver" : "Employee"}
            </p>
          </div>
          <motion.div animate={{ rotate: menuOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-3.5 w-3.5 text-white/30" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="absolute right-0 top-12 w-64 rounded-2xl z-50 overflow-hidden"
                style={{
                  background: "#0F172A",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
                }}
              >
                {/* User info header */}
                <div
                  className="px-4 py-4 border-b border-white/[0.06]"
                  style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(16,185,129,0.08))" }}
                >
                  <div className="flex items-center gap-3">
                    {avatar ? (
                      <img src={avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        style={{ boxShadow: avatarGlow }} />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: avatarGradient }}
                      >
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white/90 truncate">{user?.full_name}</p>
                      <p className="text-xs text-white/40 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                      isSuperAdmin
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        : "bg-primary/15 text-blue-400 border border-primary/20"
                    )}>
                      {isSuperAdmin && <Shield className="h-3 w-3" />}
                      {isSuperAdmin ? "Super Admin" : user?.can_approve_timesheets ? "Approver" : "Employee"}
                    </span>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  {[
                    { to: "/profile", icon: User, label: "My Profile" },
                    { to: "/change-password", icon: Key, label: "Change Password" },
                    ...(isSuperAdmin ? [{ to: "/audit-logs", icon: Shield, label: "Audit Logs" }] : []),
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/50 hover:text-white/90 hover:bg-white/[0.05] transition-all"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                  <div className="mx-4 my-1 h-px bg-white/[0.06]" />
                  <motion.button
                    onClick={handleLogout}
                    whileHover={{ backgroundColor: "rgba(239,68,68,0.08)" }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 hover:text-red-400 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
