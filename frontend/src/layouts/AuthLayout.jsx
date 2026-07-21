import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, CheckCircle, BarChart3, Shield, Zap } from "lucide-react";
import { TymvoraLogo } from "@/components/shared/TymvoraLogo";

const features = [
  { icon: Clock,       text: "Real-time time tracking",       sub: "Log hours with precision" },
  { icon: CheckCircle, text: "Streamlined approvals",          sub: "One-click approval workflows" },
  { icon: BarChart3,   text: "Executive-grade reports",        sub: "Insights that drive decisions" },
  { icon: Shield,      text: "Enterprise-grade security",      sub: "SOC 2 compliant infrastructure" },
];

const stats = [
  { value: "10k+", label: "Active Users" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "50+", label: "Integrations" },
];

export function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-light-bg">
      {/* ── Left brand panel ────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0F172A 0%, #0F1E38 50%, #0F2952 100%)" }}
      >
        {/* Blobs */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle, #2563EB, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute bottom-0 -right-12 w-64 h-64 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #10B981, transparent 70%)", filter: "blur(50px)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, #3B82F6, transparent 70%)", filter: "blur(60px)" }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="mb-1">
            <TymvoraLogo
              className="items-center"
              textClassName="text-white font-semibold"
              markClassName="scale-110"
              subtitle="Enterprise Time Intelligence"
            />
          </div>
        </motion.div>

        {/* Middle content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="relative z-10 space-y-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-5">
              <Zap className="h-3 w-3 text-yellow-400" />
              <span className="text-xs text-white/60 font-medium">Enterprise Timesheet Platform</span>
            </div>
            <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
              Smart Time Tracking<br />
              <span style={{
                background: "linear-gradient(90deg, #60A5FA, #34D399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Built for Enterprise
              </span>
            </h2>
            <p className="text-white/50 text-sm mt-4 leading-relaxed max-w-sm">
              Streamline workforce productivity with real-time tracking, automated approvals,
              and executive-grade analytics — all in one unified platform.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {features.map(({ icon: Icon, text, sub }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.2), rgba(16,185,129,0.15))", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Icon className="h-3.5 w-3.5 text-primary-300" />
                </div>
                <div>
                  <p className="text-sm text-white/80 font-medium leading-none">{text}</p>
                  <p className="text-xs text-white/35 mt-0.5">{sub}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.07]">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-white/35 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/25 text-xs">
            © {new Date().getFullYear()} Tymvora Technologies Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 bg-light-bg">
        {/* Mobile logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:hidden mb-8"
        >
          <TymvoraLogo
            className="items-center"
            textClassName="text-text-primary"
            markClassName="scale-100"
            subtitle="Smart Workforce Platform"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl border border-border-color overflow-hidden"
            style={{ boxShadow: "0 8px 40px -8px rgba(37,99,235,0.15), 0 2px 12px rgba(0,0,0,0.06)" }}>
            <Outlet />
          </div>
          <p className="text-center text-xs text-text-muted mt-6">
            Secured by Tymvora Technologies · Enterprise Grade
          </p>
        </motion.div>
      </div>
    </div>
  );
}
