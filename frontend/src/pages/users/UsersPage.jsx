import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, UserCheck, UserX, Edit, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usersService } from "@/services/users.service";
import { useToast } from "@/hooks/use-toast";
import { SkeletonTable } from "@/components/shared/PageLoader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PasswordStrengthBar } from "@/components/shared/PasswordStrengthBar";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const passwordRule = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[^A-Za-z0-9]/, "Must contain a special character (!@#$%^&*)");

const phoneRule = z
  .string()
  .optional()
  .refine(
    (v) => !v || v.trim() === "" || /^(\+?91[\-\s]?)?[6-9]\d{9}$/.test(v.replace(/[\s\-]/g, "")),
    "Enter a valid 10-digit Indian mobile number"
  );

const createSchema = z.object({
  employee_code: z.string().min(1, "Employee code is required"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["employee", "super_admin"]),
  password: passwordRule,
  confirm_password: z.string(),
  department: z.string().optional(),
  designation: z.string().optional(),
  phone: phoneRule,
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

const editSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").optional(),
  email: z.string().email("Enter a valid email address").optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  phone: phoneRule,
  status: z.enum(["active", "inactive"]).optional(),
});

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deactivateUser, setDeactivateUser] = useState(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["users", search, statusFilter, page],
    queryFn: () => usersService.list({ search, status: statusFilter || undefined, page, page_size: 15 }),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (d) => usersService.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setCreateOpen(false);
      toast.success("User created", "Welcome email with credentials has been sent.");
    },
    onError: (e) => toast.error("Failed to create user", e?.response?.data?.detail),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }) => usersService.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setEditUser(null); toast.success("User updated"); },
    onError: (e) => toast.error("Failed", e?.response?.data?.detail),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, active }) => active ? usersService.activate(id) : usersService.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setDeactivateUser(null);
      toast.success("Status updated");
    },
    onError: (e) => toast.error("Failed", e?.response?.data?.detail || "Cannot modify this user"),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight flex-shrink-0">User Management</h1>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary pointer-events-none" />
            <Input
              placeholder="Search users..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-32 h-8 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add User
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><SkeletonTable /></div>
          ) : (
            <>
              <table className="enterprise-table w-full">
                <thead>
                  <tr>
                    {["Code", "Name", "Email", "Department", "Manager", "Status", "Actions"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(!data?.items || data.items.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-light-bg flex items-center justify-center">
                            <Search className="h-5 w-5 text-text-secondary/40" />
                          </div>
                          <p className="text-text-secondary font-medium">No users found</p>
                          <p className="text-text-secondary text-sm">Add users to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : data.items.map((user) => {
                    const isSA = user.role === "super_admin";
                    return (
                      <tr key={user.id}>
                        <td className="text-sm font-mono text-text-secondary">{user.employee_code}</td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{
                                background: isSA
                                  ? "linear-gradient(135deg, #D97706, #B45309)"
                                  : "linear-gradient(135deg, #2563EB, #10B981)"
                              }}
                            >
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                                {user.full_name}
                                {isSA && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "#92400E" }}>
                                    Super Admin
                                  </span>
                                )}
                                {user.can_approve_timesheets && !isSA && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.15)", color: "#065F46" }}>
                                    Manager
                                  </span>
                                )}
                              </p>
                              {user.designation && (
                                <p className="text-xs text-text-secondary">{user.designation}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-sm text-text-secondary">{user.email}</td>
                        <td className="text-sm text-text-secondary">{user.department || <span className="text-text-secondary/40">—</span>}</td>
                        <td className="text-sm text-text-secondary">{user.manager_name || <span className="text-text-secondary/40">—</span>}</td>
                        <td>
                          <Badge variant={user.status === "active" ? "success" : "destructive"} className="capitalize">
                            {user.status}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditUser(user)} title="Edit">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon" variant="ghost" className="h-8 w-8"
                              onClick={() => user.status === "active"
                                ? setDeactivateUser(user)
                                : toggleStatus.mutate({ id: user.id, active: true })}
                              title={user.status === "active" ? "Deactivate" : "Activate"}
                            >
                              {user.status === "active"
                                ? <UserX className="h-3.5 w-3.5 text-danger" />
                                : <UserCheck className="h-3.5 w-3.5 text-emerald-600" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {data && data.total > 15 && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-border-color">
                  <p className="text-sm text-text-secondary">
                    Showing <span className="font-semibold text-text-primary">{(page - 1) * 15 + 1}–{Math.min(page * 15, data.total)}</span> of{" "}
                    <span className="font-semibold text-text-primary">{data.total}</span>
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

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(d) => createMutation.mutate(d)}
        loading={createMutation.isPending}
      />

      {editUser && (
        <EditUserDialog
          open={!!editUser}
          onClose={() => setEditUser(null)}
          onSubmit={(d) => updateMutation.mutate({ id: editUser.id, d })}
          loading={updateMutation.isPending}
          defaultValues={editUser}
        />
      )}

      <ConfirmDialog
        open={!!deactivateUser}
        onOpenChange={(o) => { if (!o) setDeactivateUser(null); }}
        title="Deactivate this user?"
        description={deactivateUser ? `${deactivateUser.full_name} will no longer be able to log in or submit timesheets.` : ""}
        confirmLabel="Deactivate"
        onConfirm={() => toggleStatus.mutate({ id: deactivateUser.id, active: false })}
        loading={toggleStatus.isPending}
      />
    </div>
  );
}

function CreateUserDialog({ open, onClose, onSubmit, loading }) {
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, watch, reset, control, formState: { errors } } = useForm({
    resolver: zodResolver(createSchema), defaultValues: {role: "employee",},
  });
  const watchedPw = watch("password", "");

  const handleClose = () => { onClose(); reset(); };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <p className="text-sm text-text-secondary">A welcome email with login credentials will be sent to the employee.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Code + Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Employee Code *</Label>
              <Input placeholder="EMP001" {...register("employee_code")} />
              {errors.employee_code && <p className="text-xs text-danger">{errors.employee_code.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Full Name *</Label>
              <Input placeholder="John Doe" {...register("full_name")} />
              {errors.full_name && <p className="text-xs text-danger">{errors.full_name.message}</p>}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Email *</Label>
            <Input type="email" placeholder="john@gnxtsystems.com" {...register("email")} />
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Password *</Label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                placeholder="Set initial password"
                className="pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
            <PasswordStrengthBar password={watchedPw} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Confirm Password *</Label>
            <Input
              type={showPw ? "text" : "password"}
              placeholder="Repeat password"
              {...register("confirm_password")}
            />
            {errors.confirm_password && <p className="text-xs text-danger">{errors.confirm_password.message}</p>}
          </div>

          {/* Role */}
        <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Role *</Label>
            <Controller
             control={control}
             name="role"
             render={({ field }) => (
            <Select
             value={field.value}
             onValueChange={field.onChange}
            >
             <SelectTrigger>
               <SelectValue placeholder="Select Role" />
             </SelectTrigger>

             <SelectContent>
               <SelectItem value="employee">
                Employee
               </SelectItem>

               <SelectItem value="super_admin">
               Super Admin
               </SelectItem>

              </SelectContent>
            </Select>
           )}
          />

          {errors.role && (
             <p className="text-xs text-danger">
               {errors.role.message}
             </p>
           )}
        </div>

          {/* Dept + Designation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Department</Label>
              <Input placeholder="Engineering" {...register("department")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Designation</Label>
              <Input placeholder="Developer" {...register("designation")} />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Phone</Label>
            <Input placeholder="9876543210 or +91 9876543210" {...register("phone")} />
            {errors.phone && <p className="text-xs text-danger">{errors.phone.message}</p>}
            <p className="text-xs text-text-secondary">Optional — 10-digit Indian mobile number</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Create User</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ open, onClose, onSubmit, loading, defaultValues }) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      full_name: defaultValues?.full_name || "",
      email: defaultValues?.email || "",
      department: defaultValues?.department || "",
      designation: defaultValues?.designation || "",
      phone: defaultValues?.phone || "",
      status: defaultValues?.status || "active",
    },
  });

  const handleClose = () => { onClose(); reset(); };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Full Name *</Label>
            <Input placeholder="John Doe" {...register("full_name")} />
            {errors.full_name && <p className="text-xs text-danger">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Email *</Label>
            <Input type="email" placeholder="john@gnxtsystems.com" {...register("email")} />
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Department</Label>
              <Input placeholder="Engineering" {...register("department")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Designation</Label>
              <Input placeholder="Developer" {...register("designation")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Phone</Label>
            <Input placeholder="9876543210 or +91 9876543210" {...register("phone")} />
            {errors.phone && <p className="text-xs text-danger">{errors.phone.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
