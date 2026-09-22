"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, type ReactNode } from "react";
import {
  User,
  Ticket,
  ShoppingCart,
  Bell,
  Shield,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Sparkles,
  TrainFront,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession, useLogout } from "@/hooks/auth.hook";
import { useUnreadNotificationCount } from "@/hooks/notification.hook";
import { useOrders } from "@/hooks/order.hook";
import { useMe } from "@/hooks/user.hook";
import { OrderStatus } from "@/lib/api-types";
import { formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface ProfileLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function ProfileLayout({
  children,
  title,
  description,
  actions,
}: ProfileLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthSession();
  const logout = useLogout();
  const profile = useMe(Boolean(session.data));
  const { data: unreadCount = 0 } = useUnreadNotificationCount(
    Boolean(session.data)
  );

  // Orders count query
  const ordersQuery = useOrders(
    { page: 1, limit: 100 },
    Boolean(session.data)
  );
  const allOrders = ordersQuery.data?.data ?? [];
  const issuedTicketsCount = allOrders.filter((o) =>
    [OrderStatus.Paid, OrderStatus.Confirmed, OrderStatus.TicketIssued].includes(
      o.status
    )
  ).length;
  const totalOrdersCount = allOrders.length;

  const userEmail = profile.data?.email ?? session.data?.email ?? "";
  const username =
    profile.data?.username ?? (userEmail.split("@")[0] || "Hành khách");
  const isVerified = Boolean(profile.data?.emailVerified);
  const isAdmin = session.data?.role === 1;

  const navItems = [
    {
      href: "/profile",
      label: "Hồ sơ & Bảo mật",
      icon: User,
      badge: null,
    },
    {
      href: "/profile/tickets",
      label: "Vé tàu Tết của tôi",
      icon: Ticket,
      badge: issuedTicketsCount > 0 ? issuedTicketsCount : null,
    },
    {
      href: "/profile/orders",
      label: "Lịch sử đơn hàng",
      icon: ShoppingCart,
      badge: totalOrdersCount > 0 ? totalOrdersCount : null,
    },
    {
      href: "/profile/notifications",
      label: "Thông báo hành trình",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
      highlightBadge: unreadCount > 0,
    },
  ];

  const isActive = (href: string) =>
    href === "/profile" ? pathname === "/profile" : pathname.startsWith(href);

  return (
    <AppLayout>
      {/* Top Festive Hero Cover */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-amber-950 text-white">
        {/* Decorative Golden Ambient Orbs */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-gold/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 size-72 rounded-full bg-primary-soft/10 blur-2xl" />

        <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-20 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-medium text-white/70">
            <Link href="/" className="hover:text-gold transition-colors">
              Trang chủ
            </Link>
            <ChevronRight className="size-3 text-white/40" />
            <Link href="/profile" className="hover:text-gold transition-colors">
              Tài khoản
            </Link>
            {pathname !== "/profile" && (
              <>
                <ChevronRight className="size-3 text-white/40" />
                <span className="text-white font-semibold">
                  {title || "Chi tiết"}
                </span>
              </>
            )}
          </nav>

          {/* User Hero Banner Row */}
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Avatar with Golden Ring */}
              <div className="relative shrink-0">
                <div className="flex size-20 sm:size-24 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-gold to-amber-600 p-0.5 shadow-2xl">
                  <div className="flex size-full items-center justify-center rounded-[14px] bg-primary text-2xl sm:text-3xl font-bold font-display text-white">
                    {username.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div
                  className="absolute -bottom-1 -right-1 flex size-6 sm:size-7 items-center justify-center rounded-full bg-card shadow-md text-emerald-600 border border-border"
                  title={isVerified ? "Tài khoản đã xác minh" : "Chưa xác minh email"}
                >
                  {isVerified ? (
                    <CheckCircle2 className="size-4 sm:size-4.5 text-emerald-500 fill-emerald-500/20" />
                  ) : (
                    <AlertCircle className="size-4 sm:size-4.5 text-amber-500" />
                  )}
                </div>
              </div>

              {/* Identity & Badges */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">
                    {username}
                  </h1>
                  {isAdmin && (
                    <Badge variant="gold" className="text-xs font-semibold">
                      <ShieldCheck className="size-3.5 mr-1" />
                      Quản trị viên
                    </Badge>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-200 backdrop-blur-xs">
                    <Sparkles className="size-3 text-gold" />
                    Xuân Đoàn Viên 2026
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/80 font-mono truncate" title={userEmail}>
                  {userEmail || "Đang tải tài khoản..."}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/60 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3 text-gold" />
                    Gia nhập: {formatDateTime(profile.data?.createdAt)}
                  </span>
                  <span>•</span>
                  <span>
                    {isVerified ? "Email đã xác thực" : "Chưa xác thực email"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions for Admins / Logout */}
            <div className="flex flex-wrap items-center gap-2.5">
              {isAdmin && (
                <Button asChild variant="gold" size="sm" className="shadow-md">
                  <Link href="/admin">
                    <TrainFront className="size-4 mr-1.5" />
                    Vào Cổng Quản trị
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                disabled={logout.isPending}
                onClick={() =>
                  logout.mutate(undefined, {
                    onSettled: () => {
                      startTransition(() => {
                        router.push("/login");
                        router.refresh();
                      });
                    },
                  })
                }
              >
                <LogOut className="size-3.5 mr-1.5" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Overlapping KPI Metric Stats Cards */}
      <section className="-mt-12 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {/* Card 1: Tickets */}
          <Link
            href="/profile/tickets"
            className="group block rounded-2xl border border-border bg-card p-4 shadow-md transition-all hover:border-primary/50 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-muted">Vé tàu đã mua</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary group-hover:scale-110 transition-transform">
                <Ticket className="size-4" />
              </div>
            </div>
            <p className="mt-2 font-display text-2xl font-bold tabular-nums text-ink">
              {ordersQuery.isLoading ? <Skeleton className="h-7 w-12" /> : issuedTicketsCount}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-subtle flex items-center gap-1 group-hover:text-primary transition-colors">
              <span>Xem vé điện tử</span>
              <ArrowRight className="size-3" />
            </p>
          </Link>

          {/* Card 2: Orders */}
          <Link
            href="/profile/orders"
            className="group block rounded-2xl border border-border bg-card p-4 shadow-md transition-all hover:border-primary/50 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-muted">Đơn hàng</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 group-hover:scale-110 transition-transform">
                <ShoppingCart className="size-4" />
              </div>
            </div>
            <p className="mt-2 font-display text-2xl font-bold tabular-nums text-ink">
              {ordersQuery.isLoading ? <Skeleton className="h-7 w-12" /> : totalOrdersCount}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-subtle flex items-center gap-1 group-hover:text-amber-600 transition-colors">
              <span>Lịch sử đặt vé</span>
              <ArrowRight className="size-3" />
            </p>
          </Link>

          {/* Card 3: Notifications */}
          <Link
            href="/profile/notifications"
            className="group block rounded-2xl border border-border bg-card p-4 shadow-md transition-all hover:border-primary/50 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-muted">Thông báo mới</span>
              <div className="relative flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 group-hover:scale-110 transition-transform">
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
            </div>
            <p className="mt-2 font-display text-2xl font-bold tabular-nums text-ink">
              {unreadCount}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-subtle flex items-center gap-1 group-hover:text-sky-600 transition-colors">
              <span>Hộp thư hành trình</span>
              <ArrowRight className="size-3" />
            </p>
          </Link>

          {/* Card 4: Security */}
          <Link
            href="/profile#security"
            className="group block rounded-2xl border border-border bg-card p-4 shadow-md transition-all hover:border-primary/50 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-muted">Bảo mật tài khoản</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                <ShieldCheck className="size-4" />
              </div>
            </div>
            <p className="mt-2 font-display text-base sm:text-lg font-bold text-ink">
              {isVerified ? "An toàn" : "Cần xác thực"}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-subtle flex items-center gap-1 group-hover:text-emerald-600 transition-colors">
              <span>Đổi mật khẩu / Phiên</span>
              <ArrowRight className="size-3" />
            </p>
          </Link>
        </div>
      </section>

      {/* Navigation Tabs Bar */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center justify-between border-b border-border">
          <nav className="-mb-px flex gap-2 sm:gap-4 overflow-x-auto" aria-label="Profile Tabs">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex shrink-0 items-center gap-2 border-b-2 py-3.5 px-3 text-xs sm:text-sm font-medium transition-all",
                    active
                      ? "border-primary text-primary font-bold"
                      : "border-transparent text-ink-muted hover:border-border hover:text-ink"
                  )}
                >
                  <item.icon
                    className={cn(
                      "size-4 transition-transform group-hover:scale-110",
                      active ? "text-primary" : "text-ink-muted"
                    )}
                  />
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors",
                        item.highlightBadge
                          ? "bg-red-500 text-white"
                          : active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-ink-muted"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {actions && <div className="hidden sm:flex items-center gap-2 pb-2">{actions}</div>}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </AppLayout>
  );
}
