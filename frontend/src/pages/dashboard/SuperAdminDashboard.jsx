import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle, Clock, Users, XCircle, BarChart2,
  AlertTriangle, ArrowRight, Calendar, ChevronDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";

import { dashboardService } from "@/services/dashboard.service";
import { useAuthStore } from "@/store/auth.store";
import { useAdminProfileStore } from "@/store/admin-profile.store";
import { useThemeStore } from "@/store/theme.store";

/* ─── palettes ─────────────────────────────────────────────── */
const DEPT_COLORS   = ["#2563EB","#10B981","#8B5CF6","#F59E0B","#EF4444","#06B6D4","#EC4899","#84CC16"];
const STATUS_COLORS = { Draft:"#94A3B8", Submitted:"#F59E0B", Approved:"#10B981", Rejected:"#EF4444" };

const SAMPLE_MONTH = [
  { label:"Approved",value:18 },{ label:"Submitted",value:8 },
  { label:"Rejected",value:3 },{ label:"Draft",value:6 },
];
const SAMPLE_WEEK = [
  { label:"Approved",value:7 },{ label:"Submitted",value:4 },
  { label:"Rejected",value:1 },{ label:"Draft",value:2 },
];

const S = {
  card:{ background:"var(--surface)", border:"1px solid var(--surface-border)", boxShadow:"var(--card-shadow)" },
  hdr: { background:"var(--surface-2)", borderBottom:"1px solid var(--surface-border)" },
  tx1: { color:"var(--tx-1)" }, tx2:{ color:"var(--tx-2)" }, tx3:{ color:"var(--tx-3)" },
};

/* ─── live clock ────────────────────────────────────────────── */
function useClock() {
  const [t, set] = useState(new Date());
  useEffect(() => { const id = setInterval(() => set(new Date()), 1000); return () => clearInterval(id); }, []);
  return t;
}

/* ─── tooltip ───────────────────────────────────────────────── */
function useTooltip() {
  const dark = useThemeStore((s) => s.isDark());
  return {
    contentStyle:{ background:dark?"#1E293B":"#fff", border:`1px solid ${dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"}`, borderRadius:8, fontSize:11, color:dark?"#F1F5F9":"#1E293B" },
    labelStyle:{ color:dark?"#CBD5E1":"#374151" },
    itemStyle: { color:dark?"#F1F5F9":"#1E293B" },
  };
}

/* ─── compact number formatter (for tight spaces like donut centers) ── */
function formatCompact(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(Math.round(num));
}

/* ─── bar top-label ─────────────────────────────────────────── */
function BarTopLabel({ x, y, width, value }) {
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 4} textAnchor="middle" fontSize={9} fill="var(--tx-2)">
      {`${Math.round(value)}h`}
    </text>
  );
}

/* ─── period dropdown ───────────────────────────────────────── */
function Sel({ value, onChange, options }) {
  return (
    <div className="relative flex items-center">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="appearance-none text-[9px] font-semibold pl-2 pr-5 py-0.5 rounded-full cursor-pointer outline-none"
        style={{ background:"var(--surface)", color:"var(--tx-2)", border:"1px solid var(--surface-border)" }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-1 h-2.5 w-2.5 pointer-events-none" style={{ color:"var(--tx-3)" }} />
    </div>
  );
}

/* ─── compact KPI card ──────────────────────────────────────── */
function KCard({ icon: Icon, label, value, accent, sub }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-2 rounded-xl flex-1 min-w-0" style={S.card}>
      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background:`${accent}18` }}>
        <Icon className="h-2.5 w-2.5" style={{ color:accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-[8px] font-semibold uppercase tracking-wide leading-none truncate" style={S.tx3}>{label}</p>
        <p className="text-[15px] font-bold leading-tight tabular-nums" style={S.tx1}>{value ?? "—"}</p>
        {sub && <p className="text-[8px] leading-none truncate" style={S.tx3}>{sub}</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);
  const avatar   = useAdminProfileStore((s) => s.avatar);
  const tooltip  = useTooltip();
  const now      = useClock();

  const [mPeriod, setMPeriod] = useState("this_month");
  const [wPeriod, setWPeriod] = useState("this_week");
  const [barN,    setBarN]    = useState("6");  // "week"|"1"|"3"|"6"
  const [tsPer,   setTsPer]   = useState("month");

  const { data, isLoading } = useQuery({
    queryKey:["dashboard","super-admin"],
    queryFn: dashboardService.superAdmin,
  });

  const kpis = data?.kpis;
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0,2).join("").toUpperCase()
    : "SA";

  const lastLogin = (() => {
    const r = user?.last_login;
    if (!r) return "N/A";
    try { return format(typeof r==="string"?parseISO(r):new Date(r),"dd MMM yyyy, hh:mm aa"); }
    catch { return "N/A"; }
  })();

  const barData = (() => {
    if (barN === "week") return data?.weekly_daily_chart || [];
    if (barN === "1")    return data?.monthly_weekly_chart || [];
    const all = data?.monthly_hours_chart || [];
    return all.slice(-parseInt(barN, 10));
  })();

  const mK = mPeriod==="last_4_months"
    ? { p:kpis?.pending_approvals??"—", a:Math.round(((data?.monthly_hours_chart||[]).slice(-4).reduce((s,d)=>s+d.value,0))/8), r:kpis?.rejected_this_month??"—", sub:"Last 4 months" }
    : { p:kpis?.pending_approvals, a:kpis?.approved_this_month, r:kpis?.rejected_this_month, sub:"This month" };

  const wK = wPeriod==="last_4_weeks"
    ? { p:data?.weekly_pending??"—", a:Math.round(((data?.monthly_hours_chart||[]).slice(-1).reduce((s,d)=>s+d.value,0))/32), r:data?.weekly_rejected??"—", sub:"Last 4 weeks" }
    : { p:data?.weekly_pending, a:data?.weekly_approved, r:data?.weekly_rejected, sub:"This week" };

  const ALL_STATUSES = ["Draft","Submitted","Approved","Rejected"];
  const rawTs = tsPer==="week" ? (data?.weekly_status_chart||[]) : (data?.monthly_status_chart||[]);
  const tsData = rawTs.length>0
    ? ALL_STATUSES.map((s)=>{ const found=rawTs.find((d)=>d.label===s); return { label:s, value:found?.value??0 }; })
    : (tsPer==="week"?SAMPLE_WEEK:SAMPLE_MONTH);
  const tsTotal = tsData.reduce((s,d)=>s+d.value,0);
  // Reserve a small visible sliver for zero-value statuses so all 4 always show in the ring;
  // tooltip/legend still read the real `value`, this only affects the rendered angle.
  const tsPieData = tsData.map((d) => ({
    ...d,
    renderValue: d.value > 0 ? d.value : (tsTotal > 0 ? tsTotal * 0.035 : 1),
  }));

  const deptData  = data?.dept_hours||[];
  const deptTotal = deptData.reduce((s,d)=>s+d.value,0);

  return (
    <div className="flex flex-col gap-2 overflow-hidden" style={{ height:"calc(100vh - 64px - 48px)" }}>

      {/* ════════ ROW 1 — Hero | Bar Chart | Monthly+Weekly KPIs | TS Pie ════════ */}
      <div className="flex gap-2 flex-shrink-0" style={{ height:"calc(50% - 5px)" }}>

        {/* ── Hero card ── */}
        <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.3 }}
          className="relative rounded-xl overflow-hidden flex-shrink-0 flex flex-col"
          style={{ background:"linear-gradient(160deg,#1E3A8A 0%,#1D4ED8 55%,#0D9488 100%)", boxShadow:"0 4px 24px rgba(37,99,235,0.28)", width:176 }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 -translate-y-1/2 translate-x-1/3 pointer-events-none"
            style={{ background:"radial-gradient(circle,#60A5FA,transparent)" }} />
          <div className="relative px-3 py-3 flex flex-col gap-2 flex-1">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-1">
              <div className="relative">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white overflow-hidden"
                  style={{ background:avatar?"transparent":"linear-gradient(135deg,#0D9488,#2563EB)", boxShadow:"0 0 0 3px rgba(255,255,255,0.22),0 4px 14px rgba(0,0,0,0.28)" }}>
                  {avatar?<img src={avatar} alt="avatar" className="w-full h-full object-cover"/>:initials}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#1D4ED8] bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.9)]" />
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[9px] font-semibold text-emerald-300">Online</span>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-[13px] font-bold text-white leading-tight">{user?.full_name||"Super Admin"} 👑</h1>
              <p className="text-[9px] text-white/50 mt-0.5">Super Admin</p>
            </div>
            <div className="h-px w-full" style={{ background:"rgba(255,255,255,0.13)" }} />
            {/* Info rows */}
            {[
              { Icon:Calendar, label:"Date",             val:format(now,"EEE, dd MMM yyyy") },
              { Icon:Clock,    label:"Current Time",     val:format(now,"HH:mm:ss") },
              { Icon:Clock,    label:"Last Logged In",   val:lastLogin },
              { Icon:Users,    label:"Total Employees",  val:String(kpis?.total_employees??"—") },
            ].map(({ Icon, label, val }, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background:"rgba(255,255,255,0.11)" }}>
                  <Icon className="h-2.5 w-2.5 text-white/60" />
                </div>
                <div className="min-w-0">
                  <p className="text-[7px] text-white/35 font-semibold uppercase tracking-wide leading-none">{label}</p>
                  <p className="text-[9.5px] font-bold text-white leading-tight truncate">{val}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Bar Chart ── */}
        <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.3,delay:0.05 }}
          className="rounded-xl overflow-hidden flex flex-col flex-1" style={S.card}>
          <div className="px-4 py-1.5 flex items-center gap-2" style={S.hdr}>
            <BarChart2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color:"#2563EB" }} />
            <span className="text-xs font-semibold flex-1" style={S.tx1}>Weekly Hours Overview</span>
            <Sel value={barN} onChange={setBarN} options={[
              { value:"week", label:"This Week"      },
              { value:"1",    label:"This Month"     },
              { value:"3",    label:"Last 3 Months"  },
              { value:"6",    label:"Last 6 Months"  },
            ]} />
          </div>
          <div className="flex-1 min-h-0 px-2 pt-3 pb-1">
            {isLoading ? (
              <div className="h-full animate-pulse rounded-lg" style={{ background:"var(--surface-2)" }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top:16, right:4, bottom:0, left:-22 }}>
                  <defs>
                    <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6"/><stop offset="100%" stopColor="#1D4ED8"/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize:9.5, fill:"var(--tx-3)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:9, fill:"var(--tx-3)" }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltip} cursor={{ fill:"rgba(59,130,246,0.07)" }} formatter={(v)=>[`${Number(v).toFixed(0)}h`,"Hours"]} />
                  <Bar dataKey="value" radius={[4,4,0,0]} fill="url(#barBlue)" label={<BarTopLabel />} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* ── Monthly + Weekly KPIs stacked ── */}
        <div className="flex flex-col gap-2 flex-shrink-0" style={{ width:315 }}>

          <motion.div initial={{ opacity:0,x:10 }} animate={{ opacity:1,x:0 }} transition={{ duration:0.3,delay:0.08 }}
            className="rounded-xl overflow-hidden flex flex-col flex-1" style={S.card}>
            <div className="px-3 py-1 flex items-center justify-between flex-shrink-0" style={S.hdr}>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={S.tx3}>Monthly</span>
              <Sel value={mPeriod} onChange={setMPeriod} options={[
                { value:"this_month",label:"This Month" },
                { value:"last_4_months",label:"Last 4 Months" },
              ]} />
            </div>
            <div className="flex gap-1 p-1.5 flex-1">
              <KCard icon={AlertTriangle} label="Pending"  value={mK.p} accent="#F59E0B" sub={mK.sub} />
              <KCard icon={CheckCircle}   label="Approved" value={mK.a} accent="#10B981" sub={mK.sub} />
              <KCard icon={XCircle}       label="Rejected" value={mK.r} accent="#EF4444" sub={mK.sub} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity:0,x:10 }} animate={{ opacity:1,x:0 }} transition={{ duration:0.3,delay:0.11 }}
            className="rounded-xl overflow-hidden flex flex-col flex-1" style={S.card}>
            <div className="px-3 py-1 flex items-center justify-between flex-shrink-0" style={S.hdr}>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={S.tx3}>Weekly</span>
              <Sel value={wPeriod} onChange={setWPeriod} options={[
                { value:"this_week",label:"This Week" },
                { value:"last_4_weeks",label:"Last 4 Weeks" },
              ]} />
            </div>
            <div className="flex gap-1 p-1.5 flex-1">
              <KCard icon={AlertTriangle} label="Pending"  value={wK.p} accent="#F59E0B" sub={wK.sub} />
              <KCard icon={CheckCircle}   label="Approved" value={wK.a} accent="#10B981" sub={wK.sub} />
              <KCard icon={XCircle}       label="Rejected" value={wK.r} accent="#EF4444" sub={wK.sub} />
            </div>
          </motion.div>
        </div>

        {/* ── Timesheet Status — compact full pie ── */}
        <motion.div initial={{ opacity:0,x:10 }} animate={{ opacity:1,x:0 }} transition={{ duration:0.3,delay:0.14 }}
          className="rounded-xl overflow-hidden flex flex-col flex-shrink-0" style={{ ...S.card, width:210 }}>
          <div className="px-3 py-1.5 flex items-center justify-between flex-shrink-0" style={S.hdr}>
            <span className="text-[9px] font-bold uppercase tracking-widest" style={S.tx3}>Timesheet Status</span>
            <Sel value={tsPer} onChange={setTsPer} options={[
              { value:"month",label:"This Month" },
              { value:"week", label:"This Week"  },
            ]} />
          </div>
          {/* Pie on top, legend table on bottom */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top:6, right:6, bottom:0, left:6 }}>
                  {/* full pie — innerRadius=0. Uses renderValue (never 0) so every status stays visible;
                      tooltip reads the real value off the payload. */}
                  <Pie data={tsPieData} dataKey="renderValue" nameKey="label"
                    cx="50%" cy="50%" innerRadius={0} outerRadius="72%" strokeWidth={1.5} stroke="var(--surface)">
                    {tsPieData.map((d) => <Cell key={d.label} fill={STATUS_COLORS[d.label]||"#94A3B8"} />)}
                  </Pie>
                  <Tooltip {...tooltip} formatter={(_v,n,props)=>[props.payload.value,n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* legend */}
            <div className="px-3 pb-2 flex-shrink-0">
              {tsData.map((d) => (
                <div key={d.label} className="flex items-center gap-1.5 py-0.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:STATUS_COLORS[d.label]||"#94A3B8" }} />
                  <span className="text-[9px] flex-1" style={S.tx2}>{d.label}</span>
                  <span className="text-[9px] font-bold tabular-nums" style={S.tx1}>{d.value}</span>
                  <span className="text-[8px] tabular-nums" style={S.tx3}>({tsTotal>0?Math.round(d.value/tsTotal*100):0}%)</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 pt-1 mt-0.5" style={{ borderTop:"1px solid var(--surface-border)" }}>
                <span className="text-[8px] font-bold uppercase tracking-wide flex-1" style={S.tx3}>Total</span>
                <span className="text-[10px] font-bold tabular-nums" style={S.tx1}>{tsTotal}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ════════ ROW 2 — Dept Breakdown | Pending Approvals ════════ */}
      <div className="flex gap-2 flex-1 min-h-0">

        {/* Dept Breakdown */}
        <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.3,delay:0.18 }}
          className="rounded-xl overflow-hidden flex flex-col flex-shrink-0" style={{ ...S.card, width:286 }}>
          <div className="px-4 py-1.5 flex items-center gap-2 flex-shrink-0" style={S.hdr}>
            <BarChart2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color:"#8B5CF6" }} />
            <span className="text-xs font-semibold" style={S.tx1}>Dept Breakdown</span>
          </div>
          <div className="flex flex-1 min-h-0 items-center px-2 py-1">
            {/* Donut with center label */}
            <div className="relative flex-shrink-0" style={{ width:130, height:"100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top:8, right:0, bottom:8, left:0 }}>
                  <Pie
                    data={deptData.length>0?deptData:[{ label:"No data",value:1 }]}
                    dataKey="value" nameKey="label"
                    cx="50%" cy="50%" innerRadius="42%" outerRadius="64%" strokeWidth={1.5}>
                    {(deptData.length>0?deptData:[{label:"No data",value:1}]).map((_,i)=>(
                      <Cell key={i} fill={deptData.length>0?DEPT_COLORS[i%DEPT_COLORS.length]:"#374151"} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltip} formatter={(v)=>[`${Number(v).toFixed(0)}h`,"Hours"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2">
                <span className="text-[8px] font-semibold" style={S.tx3}>Total</span>
                <span
                  className={`font-bold tabular-nums leading-tight ${deptTotal >= 1000 ? "text-xs" : "text-lg"}`}
                  style={S.tx1}
                  title={deptTotal ? `${Math.round(deptTotal)}h` : undefined}
                >
                  {deptTotal ? formatCompact(deptTotal) : "—"}
                </span>
              </div>
            </div>
            {/* Legend */}
            <div className="flex-1 min-w-0 px-2 overflow-y-auto" style={{ maxHeight:"100%" }}>
              {deptData.slice(0,7).map((d,i)=>(
                <div key={d.label} className="flex items-center gap-1.5 py-0.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:DEPT_COLORS[i%DEPT_COLORS.length] }} />
                  <span className="text-[9px] flex-1 truncate" style={S.tx2}>{d.label}</span>
                  <span className="text-[9px] font-bold tabular-nums" style={S.tx1}>{Math.round(d.value)}</span>
                  <span className="text-[8px] tabular-nums" style={S.tx3}>({deptTotal>0?Math.round(d.value/deptTotal*100):0}%)</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Pending Approvals — full remaining width */}
        <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.3,delay:0.22 }}
          className="rounded-xl overflow-hidden flex flex-col flex-1" style={S.card}>
          <div className="px-4 py-1.5 flex items-center justify-between flex-shrink-0" style={S.hdr}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" style={{ color:"#F59E0B" }} />
              <span className="text-xs font-semibold" style={S.tx1}>Pending Approvals</span>
              {(kpis?.pending_approvals??0)>0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
                  style={{ background:"#F59E0B" }}>{kpis.pending_approvals}</span>
              )}
            </div>
            <motion.button onClick={()=>navigate("/approvals")}
              whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
              className="flex items-center gap-1 text-[10px] font-semibold" style={{ color:"#2563EB" }}>
              View All <ArrowRight className="h-3 w-3" />
            </motion.button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {(!data?.pending_approvals||data.pending_approvals.length===0) ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-9 h-9 rounded-xl mb-2 flex items-center justify-center" style={{ background:"rgba(16,185,129,0.1)" }}>
                  <CheckCircle className="h-4 w-4" style={{ color:"#10B981" }} />
                </div>
                <p className="text-xs font-medium" style={S.tx2}>All caught up!</p>
                <p className="text-[10px] mt-0.5" style={S.tx3}>No pending timesheets</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr style={S.hdr}>
                    {["Employee","Week","Hours","Submitted On","Status"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-[9px] font-semibold uppercase tracking-wider" style={S.tx3}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.pending_approvals.map((item, i) => (
                    <motion.tr key={item.header_id}
                      initial={{ opacity:0,x:6 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.04 }}
                      style={{ borderBottom:"1px solid var(--surface-border)" }}
                      onMouseEnter={(e) => e.currentTarget.style.background="var(--surface-2)"}
                      onMouseLeave={(e) => e.currentTarget.style.background="transparent"}
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ background:"linear-gradient(135deg,#2563EB,#10B981)" }}>
                            {(item.employee_name||"U").charAt(0)}
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold leading-none" style={S.tx1}>{item.employee_name}</p>
                            <p className="text-[9px] mt-0.5" style={S.tx3}>EMP{String(item.header_id).padStart(3,"0")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-[11px]" style={S.tx2}>{item.week_label}</td>
                      <td className="px-4 py-2 text-[11px] font-bold tabular-nums" style={S.tx1}>{item.total_hours}h</td>
                      <td className="px-4 py-2 text-[10px]" style={S.tx3}>
                        {item.submitted_at ? format(new Date(item.submitted_at),"dd MMM yyyy, hh:mm aa") : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                          style={{ background:"rgba(245,158,11,0.15)", color:"#F59E0B" }}>Pending</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
