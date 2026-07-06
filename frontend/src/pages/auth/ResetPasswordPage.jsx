import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, Lock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth.service";
import { useToast } from "@/hooks/use-toast";
import { PasswordStrengthBar } from "@/components/shared/PasswordStrengthBar";

const schema = z.object({
  new_password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
  confirm: z.string(),
}).refine((d) => d.new_password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const watchedPw = watch("new_password", "");

  const mutation = useMutation({
    mutationFn: (data) => authService.resetPassword(token, data.new_password),
    onSuccess: () => {
      toast.success("Password reset!", "You can now sign in with your new password.");
      navigate("/login");
    },
    onError: (err) => {
      toast.error("Reset failed", err?.response?.data?.detail || "Invalid or expired token");
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4,0,0.2,1] }}
      className="p-8"
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #2563EB, #10B981)" }}>
          <Lock className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Set New Password</h2>
      </div>
      <p className="text-text-secondary text-sm mb-6 mt-1">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        <div className="space-y-1.5">
          <Label>New Password</Label>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              placeholder="Min. 8 characters"
              className="pr-10"
              {...register("new_password")}
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors p-0.5"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.new_password && <p className="text-xs text-danger">{errors.new_password.message}</p>}
          <PasswordStrengthBar password={watchedPw} />
        </div>

        <div className="space-y-1.5">
          <Label>Confirm Password</Label>
          <Input type={showPw ? "text" : "password"} placeholder="Repeat password" {...register("confirm")} />
          {errors.confirm && <p className="text-xs text-danger">{errors.confirm.message}</p>}
        </div>

        <Button type="submit" className="w-full" size="lg" loading={mutation.isPending}>
          <CheckCircle className="h-4 w-4" /> Reset Password
        </Button>
      </form>
    </motion.div>
  );
}
