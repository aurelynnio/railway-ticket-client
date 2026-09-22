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

  // Restore saved sidebar preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {
      // Ignore
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("admin_sidebar_collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  // Keyboard shortcut Ctrl+K/Cmd+K (Quick Command) and Ctrl+B/Cmd+B (Toggle Sidebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapse();
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
          "sticky top-0 z-20 hidden h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 ease-in-out lg:flex",
          collapsed ? "w-14" : "w-52"
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex h-14 items-center border-b border-border/60 transition-all",
            collapsed ? "justify-center px-0" : "justify-between px-3"
          )}
        >
          <Link
            href="/admin"
            className={cn("flex items-center gap-2 min-w-0", collapsed && "justify-center")}
            title="Vé Tàu Tết - Admin Portal"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <TrainFront className="size-4" />
            </span>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-display text-xs font-bold tracking-tight text-ink truncate leading-tight">
                  Vé Tàu Tết
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-accent leading-none">
                  Admin Portal
                </span>
              </div>
            )}
          </Link>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-ink-muted hover:text-ink shrink-0"
              onClick={toggleCollapse}
              title="Thu gọn sidebar (Ctrl+B)"
            >
              <PanelLeftClose className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Nav */}
        <nav
          className={cn(
            "flex-1 space-y-0.5 overflow-y-auto px-2 py-2.5",
            collapsed && "flex flex-col items-center"
          )}
        >
          {sidebarNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group rounded-lg text-xs font-medium transition-colors",
                collapsed
                  ? "flex size-8 items-center justify-center p-0"
                  : "flex h-9 items-center px-2.5 gap-2.5",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-ink-muted hover:bg-muted hover:text-ink"
              )}
            >
              <item.icon className="size-4 shrink-0 transition-transform group-hover:scale-105" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {isActive(item.href) && (
                    <span className="size-1.5 rounded-full bg-gold shrink-0" />
                  )}
                </>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer shortcuts & user info */}
        <div
          className={cn(
            "border-t border-border/60 p-2 space-y-1",
            collapsed && "flex flex-col items-center"
          )}
        >
          {/* User Profile summary */}
          <div
            className={cn(
              "rounded-lg transition-colors",
              collapsed
                ? "flex size-8 items-center justify-center p-0"
                : "flex items-center border border-border/50 bg-muted/40 p-1.5 gap-2"
            )}
            title={collapsed ? `${session.email} (Quản trị viên)` : undefined}
          >
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
              {session.email?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-ink leading-tight" title={session.email}>
                  {session.email}
                </p>
                <div className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                    Quản trị viên
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick link: Website */}
          <Link
            href="/"
            target="_blank"
            title={collapsed ? "Xem website bán vé" : undefined}
            className={cn(
              "rounded-lg text-xs font-medium text-ink-muted hover:bg-muted hover:text-ink transition-colors",
              collapsed
                ? "flex size-8 items-center justify-center p-0"
                : "flex h-8 items-center px-2 gap-2"
            )}
          >
            <ExternalLink className="size-3.5 shrink-0" />
            {!collapsed && <span className="truncate">Xem website</span>}
          </Link>

          {/* Logout */}
          <button
            type="button"
            className={cn(
              "rounded-lg text-xs font-medium text-ink-muted hover:text-destructive hover:bg-destructive/10 transition-colors",
              collapsed
                ? "flex size-8 items-center justify-center p-0"
                : "flex h-8 w-full items-center px-2 gap-2"
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
            <LogOut className="size-3.5 shrink-0" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-6">
          {/* Collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex size-8 text-ink-muted hover:text-ink shrink-0"
            onClick={toggleCollapse}
            title={collapsed ? "Mở rộng sidebar (Ctrl+B)" : "Thu gọn sidebar (Ctrl+B)"}
          >
            {collapsed ? (
              <PanelLeft className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-base font-bold tracking-tight text-ink sm:text-lg">
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
              className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-ink-muted shadow-xs hover:border-primary/50 hover:text-ink transition-colors"
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
              className="sm:hidden size-8"
              onClick={() => setCommandOpen(true)}
            >
              <Search className="size-3.5" />
            </Button>
            {actions}
          </div>
        </header>

        {/* Mobile Horizontal Nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-1.5 lg:hidden">
          {sidebarNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
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
        <main className="flex-1 p-4 sm:p-5 lg:p-6">
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
