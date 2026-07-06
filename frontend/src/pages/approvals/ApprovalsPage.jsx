import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Unlock, Filter, CalendarDays, CheckSquare2, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SkeletonTable } from "@/components/shared/PageLoader";
import { approvalsService } from "@/services/approvals.service";
import { useToast } from "@/hooks/use-toast";

export function ApprovalsPage() {
  const [tab, setTab] = useState("pending");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [actionModal, setActionModal] = useState(null);
  const [comment, setComment] = useState("");
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["approvals", tab, statusFilter, page],
    queryFn: () => tab === "pending"
      ? approvalsService.pending({ page, page_size: 100 })
      : approvalsService.all({ status: statusFilter || undefined, page, page_size: 15 }),
    placeholderData: (prev) => prev,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, comment }) => approvalsService.approve(id, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setActionModal(null); setComment("");
      toast.success("Timesheet approved!");
    },
    onError: (e) => toast.error("Failed", e?.response?.data?.detail),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }) => approvalsService.reject(id, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      setActionModal(null); setComment("");
      toast.success("Timesheet rejected");
    },
    onError: (e) => toast.error("Failed", e?.response?.data?.detail),
  });

  const unlockMutation = useMutation({
    mutationFn: ({ id, comment }) => approvalsService.unlock(id, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      setActionModal(null); setComment("");
      toast.success("Timesheet unlocked");
    },
    onError: (e) => toast.error("Failed", e?.response?.data?.detail),
  });

  const approveWeekMutation = useMutation({
    mutationFn: (weekStart) => approvalsService.approveWeek(weekStart),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Week approved — ${result.approved_count} timesheet(s) approved`);
    },
    onError: (e) => toast.error("Failed", e?.response?.data?.detail),
  });

  const handleAction = () => {
    if (!actionModal) return;
    const { type, header } = actionModal;
    if (type === "reject" && !comment.trim()) { toast.error("Rejection comment is required"); return; }
    if (type === "approve") approveMutation.mutate({ id: header.id, comment });
    else if (type === "reject") rejectMutation.mutate({ id: header.id, comment });
    else unlockMutation.mutate({ id: header.id, comment });
  };

  const isActionLoading = approveMutation.isPending || rejectMutation.isPending || unlockMutation.isPending;

  // Group pending timesheets by week_start_date
  const weekGroups = (() => {
    if (tab !== "pending") return null;
    const items = data?.items || [];
    const map = {};
    for (const ts of items) {
      const key = ts.week_start_date;
      if (!map[key]) map[key] = [];
      map[key].push(ts);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  })();

  const toggleWeek = (key) => setExpandedWeeks((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Team Timesheets</h1>
          <p className="text-text-secondary text-sm mt-0.5">Review and approve timesheets submitted by your team — organised by week</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-color">
        {[{ key: "pending", label: "Pending Review" }, { key: "all", label: "All Timesheets" }].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary"}`}
          >
            {t.label}
            {t.key === "pending" && (data?.total || 0) > 0 && tab === "pending" && (
              <span className="ml-2 bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">{data.total}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Pending tab — grouped by week ── */}
      {tab === "pending" && (
        isLoading ? (
          <Card><CardContent className="p-6"><SkeletonTable /></CardContent></Card>
        ) : !weekGroups || weekGroups.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
              <p className="text-text-primary font-semibold text-lg">All caught up!</p>
              <p className="text-text-secondary text-sm mt-1">No timesheets pending review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {weekGroups.map(([weekStart, items]) => {
              const weekEnd = items[0]?.week_end_date || "";
              const totalHours = items.reduce((s, t) => s + Number(t.total_hours), 0);
              const isExpanded = expandedWeeks[weekStart] !== false; // default expanded
              return (
                <Card key={weekStart} className="overflow-hidden">
                  {/* Week header bar */}
                  <div
                    className="flex items-center gap-3 px-5 py-3 cursor-pointer select-none"
                    style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--surface-border)" }}
                    onClick={() => toggleWeek(weekStart)}
                  >
                    <CalendarDays className="h-4 w-4 flex-shrink-0" style={{ color: "#2563EB" }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-text-primary">
                        Week of {weekStart} – {weekEnd}
                      </span>
                      <span className="ml-3 text-xs text-text-secondary">
                        {items.length} employee{items.length !== 1 ? "s" : ""} · {totalHours.toFixed(1)}h total
                      </span>
                    </div>
                    {/* Approve All for Week */}
                    <Button
                      size="sm"
                      variant="success"
                      loading={approveWeekMutation.isPending}
                      onClick={(e) => { e.stopPropagation(); approveWeekMutation.mutate(weekStart); }}
                      className="flex-shrink-0"
                    >
                      <CheckSquare2 className="h-3.5 w-3.5" />
                      Approve All for Week
                    </Button>
                    <div className="flex-shrink-0 text-text-secondary">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </div>

                  {/* Rows */}
                  {isExpanded && (
                    <table className="w-full">
                      <thead className="bg-light-bg border-b border-border-color">
                        <tr>
                          {["Employee", "Hours", "Status", "Submitted", "Notes", "Actions"].map((h) => (
                            <th key={h} className="text-left text-xs font-semibold text-text-secondary px-5 py-2.5">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-color">
                        {items.map((ts) => (
                          <tr key={ts.id} className="hover:bg-light-bg transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                  {(ts.employee_name || "U").charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-text-primary">{ts.employee_name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-sm font-bold text-text-primary tabular-nums">{Number(ts.total_hours).toFixed(1)}h</td>
                            <td className="px-5 py-3"><StatusBadge status={ts.status} /></td>
                            <td className="px-5 py-3 text-xs text-text-secondary">
                              {ts.submitted_at ? format(new Date(ts.submitted_at), "MMM d, HH:mm") : "—"}
                            </td>
                            <td className="px-5 py-3 text-xs text-text-secondary max-w-[140px]">
                              {ts.rejection_reason && (
                                <span className="text-danger truncate block" title={ts.rejection_reason}>{ts.rejection_reason}</span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex gap-1">
                                <Button size="sm" variant="success" onClick={() => { setActionModal({ type: "approve", header: ts }); setComment(""); }}>
                                  <CheckCircle className="h-3 w-3" /> Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => { setActionModal({ type: "reject", header: ts }); setComment(""); }}>
                                  <XCircle className="h-3 w-3" /> Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* ── All tab — flat table with filter ── */}
      {tab === "all" && (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-text-secondary" />
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="resubmitted">Resubmitted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {isLoading ? <div className="p-6"><SkeletonTable /></div> : (
                <>
                  <table className="w-full">
                    <thead className="bg-light-bg border-b border-border-color">
                      <tr>
                        {["Employee", "Week", "Hours", "Status", "Submitted", "Notes", "Actions"].map((h) => (
                          <th key={h} className="text-left text-xs font-semibold text-text-secondary px-5 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                      {(!data?.items || data.items.length === 0) ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center">
                            <p className="text-text-secondary font-medium">No timesheets found</p>
                          </td>
                        </tr>
                      ) : data.items.map((ts) => (
                        <tr key={ts.id} className="hover:bg-light-bg transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                {(ts.employee_name || "U").charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-text-primary">{ts.employee_name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-text-secondary">{ts.week_start_date} – {ts.week_end_date}</td>
                          <td className="px-5 py-3 text-sm font-bold text-text-primary tabular-nums">{Number(ts.total_hours).toFixed(1)}h</td>
                          <td className="px-5 py-3"><StatusBadge status={ts.status} /></td>
                          <td className="px-5 py-3 text-xs text-text-secondary">
                            {ts.submitted_at ? format(new Date(ts.submitted_at), "MMM d, HH:mm") : "—"}
                          </td>
                          <td className="px-5 py-3 text-xs text-text-secondary max-w-[160px]">
                            {ts.rejection_reason && (
                              <span className="text-danger truncate block" title={ts.rejection_reason}>{ts.rejection_reason}</span>
                            )}
                            {ts.is_locked && <Badge variant="warning" className="text-[10px]">Locked</Badge>}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex gap-1">
                              {(ts.status === "submitted" || ts.status === "resubmitted") && (
                                <>
                                  <Button size="sm" variant="success" onClick={() => { setActionModal({ type: "approve", header: ts }); setComment(""); }}>
                                    <CheckCircle className="h-3 w-3" /> Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => { setActionModal({ type: "reject", header: ts }); setComment(""); }}>
                                    <XCircle className="h-3 w-3" /> Reject
                                  </Button>
                                </>
                              )}
                              {ts.status === "approved" && ts.is_locked && (
                                <Button size="sm" variant="outline" onClick={() => { setActionModal({ type: "unlock", header: ts }); setComment(""); }}>
                                  <Unlock className="h-3 w-3" /> Unlock
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data && data.total > 15 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-border-color">
                      <p className="text-sm text-text-secondary">Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, data.total)} of {data.total}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                        <Button size="sm" variant="outline" disabled={page * 15 >= data.total} onClick={() => setPage((p) => p + 1)}>Next</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Action Modal */}
      {actionModal && (
        <Dialog open={!!actionModal} onOpenChange={(o) => { if (!o) { setActionModal(null); setComment(""); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {actionModal.type === "approve" && "Approve Timesheet"}
                {actionModal.type === "reject" && "Reject Timesheet"}
                {actionModal.type === "unlock" && "Unlock Timesheet"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-light-bg border border-border-color space-y-1.5">
                <p className="text-sm font-semibold text-text-primary">{actionModal.header.employee_name}</p>
                <p className="text-xs text-text-secondary">{actionModal.header.week_start_date} – {actionModal.header.week_end_date}</p>
                <p className="text-sm font-bold text-primary tabular-nums">{Number(actionModal.header.total_hours).toFixed(1)}h total</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">
                  Comment {actionModal.type === "reject" && <span className="text-danger">*</span>}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full border border-border-color rounded-xl px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder={actionModal.type === "reject" ? "Reason for rejection (required)" : "Optional comment..."}
                />
              </div>
              {actionModal.type === "reject" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                  <XCircle className="h-4 w-4 text-danger mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-danger">Rejection comment is mandatory and will be shown to the employee.</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setActionModal(null); setComment(""); }}>Cancel</Button>
              <Button
                onClick={handleAction}
                loading={isActionLoading}
                variant={actionModal.type === "approve" ? "success" : actionModal.type === "reject" ? "destructive" : "default"}
              >
                {actionModal.type === "approve" && <><CheckCircle className="h-4 w-4" /> Approve</>}
                {actionModal.type === "reject" && <><XCircle className="h-4 w-4" /> Reject</>}
                {actionModal.type === "unlock" && <><Unlock className="h-4 w-4" /> Unlock</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
