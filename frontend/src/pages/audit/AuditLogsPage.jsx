import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkeletonTable } from "@/components/shared/PageLoader";
import { auditService } from "@/services/audit.service";

const ACTION_COLORS = {
  CREATE: { bg: "rgba(16,185,129,0.1)", color: "#065F46" },
  UPDATE: { bg: "rgba(59,130,246,0.1)", color: "#1E40AF" },
  DELETE: { bg: "rgba(239,68,68,0.1)", color: "#991B1B" },
  STATUS_CHANGE: { bg: "rgba(245,158,11,0.1)", color: "#92400E" },
  LOGIN: { bg: "rgba(139,92,246,0.1)", color: "#5B21B6" },
  APPROVE: { bg: "rgba(16,185,129,0.1)", color: "#065F46" },
  REJECT: { bg: "rgba(239,68,68,0.1)", color: "#991B1B" },
};

const ENTITY_TYPES = ["User", "Project", "Activity", "Timesheet", "Approval"];

function ActionBadge({ action }) {
  const style = ACTION_COLORS[action] || { bg: "rgba(100,116,139,0.1)", color: "#475569" };
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={style}>
      {action}
    </span>
  );
}

export function AuditLogsPage() {
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", entityType, page],
    queryFn: () => auditService.list({
      entity_type: entityType || undefined,
      page,
      page_size: PAGE_SIZE,
    }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with inline filter */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #D97706, #B45309)" }}>
            <Shield className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Audit Logs</h1>
        </div>
        <Select value={entityType || "all"} onValueChange={(v) => { setEntityType(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-36 h-8 text-sm"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ENTITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" style={{ color: "#D97706" }} />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><SkeletonTable /></div>
          ) : (
            <>
              <table className="enterprise-table w-full">
                <thead>
                  <tr>
                    {["Time", "Actor", "Action", "Entity", "ID", "Changes"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(!data?.items || data.items.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-text-secondary text-sm">
                        No audit logs found
                      </td>
                    </tr>
                  ) : data.items.map((log) => (
                    <tr key={log.id}>
                      <td className="text-xs text-text-secondary tabular-nums whitespace-nowrap">
                        {log.created_at
                          ? format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")
                          : "—"}
                      </td>
                      <td>
                        <span className="text-sm font-medium text-text-primary">
                          {log.actor_name || <span className="text-text-secondary/50">System</span>}
                        </span>
                      </td>
                      <td>
                        <ActionBadge action={log.action} />
                      </td>
                      <td>
                        <Badge variant="outline" className="text-xs font-mono">
                          {log.entity_type}
                        </Badge>
                      </td>
                      <td className="text-sm text-text-secondary tabular-nums">
                        {log.entity_id ?? "—"}
                      </td>
                      <td className="max-w-xs">
                        <ChangeSummary old={log.old_values} next={log.new_values} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data && data.total > PAGE_SIZE && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-border-color">
                  <p className="text-sm text-text-secondary">
                    Page <span className="font-semibold text-text-primary">{page}</span> of{" "}
                    <span className="font-semibold text-text-primary">{data.total_pages}</span>
                    {" "}({data.total} records)
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                    <Button size="sm" variant="outline" disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ChangeSummary({ old: oldVals, next: newVals }) {
  if (!oldVals && !newVals) return <span className="text-text-secondary/40 text-xs">—</span>;
  const keys = [...new Set([...Object.keys(oldVals || {}), ...Object.keys(newVals || {})])];
  if (keys.length === 0) return <span className="text-text-secondary/40 text-xs">—</span>;
  return (
    <div className="space-y-0.5">
      {keys.slice(0, 3).map((k) => (
        <p key={k} className="text-xs text-text-secondary truncate">
          <span className="font-medium text-text-primary">{k}:</span>{" "}
          {oldVals?.[k] !== undefined && (
            <span className="line-through text-danger/70">{String(oldVals[k])}</span>
          )}
          {oldVals?.[k] !== undefined && newVals?.[k] !== undefined && " → "}
          {newVals?.[k] !== undefined && (
            <span className="text-emerald-600">{String(newVals[k])}</span>
          )}
        </p>
      ))}
      {keys.length > 3 && (
        <p className="text-xs text-text-secondary/50">+{keys.length - 3} more fields</p>
      )}
    </div>
  );
}
