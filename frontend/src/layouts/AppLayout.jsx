import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { FloatingCalendar } from "@/components/shared/FloatingCalendar";
import { useThemeStore, applyTheme } from "@/store/theme.store";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => { applyTheme(theme); }, [theme]);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--pg-bg)" }}>
      {/* Decorative background blobs */}
      <div className="blob fixed w-[500px] h-[500px] -top-40 -left-20 opacity-[0.04]"
        style={{ background: "#2563EB", animationDelay: "0s" }} />
      <div className="blob fixed w-[400px] h-[400px] top-1/2 right-10 opacity-[0.03]"
        style={{ background: "#10B981", animationDelay: "2.5s" }} />
      <div className="blob fixed w-[300px] h-[300px] bottom-20 left-1/3 opacity-[0.03]"
        style={{ background: "#3B82F6", animationDelay: "5s" }} />

      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((p) => !p)} />

      <motion.div
        animate={{ marginLeft: sidebarOpen ? 220 : 68 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col flex-1 overflow-hidden"
        style={{ willChange: "margin-left" }}
      >
        <TopNavbar onMenuToggle={() => setSidebarOpen((p) => !p)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="p-6 max-w-[1600px] mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>

      <FloatingCalendar />
    </div>
  );
}
