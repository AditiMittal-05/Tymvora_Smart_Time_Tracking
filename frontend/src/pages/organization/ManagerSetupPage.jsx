import { useState, useMemo } from "react";

const PAGE_SIZE = 15;
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GitBranch, Search, CheckCircle, XCircle, Users, UserCheck,
  UserPlus, Trash2, Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SkeletonTable } from "@/components/shared/PageLoader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { usersService } from "@/services/users.service";
import { useToast } from "@/hooks/use-toast";

export function ManagerSetupPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Change Manager dialog
  const [assignModal, setAssignModal] = useState(null);
  const [selectedManager, setSelectedManager] = useState("");

  // Check Reports dialog
  const [reportsModal, setReportsModal] = useState(null); // manager object
  const [addEmpId, setAddEmpId] = useState("");
  const [removeEmp, setRemoveEmp] = useState(null); // employee pending removal from team

  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["org-tree"],
    queryFn: usersService.orgTree,
  });

  const employeeOnly = useMemo(
    () => users.filter((u) => u.role !== "super_admin"),
    [users]
  );

  // ── Set / Change Manager mutation ──────────────────────────────
  const setManagerMutation = useMutation({
    mutationFn: ({ userId, managerId }) => usersService.setManager(userId, managerId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["org-tree"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      setAssignModal(null);
      const mgr = employeeOnly.find((u) => u.id === vars.managerId);
      toast.success(
        mgr && !mgr.can_approve_timesheets
          ? "Manager updated — approver access granted automatically"
          : "Manager updated"
      );
    },
    onError: (e) => toast.error("Failed", e?.response?.data?.detail),
  });

  // ── Toggle manager role mutation ───────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: ({ userId, canApprove }) =>
      usersService.toggleApprover(userId, canApprove),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["org-tree"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(vars.canApprove ? "Manager role granted" : "Manager role removed");
    },
    onError: (e) => toast.error("Failed", e?.response?.data?.detail),
  });

  // ── Add employee under a manager (used inside Check Reports) ───
  const addReportMutation = useMutation({
    mutationFn: ({ empId, managerId }) => usersService.setManager(empId, managerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-tree"] });
      setAddEmpId("");
      toast.success("Employee added to team");
    },
    onError: (e) => toast.error("Failed", e?.response?.data?.detail),
  });

  // ── Remove employee from a manager (set manager_id = null) ─────
  const removeReportMutation = useMutation({
    mutationFn: (empId) => usersService.setManager(empId, null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-tree"] });
      setRemoveEmp(null);
      toast.success("Employee removed from team");
    },
    onError: (e) => toast.error("Failed", e?.response?.data?.detail),
  });

  // ── Helpers ────────────────────────────────────────────────────
  const directReports = (managerId) =>
    employeeOnly.filter((u) => u.manager_id === managerId);

  const availableToAdd = (managerId) =>
    employeeOnly.filter(
      (u) =>
        u.id !== managerId &&
        u.manager_id !== managerId &&
        u.role !== "super_admin"
    );

  // ── Filtered table rows ────────────────────────────────────────
  const filtered = employeeOnly.filter((u) => {
    const matchSearch =
      !search ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.employee_code.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "managers" && u.can_approve_timesheets) ||
      (filter === "employees" && !u.can_approve_timesheets);
    return matchSearch && matchFilter;
  });

  const managerCount = employeeOnly.filter((u) => u.can_approve_timesheets).length;
  const withManagerCount = employeeOnly.filter((u) => u.manager_id).length;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Keep reportsModal in sync after cache refresh
  const liveManager = reportsModal
    ? employeeOnly.find((u) => u.id === reportsModal.id) ?? reportsModal
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Manager Setup</h1>
      </div>

      {/* Stats + Search bar — single horizontal row */}
      <div className="flex flex-wrap items-center gap-3">
        <StatPill icon={Users} label="Total" value={employeeOnly.length} color="blue" />
        <StatPill icon={UserCheck} label="Managers" value={managerCount} color="green" />
        <StatPill icon={GitBranch} label="With Manager" value={withManagerCount} color="amber" />
        <StatPill icon={Users} label="No Manager" value={employeeOnly.length - withManagerCount} color="red" />

        {/* Search + filter dropdown — grows to fill remaining space */}
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
            <Input
              placeholder="Search by name or code..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="managers">Managers</SelectItem>
              <SelectItem value="employees">Employees</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><SkeletonTable /></div>
          ) : (
            <>
              <table className="enterprise-table w-full">
                <thead>
                  <tr>
                    {["Employee", "Dept / Designation", "Reports To", "Check Reports", "Role", "Actions"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <UserCheck className="h-10 w-10 text-border-color mx-auto mb-3" />
                        <p className="text-text-secondary font-medium">No employees found</p>
                        {employeeOnly.length === 0 && (
                          <p className="text-text-secondary text-sm mt-1">Add employees in User Management first</p>
                        )}
                      </td>
                    </tr>
                  ) : paginated.map((emp) => {
                    const reportCount = directReports(emp.id).length;
                    return (
                      <tr key={emp.id} className={emp.can_approve_timesheets ? "bg-green-50/30" : ""}>
                        {/* Employee */}
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{
                                background: emp.can_approve_timesheets
                                  ? "linear-gradient(135deg,#10B981,#059669)"
                                  : "linear-gradient(135deg,#2563EB,#1D4ED8)",
                              }}>
                              {emp.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text-primary">{emp.full_name}</p>
                              <p className="text-xs text-text-secondary font-mono">{emp.employee_code}</p>
                            </div>
                          </div>
                        </td>

                        {/* Dept / Designation */}
                        <td>
                          <p className="text-sm text-text-secondary">{emp.department || "—"}</p>
                          {emp.designation && <p className="text-xs text-text-secondary/60">{emp.designation}</p>}
                        </td>

                        {/* Reports To */}
                        <td>
                          {emp.manager_name ? (
                            <span className="text-sm font-medium text-text-primary">{emp.manager_name}</span>
                          ) : (
                            <span className="text-xs text-text-secondary/50 italic">Not assigned</span>
                          )}
                        </td>

                        {/* Check Reports — clickable only for managers */}
                        <td>
                          {emp.can_approve_timesheets ? (
                            <button
                              onClick={() => { setReportsModal(emp); setAddEmpId(""); }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
                              style={{ background: "rgba(20,87,232,0.10)", color: "#1457E8" }}
                            >
                              <Eye className="h-3 w-3" />
                              {reportCount} report{reportCount !== 1 ? "s" : ""}
                            </button>
                          ) : (
                            <span className="text-xs text-text-secondary/40">—</span>
                          )}
                        </td>

                        {/* Role badge */}
                        <td>
                          {emp.can_approve_timesheets ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background: "rgba(0,200,130,0.15)", color: "#006646" }}>
                              <CheckCircle className="h-3 w-3" /> Manager
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-text-secondary/60 bg-light-bg">
                              <XCircle className="h-3 w-3" /> Employee
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="flex items-center gap-1.5">
                            <Button size="sm" variant="outline"
                              onClick={() => {
                                setAssignModal(emp);
                                setSelectedManager(emp.manager_id ? String(emp.manager_id) : "none");
                              }}>
                              <GitBranch className="h-3 w-3 mr-1" />
                              {emp.manager_name ? "Change" : "Set"} Manager
                            </Button>
                            <Button size="sm"
                              variant={emp.can_approve_timesheets ? "destructive" : "success"}
                              onClick={() => toggleMutation.mutate({ userId: emp.id, canApprove: !emp.can_approve_timesheets })}
                              disabled={toggleMutation.isPending}
                              className="min-w-[88px]">
                              {emp.can_approve_timesheets
                                ? <><XCircle className="h-3 w-3" /> Remove</>
                                : <><CheckCircle className="h-3 w-3" /> Make Mgr</>}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtered.length > 0 && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-border-color">
                  <p className="text-sm text-text-secondary">
                    Showing <span className="font-semibold text-text-primary">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
                    <span className="font-semibold text-text-primary">{filtered.length}</span>
                    {managerCount > 0 && (
                      <span className="ml-2 text-xs" style={{ color: "#006646" }}>
                        · {managerCount} manager{managerCount !== 1 ? "s" : ""} configured
                      </span>
                    )}
                  </p>
                  {totalPages > 1 && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                      <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Check Reports Dialog ─────────────────────────────────── */}
      {reportsModal && liveManager && (
        <Dialog open={!!reportsModal} onOpenChange={(o) => { if (!o) { setReportsModal(null); setAddEmpId(""); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>
                  {liveManager.full_name.charAt(0).toUpperCase()}
                </div>
                Team of {liveManager.full_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Current team members */}
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  Current Team Members
                </p>
                {directReports(liveManager.id).length === 0 ? (
                  <div className="py-6 text-center rounded-xl border border-dashed border-border-color">
                    <Users className="h-8 w-8 text-border-color mx-auto mb-2" />
                    <p className="text-sm text-text-secondary">No employees assigned yet</p>
                    <p className="text-xs text-text-secondary/60 mt-0.5">Use the section below to add team members</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {directReports(liveManager.id).map((emp) => (
                      <div key={emp.id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border-color bg-light-bg/50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}>
                            {emp.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{emp.full_name}</p>
                            <p className="text-xs text-text-secondary font-mono">{emp.employee_code}
                              {emp.department ? ` · ${emp.department}` : ""}
                            </p>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-danger hover:bg-red-50"
                          title="Remove from team"
                          onClick={() => setRemoveEmp(emp)}
                          disabled={removeReportMutation.isPending}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add employee */}
              <div className="border-t border-border-color pt-4">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  Add Employee to Team
                </p>
                <div className="flex gap-2">
                  <Select value={addEmpId} onValueChange={setAddEmpId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select employee to add..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableToAdd(liveManager.id).length === 0 ? (
                        <SelectItem value="__none__" disabled>All employees already assigned</SelectItem>
                      ) : (
                        availableToAdd(liveManager.id).map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.full_name}
                            {u.manager_name ? ` (currently under ${u.manager_name})` : " (no manager)"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    disabled={!addEmpId || addEmpId === "__none__" || addReportMutation.isPending}
                    onClick={() =>
                      addReportMutation.mutate({ empId: parseInt(addEmpId, 10), managerId: liveManager.id })
                    }>
                    <UserPlus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <p className="text-xs text-text-secondary/60 mt-1.5">
                  If the selected employee already has a different manager, they will be moved to this team.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setReportsModal(null); setAddEmpId(""); }}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Change Manager Dialog ────────────────────────────────── */}
      {assignModal && (
        <Dialog open={!!assignModal} onOpenChange={(o) => { if (!o) setAssignModal(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {assignModal.manager_id ? "Change Manager" : "Set Manager"} — {assignModal.full_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-light-bg border border-border-color">
                <p className="text-sm font-semibold text-text-primary">{assignModal.full_name}</p>
                <p className="text-xs text-text-secondary">
                  {assignModal.employee_code} · {assignModal.department || "No department"}
                </p>
                {assignModal.manager_name && (
                  <p className="text-xs text-text-secondary mt-1">
                    Current manager: <span className="font-medium">{assignModal.manager_name}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Reporting Manager</label>
                <Select value={selectedManager} onValueChange={setSelectedManager}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No Manager —</SelectItem>
                    {employeeOnly
                      .filter((u) => u.id !== assignModal.id)
                      .map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.full_name}{u.can_approve_timesheets ? " · Manager" : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Auto-grant notice */}
              {(() => {
                if (!selectedManager || selectedManager === "none") return null;
                const mgr = employeeOnly.find((u) => u.id === parseInt(selectedManager, 10));
                if (mgr && !mgr.can_approve_timesheets) {
                  return (
                    <div className="flex items-start gap-2 p-3 rounded-lg border"
                      style={{ background: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.2)" }}>
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-emerald-700">
                        <span className="font-semibold">{mgr.full_name}</span> will automatically receive Manager (approver) access.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignModal(null)}>Cancel</Button>
              <Button onClick={() => {
                const managerId = selectedManager === "none" ? null : parseInt(selectedManager, 10);
                setManagerMutation.mutate({ userId: assignModal.id, managerId });
              }} loading={setManagerMutation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={!!removeEmp}
        onOpenChange={(o) => { if (!o) setRemoveEmp(null); }}
        title="Remove this employee from the team?"
        description={removeEmp ? `${removeEmp.full_name} will no longer report to this manager.` : ""}
        confirmLabel="Remove"
        onConfirm={() => removeReportMutation.mutate(removeEmp.id)}
        loading={removeReportMutation.isPending}
      />
    </div>
  );
}

function StatPill({ icon: Icon, label, value, color }) {
  const colors = {
    blue:  { bg: "rgba(20,87,232,0.10)",  text: "#1457E8",  border: "rgba(20,87,232,0.18)" },
    green: { bg: "rgba(16,185,129,0.10)", text: "#065F46",  border: "rgba(16,185,129,0.20)" },
    amber: { bg: "rgba(217,119,6,0.10)",  text: "#92400E",  border: "rgba(217,119,6,0.20)" },
    red:   { bg: "rgba(239,68,68,0.10)",  text: "#991B1B",  border: "rgba(239,68,68,0.18)" },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-shrink-0"
      style={{ background: c.bg, borderColor: c.border }}>
      <Icon className="h-4 w-4 flex-shrink-0" style={{ color: c.text }} />
      <span className="text-xs text-text-secondary whitespace-nowrap">{label}</span>
      <span className="text-sm font-bold" style={{ color: c.text }}>{value}</span>
    </div>
  );
}
