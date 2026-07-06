import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, PowerOff, FolderKanban } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projectsService } from "@/services/projects.service";
import { usersService } from "@/services/users.service";
import { useToast } from "@/hooks/use-toast";
import { SkeletonTable } from "@/components/shared/PageLoader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuthStore } from "@/store/auth.store";

const schema = z.object({
  project_code: z.string().min(1),
  project_name: z.string().min(2),
  customer_name: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().optional(),
  description: z.string().optional(),
  project_manager_id: z.number().optional(),
  status: z.enum(["active", "inactive", "completed", "on_hold"]).optional(),
});

const statusColors = {
  active: "success", inactive: "destructive", completed: "submitted", on_hold: "warning",
};

export function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deactivateProject, setDeactivateProject] = useState(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAdmin = useAuthStore((s) => s.user?.role === "super_admin" || s.user?.role === "admin");

  const { data, isLoading } = useQuery({
    queryKey: ["projects", search, statusFilter, page],
    queryFn: () => projectsService.list({ search, status: statusFilter || undefined, page, page_size: 15 }),
    placeholderData: (prev) => prev,
  });

  const { data: managers } = useQuery({ queryKey: ["users-dropdown"], queryFn: usersService.dropdown, enabled: isAdmin });

  const createMutation = useMutation({
    mutationFn: (d) => projectsService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); setCreateOpen(false); toast.success("Project created"); },
    onError: (e) => toast.error("Failed", e?.response?.data?.detail),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }) => projectsService.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); setEditProject(null); toast.success("Project updated"); },
    onError: (e) => toast.error("Failed", e?.response?.data?.detail),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => projectsService.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setDeactivateProject(null);
      toast.success("Project deactivated");
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary flex-shrink-0">Project Management</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary pointer-events-none" />
            <Input placeholder="Search projects..." className="pl-8 h-8 text-sm" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-32 h-8 text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Add Project</Button>}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-6"><SkeletonTable /></div> : (
            <table className="w-full">
              <thead className="bg-light-bg border-b border-border-color">
                <tr>
                  {["Code", "Project Name", "Customer", "Manager", "Dates", "Status", ...(isAdmin ? ["Actions"] : [])].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-text-secondary px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {(data?.items || []).map((proj) => (
                  <tr key={proj.id} className="hover:bg-light-bg transition-colors">
                    <td className="px-5 py-3 text-sm font-mono text-text-secondary">{proj.project_code}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FolderKanban className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{proj.project_name}</p>
                          {proj.description && <p className="text-xs text-text-secondary truncate max-w-[200px]">{proj.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-text-secondary">{proj.customer_name}</td>
                    <td className="px-5 py-3 text-sm text-text-secondary">{proj.manager_name || "—"}</td>
                    <td className="px-5 py-3 text-xs text-text-secondary">
                      <div>{proj.start_date}</div>
                      {proj.end_date && <div className="text-text-secondary/70">→ {proj.end_date}</div>}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={statusColors[proj.status]} className="capitalize">{proj.status.replace("_", " ")}</Badge>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditProject(proj)}><Edit className="h-4 w-4" /></Button>
                          {proj.status === "active" && (
                            <Button size="icon" variant="ghost" onClick={() => setDeactivateProject(proj)}>
                              <PowerOff className="h-4 w-4 text-danger" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {data && data.total > 15 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border-color">
              <p className="text-sm text-text-secondary">Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, data.total)} of {data.total}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button size="sm" variant="outline" disabled={page * 15 >= data.total} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ProjectFormDialog open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={(d) => createMutation.mutate(d)}
        loading={createMutation.isPending} title="Create Project" managers={managers || []} />
      {editProject && (
        <ProjectFormDialog open={!!editProject} onClose={() => setEditProject(null)}
          onSubmit={(d) => updateMutation.mutate({ id: editProject.id, d })}
          loading={updateMutation.isPending} title="Edit Project" managers={managers || []}
          defaultValues={editProject} isEdit />
      )}

      <ConfirmDialog
        open={!!deactivateProject}
        onOpenChange={(o) => { if (!o) setDeactivateProject(null); }}
        title="Deactivate this project?"
        description={deactivateProject ? `"${deactivateProject.project_name}" will be marked inactive and hidden from active project selections.` : ""}
        confirmLabel="Deactivate"
        onConfirm={() => deactivateMutation.mutate(deactivateProject.id)}
        loading={deactivateMutation.isPending}
      />
    </div>
  );
}

function ProjectFormDialog({ open, onClose, onSubmit, loading, title, managers, defaultValues, isEdit = false }) {
  const { register, handleSubmit, control, reset } = useForm({ resolver: zodResolver(schema), defaultValues: defaultValues || {} });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); reset(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {!isEdit && (
              <div className="space-y-1.5">
                <Label>Project Code *</Label>
                <Input placeholder="PRJ001" {...register("project_code")} />
              </div>
            )}
            <div className={isEdit ? "col-span-2" : ""}>
              <Label>Project Name *</Label>
              <Input placeholder="E-Commerce Platform" {...register("project_name")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Customer Name *</Label>
            <Input placeholder="Acme Corp" {...register("customer_name")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Date *</Label>
              <Input type="date" {...register("start_date")} />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" {...register("end_date")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Project Manager</Label>
            <Controller name="project_manager_id" control={control} render={({ field }) => (
              <Select value={field.value?.toString()} onValueChange={(v) => field.onChange(parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                <SelectContent>
                  {managers.map((m) => <SelectItem key={m.id} value={m.id.toString()}>{m.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>
          {isEdit && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller name="status" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <textarea className="w-full border border-border-color rounded-xl px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-text-secondary/60" placeholder="Brief project description..." {...register("description")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>{isEdit ? "Save Changes" : "Create Project"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
