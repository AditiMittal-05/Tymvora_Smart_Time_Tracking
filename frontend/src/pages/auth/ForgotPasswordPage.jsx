import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth.service";
import { useToast } from "@/hooks/use-toast";
import { PasswordStrengthBar } from "@/components/shared/PasswordStrengthBar";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d{6}$/, "OTP must be digits only"),
  new_password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
};

export function ForgotPasswordPage() {
  const [step, setStep] = useState("email"); // "email" | "otp" | "done"
  const [email, setEmail] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step 1: email form
  const emailForm = useForm({ resolver: zodResolver(emailSchema) });

  // Step 2: OTP + new password form
  const otpForm = useForm({ resolver: zodResolver(otpSchema) });
  const watchedPassword = otpForm.watch("new_password", "");

  const sendOtp = useMutation({
    mutationFn: (data) => authService.forgotPassword(data.email),
    onSuccess: (_, variables) => {
      setEmail(variables.email);
      setStep("otp");
    },
    onError: () => {
      // Always succeed visually to prevent email enumeration
      setEmail(emailForm.getValues("email"));
      setStep("otp");
    },
  });

  const verifyOtp = useMutation({
    mutationFn: (data) => authService.verifyOtp(email, data.otp, data.new_password),
    onSuccess: () => {
      setStep("done");
    },
    onError: (err) => {
      const msg = err?.response?.data?.detail || "Invalid or expired OTP";
      toast.error("Reset failed", msg);
    },
  });

  const resendOtp = useMutation({
    mutationFn: () => authService.forgotPassword(email),
    onSuccess: () => toast.success("OTP resent", "Check your inbox for a new 6-digit code."),
    onError: () => toast.success("OTP resent", "Check your inbox for a new 6-digit code."),
  });

  if (step === "done") {
    return (
      <motion.div {...slide} className="p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
        >
          <CheckCircle className="h-8 w-8 text-white" />
        </motion.div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Password Reset!</h2>
        <p className="text-text-secondary text-sm mb-6">
          Your password has been updated. You can now sign in with your new password.
        </p>
        <Button className="w-full" onClick={() => navigate("/login")}>
          Back to Sign In
        </Button>
      </motion.div>
    );
  }

  if (step === "otp") {
    return (
      <motion.div {...slide} className="p-8">
        <button
          onClick={() => setStep("email")}
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #2563EB, #10B981)" }}>
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Verify OTP</h2>
        </div>
        <p className="text-text-secondary text-sm mb-1 mt-1">
          A 6-digit OTP was sent to <strong>{email}</strong>
        </p>
        <p className="text-xs text-amber-600 font-medium mb-6">⏱ Valid for 5 minutes</p>

        <form onSubmit={otpForm.handleSubmit((d) => verifyOtp.mutate(d))} className="space-y-5">
          {/* OTP Input */}
          <div className="space-y-1.5">
            <Label>Enter OTP</Label>
            <Input
              placeholder="6-digit code"
              maxLength={6}
              className="text-center text-2xl font-mono tracking-[0.5em] py-3"
              {...otpForm.register("otp")}
            />
            {otpForm.formState.errors.otp && (
              <p className="text-xs text-danger">{otpForm.formState.errors.otp.message}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                type={showPw ? "text" : "password"}
                placeholder="Min. 8 characters"
                className="pl-10 pr-10"
                {...otpForm.register("new_password")}
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {otpForm.formState.errors.new_password && (
              <p className="text-xs text-danger">{otpForm.formState.errors.new_password.message}</p>
            )}
            <PasswordStrengthBar password={watchedPassword} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label>Confirm Password</Label>
            <Input
              type={showPw ? "text" : "password"}
              placeholder="Repeat new password"
              {...otpForm.register("confirm_password")}
            />
            {otpForm.formState.errors.confirm_password && (
              <p className="text-xs text-danger">{otpForm.formState.errors.confirm_password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" loading={verifyOtp.isPending}>
            <CheckCircle className="h-4 w-4" /> Reset Password
          </Button>

          <p className="text-center text-sm text-text-secondary">
            Didn't receive it?{" "}
            <button
              type="button"
              onClick={() => resendOtp.mutate()}
              disabled={resendOtp.isPending}
              className="text-primary font-medium hover:underline disabled:opacity-50"
            >
              {resendOtp.isPending ? "Sending…" : "Resend OTP"}
            </button>
          </p>
        </form>
      </motion.div>
    );
  }

  // Step 1: email
  return (
    <motion.div {...slide} className="p-8">
      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Sign In
      </Link>
      <h2 className="text-2xl font-bold text-text-primary mb-1">Forgot Password?</h2>
      <p className="text-text-secondary text-sm mb-6">
        Enter your email and we'll send a 6-digit OTP to reset your password.
      </p>

      <form onSubmit={emailForm.handleSubmit((d) => sendOtp.mutate(d))} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <Input
              id="email"
              type="email"
              placeholder="you@tymvora.com"
              className="pl-10"
              {...emailForm.register("email")}
            />
          </div>
          {emailForm.formState.errors.email && (
            <p className="text-xs text-danger">{emailForm.formState.errors.email.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" size="lg" loading={sendOtp.isPending}>
          Send OTP
        </Button>
      </form>
    </motion.div>
  );
}
