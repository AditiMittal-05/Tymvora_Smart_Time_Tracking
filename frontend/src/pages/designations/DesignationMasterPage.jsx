import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, PowerOff, Briefcase, Power } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { designationService } from "@/services/designation.service";
import { useToast } from "@/hooks/use-toast";
import { SkeletonTable } from "@/components/shared/PageLoader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

const createSchema = z.object({
  designation_code: z.string().min(1, "Code is required").max(20),
  designation_name: z.string().min(2, "Name must be at least 2 characters"),
});

const editSchema = z.object({
  designation_name: z.string().min(2, "Name must be at least 2 characters"),
});

export function DesignationMasterPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deactivateItem, setDeactivateItem] = useState(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["designations", search, statusFilter, page],
    queryFn: () => designationService.list({ search, status: statusFilter || undefined, page, page_size: 15 }),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (d) => designationService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["designations"] }); setCreateOpen(false); toast.success("Designation created"); },
    onError: (e) => toast.error("Failed", e?.response?.data?.detail),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }) => designationService.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["designations"] }); setEditItem(null); toast.success("Designation updated"); },
    onError: (e) => toast.error("Failed", e?.response?.data?.detail),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) => active ? designationService.activate(id) : designationService.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["designations"] });
      setDeactivateItem(null);
      toast.success("Status updated");
    },
    onError: (e) => toast.error("Failed", e?.response?.data?.detail),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary flex-shrink-0">Designation Master</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary pointer-events-none" />
            <Input
              placeholder="Search designations..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-32 h-8 text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add Designation
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><SkeletonTable /></div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-light-bg border-b border-border-color">
                  <tr>
                    {["Code", "Designation Name", "Status", "Created", "Actions"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-text-secondary px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {(!data?.items || data.items.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-light-bg flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-text-secondary/40" />
                          </div>
                          <p className="text-text-secondary font-medium">No designations found</p>
                          <p className="text-text-secondary text-sm">Add designations to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (data.items || []).map((item) => (
                    <tr key={item.id} className="hover:bg-light-bg transition-colors">
                      <td className="px-5 py-3 text-sm font-mono text-text-secondary">{item.designation_code}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-sm font-medium text-text-primary">{item.designation_name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={item.status === "active" ? "success" : "destructive"} className="capitalize">
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-xs text-text-secondary">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditItem(item)} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title={item.status === "active" ? "Deactivate" : "Activate"}
                            onClick={() => item.status === "active"
                              ? setDeactivateItem(item)
                              : toggleMutation.mutate({ id: item.id, active: true })}
                          >
                            {item.status === "active"
                              ? <PowerOff className="h-4 w-4 text-danger" />
                              : <Power className="h-4 w-4 text-emerald-600" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data && data.total > 15 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-border-color">
                  <p className="text-sm text-text-secondary">
                    Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, data.total)} of {data.total}
                  </p>
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

      <DesignationFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(d) => createMutation.mutate(d)}
        loading={createMutation.isPending}
        title="Add Designation"
        isEdit={false}
      />
      {editItem && (
        <DesignationFormDialog
          open={!!editItem}
          onClose={() => setEditItem(null)}
          onSubmit={(d) => updateMutation.mutate({ id: editItem.id, d })}
          loading={updateMutation.isPending}
          title="Edit Designation"
          defaultValues={editItem}
          isEdit
        />
      )}

      <ConfirmDialog
        open={!!deactivateItem}
        onOpenChange={(o) => { if (!o) setDeactivateItem(null); }}
        title="Deactivate this designation?"
        description={deactivateItem ? `"${deactivateItem.designation_name}" will no longer be selectable for new assignments.` : ""}
        confirmLabel="Deactivate"
        onConfirm={() => toggleMutation.mutate({ id: deactivateItem.id, active: false })}
        loading={toggleMutation.isPending}
      />
    </div>
  );
}

function DesignationFormDialog({ open, onClose, onSubmit, loading, title, defaultValues, isEdit }) {
  const schema = isEdit ? editSchema : createSchema;
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {},
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); reset(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Designation Code *</Label>
              <Input placeholder="DES001" {...register("designation_code")} />
              {errors.designation_code && <p className="text-xs text-danger">{errors.designation_code.message}</p>}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Designation Name *</Label>
            <Input placeholder="Senior Developer" {...register("designation_name")} />
            {errors.designation_name && <p className="text-xs text-danger">{errors.designation_name.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>{isEdit ? "Save Changes" : "Add Designation"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
