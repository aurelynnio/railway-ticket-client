"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Tag,
  Clock,
  Sparkles,
  Train,
  CreditCard,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

import { ProfileLayout } from "@/components/layout/profile-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMyNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/notification.hook";
import { formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default function ProfileNotificationsPage() {
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const query = useMyNotifications({ page: 1, limit: 50 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = query.data?.data ?? [];
  const filteredList =
    filter === "UNREAD"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "marketing_promotion":
        return <Sparkles className="size-4.5 text-amber-500" />;
      case "order_created":
        return <Train className="size-4.5 text-primary" />;
      case "payment_paid":
        return <CreditCard className="size-4.5 text-emerald-500" />;
      case "order_refunded":
        return <RotateCcw className="size-4.5 text-rose-500" />;
      default:
        return <Bell className="size-4.5 text-sky-500" />;
    }
  };

  return (
    <ProfileLayout
      title="Thông báo hành trình"
      description="Cập nhật tin tức lịch tàu Tết, trạng thái xuất vé và khuyến mãi dành cho bạn."
      actions={
        unreadCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-xs"
          >
            <CheckCheck className="size-3.5 mr-1.5" />
            Đánh dấu tất cả đã đọc
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* Controls: Filter Tabs & Unread indicator */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/60">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                filter === "ALL"
                  ? "bg-card text-primary shadow-xs"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("UNREAD")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5",
                filter === "UNREAD"
                  ? "bg-card text-primary shadow-xs"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              <span>Chưa đọc</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500 text-white text-[10px] px-1.5 py-0.2 font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {unreadCount > 0 && (
            <span className="text-xs text-ink-muted">
              Bạn có <strong className="text-primary font-bold">{unreadCount}</strong> tin nhắn chưa đọc
            </span>
          )}
        </div>

        {/* List Content */}
        {query.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <Card variant="outlined" padding="lg" className="text-center py-16 bg-card/60">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
              <Bell className="size-8" />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-ink">
              {filter === "UNREAD" ? "Không có thông báo chưa đọc" : "Hộp thư thông báo trống"}
            </h3>
            <p className="mt-1.5 text-sm text-ink-muted max-w-sm mx-auto">
              {filter === "UNREAD"
                ? "Tất cả các thông báo đã được bạn đọc."
                : "Khi có thông báo về chuyến tàu hoặc ưu đãi vé Tết, chúng sẽ xuất hiện ở đây."}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredList.map((n) => {
              const isUnread = !n.isRead;

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (isUnread) markRead.mutate(n.id);
                  }}
                  className={cn(
                    "cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all shadow-xs flex items-start gap-4",
                    isUnread
                      ? "border-primary/40 bg-primary-soft/20 hover:bg-primary-soft/30"
                      : "border-border bg-card hover:border-primary/20"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform",
                      isUnread
                        ? "bg-primary text-white shadow-xs"
                        : "bg-muted text-ink-muted"
                    )}
                  >
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4
                          className={cn(
                            "text-sm font-semibold text-ink leading-tight",
                            isUnread && "text-primary font-bold"
                          )}
                        >
                          {n.subject}
                        </h4>
                        {isUnread && (
                          <Badge variant="accent" className="text-[10px] px-1.5 py-0.5">
                            Mới
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-subtle whitespace-nowrap">
                        {formatDateTime(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm leading-relaxed text-ink-muted">
                      {n.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}
