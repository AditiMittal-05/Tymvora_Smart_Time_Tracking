import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, ToggleLeft, ToggleRight } from "lucide-react";
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
import { activitiesService } from "@/services/activities.service";
import { useToast } from "@/hooks/use-toast";
import { SkeletonTable } from "@/components/shared/PageLoader";

const schema = z.object({
  activity_code: z.string().min(1),
  activity_name: z.string().min(2),
  category: z.string().optional(),
  is_billable: z.boolean(),
  status: z.enum(["active", "inactive"]).optional(),
});

export function ActivitiesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["activities", search, page],
    queryFn: () => activitiesService.list({ search, page, page_size: 20 }),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (d) => activitiesService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["activities"] }); setCreateOpen(false); toast.success("Activity created"); },
    onError: (e) => toast.error("Failed", e?.response?.data?.detail),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }) => activitiesService.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["activities"] }); setEditActivity(null); toast.success("Activity updated"); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) =>
      active ? activitiesService.activate(id) : activitiesService.deactivate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["activities"] }); toast.success("Status updated"); },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary flex-shrink-0">Activity Management</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary pointer-events-none" />
            <Input placeholder="Search activities..." className="pl-8 h-8 text-sm" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Add Activity</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-6"><SkeletonTable /></div> : (
            <>
              <table className="enterprise-table w-full">
                <thead>
                  <tr>
                    {["Code", "Activity Name", "Category", "Billable", "Status", "Actions"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.items || []).length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-text-secondary text-sm">No activities found</td></tr>
                  ) : (data?.items || []).map((act) => (
                    <tr key={act.id}>
                      <td className="text-sm font-mono text-text-secondary">{act.activity_code}</td>
                      <td className="text-sm font-medium text-text-primary">{act.activity_name}</td>
                      <td className="text-sm text-text-secondary capitalize">{act.category || "—"}</td>
                      <td>
                        <Badge variant={act.is_billable ? "success" : "outline"}>{act.is_billable ? "Billable" : "Non-billable"}</Badge>
                      </td>
                      <td>
                        <Badge variant={act.status === "active" ? "success" : "destructive"} className="capitalize">{act.status}</Badge>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditActivity(act)}><Edit className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => toggleMutation.mutate({ id: act.id, active: act.status === "inactive" })} title={act.status === "active" ? "Deactivate" : "Activate"}>
                            {act.status === "active" ? <ToggleRight className="h-4 w-4 text-secondary" /> : <ToggleLeft className="h-4 w-4 text-text-secondary" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data && data.total > 20 && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-border-color">
                  <p className="text-sm text-text-secondary">
                    Showing <span className="font-semibold text-text-primary">{(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)}</span> of{" "}
                    <span className="font-semibold text-text-primary">{data.total}</span>
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                    <Button size="sm" variant="outline" disabled={page * 20 >= data.total} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ActivityFormDialog open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={(d) => createMutation.mutate(d)} loading={createMutation.isPending} title="Create Activity" />
      {editActivity && (
        <ActivityFormDialog open={!!editActivity} onClose={() => setEditActivity(null)} onSubmit={(d) => updateMutation.mutate({ id: editActivity.id, d })} loading={updateMutation.isPending} title="Edit Activity" defaultValues={editActivity} isEdit />
      )}
    </div>
  );
}

function ActivityFormDialog({ open, onClose, onSubmit, loading, title, defaultValues, isEdit = false }) {
  const { register, handleSubmit, control, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ? { ...defaultValues, is_billable: defaultValues.is_billable ?? true } : { is_billable: true },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); reset(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Activity Code *</Label>
              <Input placeholder="ACT013" {...register("activity_code")} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Activity Name *</Label>
            <Input placeholder="Code Review" {...register("activity_name")} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input placeholder="technical" {...register("category")} />
          </div>
          <div className="space-y-1.5">
            <Label>Billable</Label>
            <Controller name="is_billable" control={control} render={({ field }) => (
              <Select value={field.value ? "true" : "false"} onValueChange={(v) => field.onChange(v === "true")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Billable</SelectItem>
                  <SelectItem value="false">Non-billable</SelectItem>
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
                  </SelectContent>
                </Select>
              )} />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>{isEdit ? "Save" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
