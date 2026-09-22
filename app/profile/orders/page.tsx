"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ShoppingCart,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  TrainFront,
  Clock,
  CreditCard,
  Search,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";

import { ProfileLayout } from "@/components/layout/profile-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/hooks/order.hook";
import { OrderStatus } from "@/lib/api-types";
import {
  formatCurrency,
  formatDateTime,
  formatOrderStatus,
  getOrderStatusTone,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";

const STATUS_TABS: Array<{ label: string; value?: OrderStatus }> = [
  { label: "Tất cả đơn" },
  { label: "Chờ thanh toán", value: OrderStatus.PendingPayment },
  { label: "Đã thanh toán", value: OrderStatus.Paid },
  { label: "Đã xác nhận", value: OrderStatus.Confirmed },
  { label: "Đã phát hành vé", value: OrderStatus.TicketIssued },
  { label: "Đã hủy", value: OrderStatus.Cancelled },
];

export default function ProfileOrdersPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<OrderStatus | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const query = useOrders({
    page,
    limit: 10,
    status: activeTab,
  });

  const orders = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  const copyOrderCode = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const id = (order.id ?? "").toLowerCase();
    const train = (order.trainNumber ?? "").toLowerCase();
    const dep = (order.departureStationName ?? "").toLowerCase();
    const arr = (order.arrivalStationName ?? "").toLowerCase();
    return id.includes(q) || train.includes(q) || dep.includes(q) || arr.includes(q);
  });

  return (
    <ProfileLayout
      title="Lịch sử đơn hàng"
      description="Quản lý tình trạng thanh toán, xuất vé và thông tin hành trình của các đơn đặt vé."
    >
      <div className="space-y-6">
        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/60 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => {
                  setActiveTab(tab.value);
                  setPage(1);
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
                  activeTab === tab.value
                    ? "bg-card text-primary shadow-xs"
                    : "text-ink-muted hover:text-ink"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã đơn, số tàu, ga..."
              className="pl-8 text-xs h-9 bg-card"
            />
          </div>
        </div>

        {/* Orders List */}
        {query.isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-3">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card variant="outlined" padding="lg" className="text-center py-16 bg-card/60">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <ShoppingCart className="size-8" />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-ink">
              {searchQuery ? "Không tìm thấy đơn hàng" : "Chưa có đơn hàng nào"}
            </h3>
            <p className="mt-1.5 text-sm text-ink-muted max-w-sm mx-auto">
              {searchQuery
                ? "Không có đơn hàng nào khớp với từ khóa tìm kiếm."
                : "Các chuyến tàu Tết bạn đặt chỗ sẽ xuất hiện tại đây."}
            </p>
            <Button asChild variant="default" className="mt-6 font-medium">
              <Link href="/search">
                <TrainFront className="size-4 mr-2" />
                Tìm vé tàu Tết ngay
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const orderShortId = order.id?.slice(0, 8).toUpperCase();
              const isPending = order.status === OrderStatus.PendingPayment;

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Top / Left: ID, Status, Train Route */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => copyOrderCode(order.id, e)}
                          className="inline-flex items-center gap-1 font-mono text-xs font-bold text-ink hover:text-primary transition-colors bg-muted/50 px-2 py-0.5 rounded-md"
                          title="Sao chép mã đơn hàng"
                        >
                          #{orderShortId}
                          {copiedId === order.id ? (
                            <Check className="size-3 text-emerald-600" />
                          ) : (
                            <Copy className="size-3 text-ink-muted" />
                          )}
                        </button>
                        <Badge variant={getOrderStatusTone(order.status)} className="text-xs">
                          {formatOrderStatus(order.status)}
                        </Badge>
                        <span className="text-xs text-ink-muted">
                          {formatDateTime(order.createdAt)}
                        </span>
                      </div>

                      {/* Train & Journey */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <TrainFront className="size-4 text-primary shrink-0" />
                        <span className="font-display font-bold text-sm text-ink">
                          {order.trainNumber ? `Tàu ${order.trainNumber}: ` : ""}
                          {order.departureStationName ?? order.departureStationCode ?? "Ga đi"} →{" "}
                          {order.arrivalStationName ?? order.arrivalStationCode ?? "Ga đến"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
                        {order.departureTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3 text-gold" />
                            Khởi hành: {formatDateTime(order.departureTime)}
                          </span>
                        )}
                        <span>•</span>
                        <span>
                          Số lượng: <strong className="text-ink">{order.quantity} vé</strong>
                          {order.seatLabels && order.seatLabels.length > 0 && (
                            <span className="font-mono ml-1 text-primary">
                              ({order.seatLabels.join(", ")})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Right: Total Price & Actions */}
                    <div className="flex items-center justify-between lg:justify-end gap-5 border-t border-border/60 pt-3 lg:border-t-0 lg:pt-0">
                      <div className="text-left lg:text-right">
                        <p className="text-[11px] uppercase tracking-wider text-ink-muted">
                          Tổng tiền
                        </p>
                        <p className="font-display text-xl font-bold tabular-nums text-primary">
                          {formatCurrency(order.totalPrice ?? "0")}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <Button asChild variant="accent" size="sm" className="font-semibold text-xs h-9">
                            <Link href={`/orders/${order.id}`}>
                              <CreditCard className="size-3.5 mr-1.5" />
                              Thanh toán ngay
                            </Link>
                          </Button>
                        )}
                        <Button asChild variant="outline" size="sm" className="text-xs h-9">
                          <Link href={`/orders/${order.id}`}>
                            Xem chi tiết
                            <ArrowRight className="size-3.5 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4 mr-1" />
                  Trang trước
                </Button>
                <span className="text-xs text-ink-muted px-2">
                  Trang {page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Trang sau
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}
