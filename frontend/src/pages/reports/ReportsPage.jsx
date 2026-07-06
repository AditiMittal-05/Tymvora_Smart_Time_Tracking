import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, BarChart3, FileText, Users, FolderKanban, AlertCircle } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { reportsService } from "@/services/reports.service";
import { projectsService } from "@/services/projects.service";
import { usersService } from "@/services/users.service";
import { SkeletonTable } from "@/components/shared/PageLoader";
import { useAuthStore } from "@/store/auth.store";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export function ReportsPage() {
  const [tab, setTab] = useState("daily");
  const isAdmin = useAuthStore((s) => s.user?.role === "super_admin");
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [dailyFilters, setDailyFilters] = useState({
    start_date: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
    employee_id: undefined,
    project_id: undefined,
  });
  const [monthlyFilters, setMonthlyFilters] = useState({ month: currentMonth, year: currentYear });
  const [missingFilters, setMissingFilters] = useState({
    start_date: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
  });

  const { data: projects } = useQuery({ queryKey: ["projects-dropdown"], queryFn: projectsService.dropdown, enabled: isAdmin });
  const { data: users } = useQuery({ queryKey: ["users-dropdown"], queryFn: usersService.dropdown, enabled: isAdmin });

  const dailyQuery = useQuery({
    queryKey: ["report-daily", dailyFilters],
    queryFn: () => reportsService.daily(dailyFilters),
    enabled: tab === "daily",
  });
  const monthlyQuery = useQuery({
    queryKey: ["report-monthly", monthlyFilters],
    queryFn: () => reportsService.monthlySummary(monthlyFilters),
    enabled: tab === "monthly",
  });
  const projectQuery = useQuery({
    queryKey: ["report-project", dailyFilters.start_date, dailyFilters.end_date],
    queryFn: () => reportsService.projectEffort({ start_date: dailyFilters.start_date, end_date: dailyFilters.end_date }),
    enabled: tab === "project" && isAdmin,
  });
  const activityQuery = useQuery({
    queryKey: ["report-activity", dailyFilters],
    queryFn: () => reportsService.activity({ start_date: dailyFilters.start_date, end_date: dailyFilters.end_date }),
    enabled: tab === "activity",
  });
  const missingQuery = useQuery({
    queryKey: ["report-missing", missingFilters],
    queryFn: () => reportsService.missingTimesheets(missingFilters),
    enabled: tab === "missing" && isAdmin,
  });

  const tabs = [
    { key: "daily", label: "Daily Report", icon: FileText },
    { key: "monthly", label: "Monthly Summary", icon: Users },
    { key: "project", label: "Project Effort", icon: FolderKanban, adminOnly: true },
    { key: "activity", label: "Activity Report", icon: BarChart3 },
    { key: "missing", label: "Missing Timesheets", icon: AlertCircle, adminOnly: true },
  ].filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Reports</h1>
          <p className="text-text-secondary text-sm mt-0.5">Generate and export detailed workforce reports</p>
        </div>
        {tab === "daily" && (
          <Button variant="outline" asChild>
            <a href={reportsService.exportDaily({ ...dailyFilters, fmt: "excel" })} download>
              <Download className="h-4 w-4" /> Export Excel
            </a>
          </Button>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-border-color shadow-card w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                tab === t.key
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-light-bg"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          {(tab === "daily" || tab === "project" || tab === "activity") && (
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Start Date</Label>
                <Input
                  type="date"
                  value={dailyFilters.start_date}
                  onChange={(e) => setDailyFilters((f) => ({ ...f, start_date: e.target.value }))}
                  className="w-40"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">End Date</Label>
                <Input
                  type="date"
                  value={dailyFilters.end_date}
                  onChange={(e) => setDailyFilters((f) => ({ ...f, end_date: e.target.value }))}
                  className="w-40"
                />
              </div>
              {isAdmin && tab === "daily" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Employee</Label>
                    <Select
                      value={dailyFilters.employee_id?.toString() || "all"}
                      onValueChange={(v) => setDailyFilters((f) => ({ ...f, employee_id: v === "all" ? undefined : parseInt(v) }))}
                    >
                      <SelectTrigger className="w-44"><SelectValue placeholder="All Employees" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        {users?.map((u) => <SelectItem key={u.id} value={u.id.toString()}>{u.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Project</Label>
                    <Select
                      value={dailyFilters.project_id?.toString() || "all"}
                      onValueChange={(v) => setDailyFilters((f) => ({ ...f, project_id: v === "all" ? undefined : parseInt(v) }))}
                    >
                      <SelectTrigger className="w-44"><SelectValue placeholder="All Projects" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects?.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.project_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          )}
          {tab === "monthly" && (
            <div className="flex gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Month</Label>
                <Select
                  value={monthlyFilters.month.toString()}
                  onValueChange={(v) => setMonthlyFilters((f) => ({ ...f, month: parseInt(v) }))}
                >
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Year</Label>
                <Select
                  value={monthlyFilters.year.toString()}
                  onValueChange={(v) => setMonthlyFilters((f) => ({ ...f, year: parseInt(v) }))}
                >
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {tab === "missing" && (
            <div className="flex gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Start Date</Label>
                <Input
                  type="date"
                  value={missingFilters.start_date}
                  onChange={(e) => setMissingFilters((f) => ({ ...f, start_date: e.target.value }))}
                  className="w-40"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">End Date</Label>
                <Input
                  type="date"
                  value={missingFilters.end_date}
                  onChange={(e) => setMissingFilters((f) => ({ ...f, end_date: e.target.value }))}
                  className="w-40"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results table */}
      <Card>
        <CardContent className="p-0">
          {/* Daily Report */}
          {tab === "daily" && (
            dailyQuery.isLoading ? <div className="p-6"><SkeletonTable /></div> :
            <table className="enterprise-table w-full">
              <thead>
                <tr>
                  {["Date","Employee","Code","Project","Activity","Hours","Billable"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(dailyQuery.data || []).length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-text-secondary text-sm">No data for selected filters</td></tr>
                ) : (dailyQuery.data || []).map((row, i) => (
                  <tr key={i}>
                    <td className="text-sm text-text-secondary tabular-nums">{row.work_date}</td>
                    <td className="text-sm font-medium text-text-primary">{row.employee_name}</td>
                    <td className="text-sm font-mono text-text-secondary">{row.employee_code}</td>
                    <td className="text-sm text-text-primary">{row.project_name}</td>
                    <td className="text-sm text-text-secondary">{row.activity_name}</td>
                    <td className="text-sm font-bold text-primary tabular-nums">{Number(row.hours_worked).toFixed(2)}h</td>
                    <td><Badge variant={row.is_billable ? "success" : "outline"}>{row.is_billable ? "Yes" : "No"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Monthly Summary */}
          {tab === "monthly" && (
            monthlyQuery.isLoading ? <div className="p-6"><SkeletonTable /></div> :
            <table className="enterprise-table w-full">
              <thead>
                <tr>
                  {["Employee","Code","Total Hours","Working Days","Avg Hours/Day"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(monthlyQuery.data || []).length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-text-secondary text-sm">No data for selected period</td></tr>
                ) : (monthlyQuery.data || []).map((row, i) => (
                  <tr key={i}>
                    <td className="text-sm font-medium text-text-primary">{row.employee_name}</td>
                    <td className="text-sm font-mono text-text-secondary">{row.employee_code}</td>
                    <td className="text-sm font-bold text-primary tabular-nums">{Number(row.total_hours).toFixed(1)}h</td>
                    <td className="text-sm text-text-primary tabular-nums">{row.working_days}</td>
                    <td className="text-sm text-text-secondary tabular-nums">{Number(row.avg_daily_hours).toFixed(2)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Project Effort */}
          {tab === "project" && (
            projectQuery.isLoading ? <div className="p-6"><SkeletonTable /></div> :
            <table className="enterprise-table w-full">
              <thead>
                <tr>
                  {["Project","Code","Customer","Total Hours","Billable","Non-Billable"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(projectQuery.data || []).length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-text-secondary text-sm">No data for selected period</td></tr>
                ) : (projectQuery.data || []).map((row, i) => (
                  <tr key={i}>
                    <td className="text-sm font-medium text-text-primary">{row.project_name}</td>
                    <td className="text-sm font-mono text-text-secondary">{row.project_code}</td>
                    <td className="text-sm text-text-secondary">{row.customer_name}</td>
                    <td className="text-sm font-bold text-primary tabular-nums">{Number(row.total_hours).toFixed(1)}h</td>
                    <td className="text-sm text-emerald-600 font-semibold tabular-nums">{Number(row.billable_hours).toFixed(1)}h</td>
                    <td className="text-sm text-text-secondary tabular-nums">{Number(row.non_billable_hours).toFixed(1)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Activity Report */}
          {tab === "activity" && (
            activityQuery.isLoading ? <div className="p-6"><SkeletonTable /></div> :
            <table className="enterprise-table w-full">
              <thead>
                <tr>
                  {["Activity","Total Hours","Percentage","Distribution"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(activityQuery.data || []).length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-text-secondary text-sm">No data for selected period</td></tr>
                ) : (activityQuery.data || []).map((row, i) => (
                  <tr key={i}>
                    <td className="text-sm font-medium text-text-primary">{row.activity_name}</td>
                    <td className="text-sm font-bold text-primary tabular-nums">{Number(row.total_hours).toFixed(1)}h</td>
                    <td className="text-sm text-text-secondary tabular-nums font-semibold">{row.percentage}%</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-slate-100 rounded-full w-32 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${row.percentage}%`, background: "linear-gradient(90deg, #2563EB, #10B981)" }}
                          />
                        </div>
                        <span className="text-xs text-text-secondary">{row.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Missing Timesheets */}
          {tab === "missing" && (
            missingQuery.isLoading ? <div className="p-6"><SkeletonTable /></div> :
            <table className="enterprise-table w-full">
              <thead>
                <tr>
                  {["Employee","Code","Missing Days","Missing Dates"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(missingQuery.data || []).length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-text-secondary text-sm">No missing timesheets found</td></tr>
                ) : (missingQuery.data || []).map((row, i) => (
                  <tr key={i}>
                    <td className="text-sm font-medium text-text-primary">{row.employee_name}</td>
                    <td className="text-sm font-mono text-text-secondary">{row.employee_code}</td>
                    <td>
                      <Badge variant="destructive">{row.missing_days_count} days</Badge>
                    </td>
                    <td className="text-xs text-text-secondary max-w-xs">
                      {row.missing_dates.slice(0, 5).join(", ")}
                      {row.missing_dates.length > 5 && (
                        <span className="text-text-secondary/60"> +{row.missing_dates.length - 5} more</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
