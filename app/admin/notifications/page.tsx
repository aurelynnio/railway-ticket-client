"use client";

import { useState, useMemo } from "react";
import {
  Bell,
  Mail,
  Send,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Sparkles,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useAllNotifications,
  useBroadcastMarketing,
} from "@/hooks/notification.hook";
import { formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const broadcastSchema = z.object({
  subject: z.string().trim().min(3, "Tiêu đề phải có ít nhất 3 ký tự"),
  body: z.string().trim().min(10, "Nội dung thông báo phải có ít nhất 10 ký tự"),
  voucherCode: z.string().optional(),
});

type BroadcastFormValues = z.infer<typeof broadcastSchema>;

export default function AdminNotificationsPage() {
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBroadcast, setShowBroadcast] = useState(false);

  const query = useAllNotifications({
    type: type || undefined,
    page,
    limit: 20,
  });

  const rawNotifications = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  const broadcast = useBroadcastMarketing();

  const form = useForm<BroadcastFormValues>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      subject: "🧧 Thông báo Vé Tàu Tết 2026 — Lịch tàu & Ưu đãi mới",
      body: "Kính gửi quý khách, hệ thống Vé Tàu Tết 2026 vừa cập nhật thêm các chuyến tàu bổ sung cho các tuyến cao điểm Bắc - Nam...",
      voucherCode: "",
    },
  });

  // Client-side search
  const filteredNotifications = useMemo(() => {
    if (!searchQuery.trim()) return rawNotifications;
    const q = searchQuery.toLowerCase().trim();
    return rawNotifications.filter(
      (n) =>
        n.subject?.toLowerCase().includes(q) ||
        n.body?.toLowerCase().includes(q) ||
        n.recipientEmail?.toLowerCase().includes(q),
    );
  }, [rawNotifications, searchQuery]);

  const onBroadcastSubmit = (values: BroadcastFormValues) => {
    broadcast.mutate(
      {
        subject: values.subject.trim(),
        body: values.body.trim(),
        voucherCode: values.voucherCode?.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Đã gửi thông báo đến người dùng thành công!");
          setShowBroadcast(false);
          form.reset();
        },
        onError: () => {
          toast.error("Không thể gửi thông báo. Vui lòng thử lại.");
        },
      },
    );
  };

  return (
    <AdminLayout
      title="Quản lý thông báo hệ thống"
      description="Giám sát nhật ký email thông báo đặt vé, thanh toán và gửi thông báo Tết 2026."
      actions={
        <Button
          variant="accent"
          size="sm"
          onClick={() => setShowBroadcast((v) => !v)}
          className="gap-1.5"
        >
          <Send className="size-3.5" />
          {showBroadcast ? "Đóng form" : "Gửi thông báo mới"}
        </Button>
      }
    >
      {/* Broadcast Form */}
      {showBroadcast && (
        <Card variant="outlined" padding="lg" className="border-accent/40 bg-card shadow-sm animate-in fade-in">
          <div className="border-b border-border pb-3">
            <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              Gửi email thông báo toàn hệ thống
            </h3>
            <p className="text-xs text-ink-muted">
              Gửi email tiếp thị hoặc thông báo vận hành quan trọng đến khách hàng.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onBroadcastSubmit)} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Tiêu đề email</Label>
              <Input
                id="subject"
                placeholder="VD: 🧧 Thông báo mở bán vé tàu Tết 2026..."
                aria-invalid={Boolean(form.formState.errors.subject)}
                {...form.register("subject")}
              />
              {form.formState.errors.subject?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.subject.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="voucherCode">Mã giảm giá đính kèm (tùy chọn)</Label>
              <Input
                id="voucherCode"
                placeholder="VD: TET2026"
                className="font-mono uppercase font-bold"
                {...form.register("voucherCode")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="body">Nội dung chi tiết</Label>
              <Textarea
                id="body"
                rows={4}
                placeholder="Nhập nội dung email gửi đến khách hàng..."
                aria-invalid={Boolean(form.formState.errors.body)}
                {...form.register("body")}
              />
              {form.formState.errors.body?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.body.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowBroadcast(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="default" size="sm" disabled={broadcast.isPending} className="gap-1.5">
                <Send className="size-3.5" />
                {broadcast.isPending ? "Đang gửi..." : "Gửi thông báo"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <Card variant="outlined" padding="lg">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-center">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <Input
              placeholder="Tìm theo tiêu đề, nội dung, email người nhận..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div>
            <Select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="text-xs"
            >
              <option value="">Tất cả phân loại</option>
              <option value="booking">Đặt vé (Booking)</option>
              <option value="payment">Thanh toán (Payment)</option>
              <option value="marketing">Tiếp thị & Ưu đãi</option>
              <option value="system">Hệ thống (System)</option>
            </Select>
          </div>

          <div className="text-right text-xs text-ink-muted">
            Hiển thị: <span className="font-semibold text-ink">{filteredNotifications.length}</span> thông báo
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <Card variant="outlined" padding="none">
        {query.isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-muted">
            <Inbox className="size-8 mx-auto mb-2 opacity-50" />
            Không có thông báo nào phù hợp với điều kiện tìm kiếm.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredNotifications.map((n) => (
              <div key={n.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-semibold text-[11px] capitalize">
                      {n.type}
                    </Badge>
                    <span className="text-sm font-semibold text-ink">
                      {n.subject}
                    </span>
                    {n.isRead && (
                      <span className="text-[10px] text-emerald-600 font-medium">
                        ✓ Đã đọc
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-ink-muted">
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>

                <p className="mt-2 text-xs text-ink-muted leading-relaxed line-clamp-2">
                  {n.body}
                </p>

                {n.recipientEmail && (
                  <p className="mt-2 text-[11px] text-ink-subtle flex items-center gap-1 font-mono">
                    <Mail className="size-3 text-ink-muted" />
                    Đến: {n.recipientEmail}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Trước
          </Button>
          <span className="text-xs text-ink-muted font-medium">
            Trang {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
          >
            Sau
          </Button>
        </div>
      )}
    </AdminLayout>
  );
}
