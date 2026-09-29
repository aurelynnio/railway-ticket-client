"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import {
  Menu,
  X,
  Search,
  LogOut,
  ArrowRight,
  Bell,
  Sparkles,
  Ticket,
  CalendarDays,
  MapPin,
  Home,
  ChevronRight,
} from "lucide-react";

import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { useAuthSession, useLogout } from "@/hooks/auth.hook";
import { useUnreadNotificationCount } from "@/hooks/notification.hook";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/search", label: "Tìm vé Tết", icon: Ticket, badge: "Hot" },
  { href: "/tickets", label: "Lịch tàu Tết", icon: CalendarDays },
  { href: "/route-map", label: "Lộ trình Bắc - Nam", icon: MapPin },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthSession();
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadNotificationCount(Boolean(session.data));

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-surface-3/80 shadow-[0_1px_4px_rgba(25,23,19,0.04)] transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Brand + Nav Links */}
          <div className="flex items-center gap-6 xl:gap-8">
            <BrandMark />

            <nav className="hidden items-center gap-1.5 lg:flex" aria-label="Primary">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-tight transition-all duration-200",
                      active
                        ? "bg-primary/10 text-primary shadow-2xs font-bold"
                        : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                    )}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider leading-none",
                          active
                            ? "bg-accent text-white"
                            : "bg-accent/15 text-accent"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Search Trigger Pill */}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-surface-2/80 hover:bg-surface-3 px-3.5 py-1.5 text-xs text-ink-muted h-9 border border-surface-3/60 transition-all shadow-2xs"
            >
              <Link href="/search" aria-label="Tìm chuyến tàu">
                <Search className="size-3.5 text-primary" />
                <span className="font-normal text-ink-muted">Tìm chuyến tàu...</span>
                <kbd className="hidden xl:inline-flex items-center rounded bg-card px-1.5 py-0.5 text-[10px] font-mono text-ink-subtle shadow-2xs">
                  ⌘K
                </kbd>
              </Link>
            </Button>

            {/* Notification Bell (Logged In) */}
            {session.data && (
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="relative rounded-full size-9 hover:bg-surface-2 transition-colors"
              >
                <Link href="/notifications" aria-label="Thông báo">
                  <Bell className="size-4 text-ink-muted hover:text-ink transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white shadow-2xs animate-pulse">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
            )}

            {/* Authentication / Profile State */}
            {session.data ? (
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 rounded-full bg-surface-2/80 hover:bg-surface-3 p-1 pr-3.5 transition-all border border-surface-3/70 shadow-2xs group"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-hover text-xs font-bold text-white shadow-2xs">
                    {(session.data.email || "U")[0].toUpperCase()}
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="max-w-[110px] truncate text-xs font-semibold text-ink group-hover:text-primary transition-colors">
                      {session.data.email?.split("@")[0]}
                    </span>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={logout.isPending}
                  className="h-8 rounded-full px-2.5 text-xs text-ink-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
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
                  title="Đăng xuất"
                >
                  <LogOut className="size-3.5" />
                  <span className="hidden lg:inline">Đăng xuất</span>
                </Button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-3.5 text-xs font-semibold text-ink hover:text-primary hover:bg-surface-2"
                >
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="rounded-full px-4 text-xs font-semibold gap-1.5 shadow-xs bg-gradient-to-r from-primary to-primary-hover hover:opacity-95 text-white active:scale-95 transition-all"
                >
                  <Link href="/search">
                    <Sparkles className="size-3 text-gold" />
                    <span>Đặt vé ngay</span>
                    <ArrowRight className="size-3.5 ml-0.5" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full size-9 lg:hidden hover:bg-surface-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="border-t border-surface-3/80 bg-background/95 backdrop-blur-xl lg:hidden animate-fade-in shadow-lg">
          <div className="mx-auto max-w-7xl space-y-2 px-4 py-5">
            {/* Nav list */}
            <div className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("size-4", active ? "text-primary" : "text-ink-muted")} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Account Section */}
            <div className="mt-4 border-t border-surface-3/80 pt-4 space-y-2">
              {session.data ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-xl bg-surface-2/80 p-3 text-sm font-semibold text-ink hover:bg-surface-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        {(session.data.email || "U")[0].toUpperCase()}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-ink">{session.data.email}</p>
                        <p className="text-[11px] font-normal text-ink-muted">Tài khoản cá nhân</p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-ink-subtle" />
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    disabled={logout.isPending}
                    onClick={() => {
                      setMobileOpen(false);
                      logout.mutate(undefined, {
                        onSettled: () => {
                          startTransition(() => {
                            router.push("/login");
                            router.refresh();
                          });
                        },
                      });
                    }}
                  >
                    <LogOut className="size-4 mr-2" />
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button asChild variant="outline" className="w-full rounded-xl">
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      Đăng nhập
                    </Link>
                  </Button>
                  <Button asChild variant="default" className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white">
                    <Link href="/search" onClick={() => setMobileOpen(false)}>
                      <Sparkles className="size-3.5 text-gold mr-1.5" />
                      Đặt vé ngay
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
