"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Calendar,
  Shield,
  KeyRound,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  Lock,
  Smartphone,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ProfileLayout } from "@/components/layout/profile-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAuthSession,
  useChangePassword,
  useResendVerification,
  useRevokeAllSessions,
} from "@/hooks/auth.hook";
import { useMe, useUpdateProfile } from "@/hooks/user.hook";
import { formatDateTime } from "@/lib/formatters";
import { emailField, passwordField, requiredText } from "@/lib/validation";

const profileSchema = z.object({
  username: requiredText("Username"),
  email: emailField,
});

const passwordSchema = z.object({
  oldPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
  newPassword: passwordField,
});

export default function ProfilePage() {
  const session = useAuthSession();
  const profile = useMe(Boolean(session.data));
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const resendVerification = useResendVerification();
  const revokeAll = useRevokeAllSessions();

  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState("");

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: "", email: "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: "", newPassword: "" },
  });

  useEffect(() => {
    if (profile.data) {
      profileForm.reset({
        username: profile.data.username ?? "",
        email: profile.data.email ?? "",
      });
    }
  }, [profile.data, profileForm]);

  const copyUserId = () => {
    if (profile.data?.id) {
      navigator.clipboard.writeText(profile.data.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const onUpdateProfile = (values: z.infer<typeof profileSchema>) => {
    setProfileSuccessMsg("");
    updateProfile.mutate(values, {
      onSuccess: () => {
        setProfileSuccessMsg("Thông tin hồ sơ đã được cập nhật thành công!");
        setTimeout(() => setProfileSuccessMsg(""), 4000);
      },
    });
  };

  const onChangePassword = (values: z.infer<typeof passwordSchema>) => {
    setPasswordSuccessMsg("");
    changePassword.mutate(values, {
      onSuccess: () => {
        setPasswordSuccessMsg("Mật khẩu đã được đổi thành công!");
        passwordForm.reset();
        setTimeout(() => setPasswordSuccessMsg(""), 4000);
      },
    });
  };

  return (
    <ProfileLayout title="Hồ sơ & Bảo mật">
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Personal Information (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <Card variant="outlined" padding="lg" className="shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                  <User className="size-5 text-primary" />
                  Thông tin cá nhân
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Quản lý thông tin tài khoản hiển thị trên vé tàu và hóa đơn
                </p>
              </div>
              <Badge variant="accent" className="text-[11px] font-semibold">
                Hội viên
              </Badge>
            </div>

            {profileSuccessMsg && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <form
              className="mt-6 space-y-5"
              onSubmit={profileForm.handleSubmit(onUpdateProfile)}
            >
              {/* Username Field */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-semibold text-ink">
                  Tên hiển thị (Username)
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
                  <Input
                    id="username"
                    className="pl-9 text-sm"
                    placeholder="Nhập tên của bạn..."
                    aria-invalid={Boolean(profileForm.formState.errors.username)}
                    {...profileForm.register("username")}
                  />
                </div>
                {profileForm.formState.errors.username?.message && (
                  <p className="text-xs font-medium text-destructive">
                    {profileForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-ink">
                  Địa chỉ Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-9 text-sm"
                    placeholder="name@example.com"
                    aria-invalid={Boolean(profileForm.formState.errors.email)}
                    {...profileForm.register("email")}
                  />
                </div>
                {profileForm.formState.errors.email?.message && (
                  <p className="text-xs font-medium text-destructive">
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Email Verification Warning if unverified */}
              {!profile.data?.emailVerified && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="size-4.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                        Email chưa được xác thực
                      </p>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                        Xác minh email để nhận thông báo lịch tàu và vé điện tử Tết.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-xs border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10"
                    onClick={() =>
                      resendVerification.mutate({
                        email: profile.data?.email ?? "",
                      })
                    }
                    disabled={resendVerification.isPending}
                  >
                    <Send className="size-3.5 mr-1" />
                    {resendVerification.isPending ? "Đang gửi..." : "Gửi mã xác thực"}
                  </Button>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="default"
                  disabled={updateProfile.isPending}
                  className="w-full sm:w-auto font-medium"
                >
                  {updateProfile.isPending ? "Đang lưu thay đổi..." : "Lưu thay đổi"}
                </Button>
              </div>
            </form>

            {/* Account Metadata Cards */}
            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4">
                Chi tiết tài khoản
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/80 bg-muted/20 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-ink-muted">Mã tài khoản (User ID)</p>
                    <p className="font-mono text-xs font-semibold text-ink mt-0.5">
                      {profile.data?.id ? `${profile.data.id.slice(0, 12)}...` : "—"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-ink-muted hover:text-ink"
                    onClick={copyUserId}
                    title="Sao chép User ID"
                  >
                    {copiedId ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/20 p-3 flex items-center gap-3">
                  <Calendar className="size-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[11px] text-ink-muted">Ngày khởi tạo</p>
                    <p className="text-xs font-semibold text-ink mt-0.5">
                      {formatDateTime(profile.data?.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Security Center (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Change Password Card */}
          <Card variant="outlined" padding="lg" className="shadow-xs">
            <div className="border-b border-border pb-4">
              <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <KeyRound className="size-5 text-accent" />
                Đổi mật khẩu
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Cập nhật mật khẩu định kỳ để bảo vệ tài khoản vé tàu của bạn
              </p>
            </div>

            {passwordSuccessMsg && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            <form
              className="mt-6 space-y-4"
              onSubmit={passwordForm.handleSubmit(onChangePassword)}
            >
              <div className="space-y-1.5">
                <Label htmlFor="oldPassword" className="text-xs font-semibold text-ink">
                  Mật khẩu hiện tại
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
                  <Input
                    id="oldPassword"
                    type="password"
                    className="pl-9 text-sm"
                    placeholder="••••••••"
                    aria-invalid={Boolean(passwordForm.formState.errors.oldPassword)}
                    {...passwordForm.register("oldPassword")}
                  />
                </div>
                {passwordForm.formState.errors.oldPassword?.message && (
                  <p className="text-xs font-medium text-destructive">
                    {passwordForm.formState.errors.oldPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs font-semibold text-ink">
                  Mật khẩu mới
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
                  <Input
                    id="newPassword"
                    type="password"
                    className="pl-9 text-sm"
                    placeholder="Tối thiểu 8 ký tự..."
                    aria-invalid={Boolean(passwordForm.formState.errors.newPassword)}
                    {...passwordForm.register("newPassword")}
                  />
                </div>
                {passwordForm.formState.errors.newPassword?.message && (
                  <p className="text-xs font-medium text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="accent"
                className="w-full font-medium"
                disabled={changePassword.isPending}
              >
                {changePassword.isPending ? "Đang đổi mật khẩu..." : "Cập nhật mật khẩu"}
              </Button>
            </form>
          </Card>

          {/* Active Sessions & Revoke Card */}
          <Card variant="outlined" padding="lg" className="shadow-xs border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-5 shrink-0" />
              <h3 className="font-display text-base font-bold text-ink">
                Phiên đăng nhập & Thiết bị
              </h3>
            </div>
            <p className="mt-2 text-xs text-ink-muted leading-relaxed">
              Nếu bạn nghi ngờ có thiết bị lạ đăng nhập, hãy thu hồi toàn bộ phiên.
              Tất cả các trình duyệt sẽ bị đăng xuất ngay lập tức.
            </p>
            <div className="mt-4 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                disabled={revokeAll.isPending}
                onClick={() => setConfirmRevoke(true)}
              >
                <LogOut className="size-3.5 mr-1.5" />
                {revokeAll.isPending ? "Đang thu hồi..." : "Đăng xuất khỏi tất cả thiết bị"}
              </Button>
            </div>
          </Card>

          <ConfirmDialog
            open={confirmRevoke}
            onOpenChange={setConfirmRevoke}
            title="Thu hồi toàn bộ phiên đăng nhập?"
            description="Mọi thiết bị đang đăng nhập tài khoản của bạn sẽ bị đăng xuất ngay lập tức, bao gồm cả thiết bị hiện tại."
            confirmLabel="Đồng ý thu hồi"
            confirmPending={revokeAll.isPending}
            requireAck
            onConfirm={() =>
              revokeAll.mutate(undefined, {
                onSuccess: () => setConfirmRevoke(false),
              })
            }
          />
        </div>
      </div>
    </ProfileLayout>
  );
}
