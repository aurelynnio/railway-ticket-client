"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  startTransition,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  LayoutDashboard,
  TrainFront,
  ShoppingCart,
  Users,
  Wallet,
  Bell,
  Tag,
  LogOut,
  Search,
  PanelLeft,
  PanelLeftClose,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Plus,
  Home,
  CheckCircle2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession, useLogout } from "@/hooks/auth.hook";
import { cn } from "@/lib/utils";

const sidebarNav = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/tickets", label: "Vé tàu", icon: TrainFront },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
  { href: "/admin/vouchers", label: "Khuyến mãi", icon: Tag },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/payments", label: "Thanh toán", icon: Wallet },
  { href: "/admin/notifications", label: "Thông báo", icon: Bell },
];

export function AdminLayout({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const { data: session, isLoading, isError } = useAuthSession();

  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  // Keyboard shortcut Ctrl+K or Cmd+K to open Quick Command
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && (!session || isError)) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, session, isError, router, pathname]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <TrainFront className="size-7 animate-pulse" />
          </div>
          <p className="font-display text-sm font-medium text-ink">
            Đang xác thực quyền Quản trị viên...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in (during redirection)
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-ink-muted">Đang chuyển hướng đến trang đăng nhập...</p>
      </div>
    );
  }

  // Logged in but not an Admin (role !== 1)
  if (session.role !== 1) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card variant="outlined" padding="lg" className="max-w-md w-full text-center space-y-5">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="size-8" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
              Truy cập bị từ chối (403)
            </h1>
            <p className="text-sm text-ink-muted leading-relaxed">
              Tài khoản <span className="font-semibold text-ink">{session.email}</span> không có quyền Quản trị viên để truy cập cổng quản lý này.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild variant="default" className="w-full">
              <Link href="/">
                <Home className="size-4 mr-2" /> Về trang chủ Vé Tàu Tết
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/profile">
                Xem trang cá nhân
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="text-xs text-ink-muted"
              onClick={() => logout.mutate(undefined, { onSuccess: () => router.push("/login") })}
            >
              Đăng nhập tài khoản khác
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const quickLinks = [
    { label: "Bảng điều khiển", href: "/admin", icon: LayoutDashboard, group: "Trang chính" },
    { label: "Danh sách vé tàu", href: "/admin/tickets", icon: TrainFront, group: "Vé tàu" },
    { label: "Tạo chuyến tàu mới", href: "/admin/tickets/new", icon: Plus, group: "Vé tàu" },
    { label: "Quản lý đơn hàng", href: "/admin/orders", icon: ShoppingCart, group: "Đơn hàng" },
    { label: "Khuyến mãi & Voucher Tết", href: "/admin/vouchers", icon: Tag, group: "Khuyến mãi" },
    { label: "Quản lý người dùng", href: "/admin/users", icon: Users, group: "Người dùng" },
    { label: "Giao dịch thanh toán", href: "/admin/payments", icon: Wallet, group: "Thanh toán" },
    { label: "Thông báo hệ thống", href: "/admin/notifications", icon: Bell, group: "Hệ thống" },
    { label: "Trang chủ khách hàng", href: "/", icon: ExternalLink, group: "Website" },
  ];

  const filteredLinks = quickLinks.filter((l) =>
    l.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
    l.group.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col bg-card border-r border-border transition-all duration-300 xl:flex",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-border/60",
            collapsed ? "justify-center px-0" : "px-6 justify-between"
          )}
        >
          {!collapsed ? (
            <Link href="/admin" className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <TrainFront className="size-4.5" />
              </span>
              <div className="flex flex-col">
                <span className="font-display text-sm font-bold tracking-tight text-ink">
                  Vé Tàu Tết
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                  Admin Portal
                </span>
              </div>
            </Link>
          ) : (
            <span className="font-display text-base font-bold text-primary">VTT</span>
          )}
        </div>

        {/* Admin user info summary */}
        {!collapsed && (
          <div className="mx-3 mt-3 rounded-lg border border-border/80 bg-muted/30 p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                {session.email?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-ink" title={session.email}>
                  {session.email}
                </p>
                <div className="mt-0.5 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    Quản trị viên
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {sidebarNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "text-ink-muted hover:bg-muted hover:text-ink"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {isActive(item.href) && (
                    <span className="size-1.5 rounded-full bg-gold" />
                  )}
                </>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer shortcuts */}
        <div className="border-t border-border/60 p-3 space-y-1">
          <Link
            href="/"
            target="_blank"
            title={collapsed ? "Xem website" : undefined}
            className={cn(
              "flex h-9 items-center gap-2.5 rounded-lg px-3 text-xs font-medium text-ink-muted hover:bg-muted hover:text-ink transition-colors",
              collapsed && "justify-center px-0"
            )}
          >
            <ExternalLink className="size-3.5 shrink-0" />
            {!collapsed && <span>Xem website bán vé</span>}
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-ink-muted hover:text-destructive hover:bg-destructive/10 h-9",
              collapsed ? "size-9 justify-center p-0" : "w-full justify-start text-xs"
            )}
            disabled={logout.isPending}
            title={collapsed ? "Đăng xuất" : undefined}
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
            <LogOut className="size-3.5 mr-2" />
            {!collapsed && <span>Đăng xuất</span>}
          </Button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          {/* Collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden xl:flex text-ink-muted hover:text-ink"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="size-4.5" />
            ) : (
              <PanelLeftClose className="size-4.5" />
            )}
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-bold tracking-tight text-ink sm:text-xl">
              {title}
            </h1>
            {description && (
              <p className="truncate text-xs text-ink-muted">
                {description}
              </p>
            )}
          </div>

          {/* Quick Search Button */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-ink-muted shadow-sm hover:border-primary/50 hover:text-ink transition-colors"
            >
              <Search className="size-3.5 text-ink-muted" />
              <span>Tìm nhanh...</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-ink-subtle">
                Ctrl K
              </kbd>
            </button>
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden"
              onClick={() => setCommandOpen(true)}
            >
              <Search className="size-4" />
            </Button>
            {actions}
          </div>
        </header>

        {/* Mobile Horizontal Nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4 py-2 xl:hidden">
          {sidebarNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-ink-muted hover:bg-muted"
              )}
            >
              <item.icon className="size-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>

      {/* Quick Command / Navigation Dialog */}
      {commandOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-20 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center border-b border-border px-4 py-3">
              <Search className="size-4 text-ink-muted mr-3 shrink-0" />
              <input
                autoFocus
                placeholder="Nhập tên trang hoặc thao tác cần tìm..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
              />
              <kbd
                onClick={() => setCommandOpen(false)}
                className="cursor-pointer rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-ink-subtle"
              >
                ESC
              </kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredLinks.length === 0 ? (
                <p className="p-4 text-center text-xs text-ink-muted">
                  Không tìm thấy kết quả phù hợp.
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredLinks.map((link) => (
                    <Link
                      key={link.href + link.label}
                      href={link.href}
                      onClick={() => setCommandOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs text-ink hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-7 items-center justify-center rounded-md bg-muted text-ink-muted group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <link.icon className="size-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-ink">{link.label}</p>
                          <p className="text-[10px] text-ink-muted">{link.group}</p>
                        </div>
                      </div>
                      <ArrowRight className="size-3.5 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-border bg-muted/30 px-4 py-2 text-[11px] text-ink-muted flex justify-between">
              <span>Vé Tàu Tết 2026 Admin</span>
              <span>Dùng phím <kbd className="font-mono">ESC</kbd> để đóng</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
