"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Ticket,
  ArrowRight,
  TrainFront,
  CalendarDays,
  MapPin,
  Clock,
  Printer,
  Search,
  Sparkles,
  QrCode,
  Users,
  CheckCircle2,
} from "lucide-react";

import { ProfileLayout } from "@/components/layout/profile-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/hooks/order.hook";
import { OrderStatus } from "@/lib/api-types";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { TicketQRCode } from "@/components/ticket/qr-code";
import { cn } from "@/lib/utils";

export default function ProfileTicketsPage() {
  const [filterTab, setFilterTab] = useState<"ALL" | "UPCOMING" | "PAST">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const query = useOrders({ page: 1, limit: 100 });
  const allOrders = query.data?.data ?? [];

  // Filter for valid paid/issued orders
  const issuedOrders = allOrders.filter((order) =>
    [OrderStatus.Paid, OrderStatus.Confirmed, OrderStatus.TicketIssued].includes(
      order.status
    )
  );

  // Filter by upcoming / past
  const now = new Date();
  const timeFilteredOrders = issuedOrders.filter((order) => {
    if (!order.departureTime) return true;
    const depDate = new Date(order.departureTime);
    if (filterTab === "UPCOMING") return depDate >= now;
    if (filterTab === "PAST") return depDate < now;
    return true;
  });

  // Filter by search query
  const filteredOrders = timeFilteredOrders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const train = (order.trainNumber ?? "").toLowerCase();
    const dep = (order.departureStationName ?? "").toLowerCase();
    const arr = (order.arrivalStationName ?? "").toLowerCase();
    const code = (order.ticketCode ?? order.id ?? "").toLowerCase();
    return train.includes(q) || dep.includes(q) || arr.includes(q) || code.includes(q);
  });

  const printTicket = () => {
    window.print();
  };

  return (
    <ProfileLayout
      title="Vé tàu Tết của tôi"
      description="Thẻ lên tàu hỏa điện tử đã thanh toán. Xuất trình mã QR tại cửa soát vé ga tàu."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={printTicket}
          className="text-xs"
        >
          <Printer className="size-3.5 mr-1.5" />
          In tất cả vé
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Controls: Search and Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/60 self-start">
            {[
              { id: "ALL", label: "Tất cả vé" },
              { id: "UPCOMING", label: "Sắp khởi hành" },
              { id: "PAST", label: "Đã hoàn thành" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id as typeof filterTab)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  filterTab === tab.id
                    ? "bg-card text-primary shadow-xs"
                    : "text-ink-muted hover:text-ink"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo số tàu, ga đi, mã vé..."
              className="pl-8 text-xs h-9 bg-card"
            />
          </div>
        </div>

        {/* Content State */}
        {query.isLoading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card variant="outlined" padding="lg" className="text-center py-16 bg-card/60">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Ticket className="size-8" />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-ink">
              {searchQuery ? "Không tìm thấy vé phù hợp" : "Chưa có vé tàu Tết nào"}
            </h3>
            <p className="mt-1.5 text-sm text-ink-muted max-w-sm mx-auto">
              {searchQuery
                ? "Thử tìm kiếm với số hiệu tàu hoặc tên ga khác."
                : "Vé điện tử sẽ tự động xuất hiện ở đây ngay sau khi bạn đặt chỗ và thanh toán thành công."}
            </p>
            <Button asChild variant="default" className="mt-6 font-medium">
              <Link href="/search">
                <TrainFront className="size-4 mr-2" />
                Đặt vé tàu Tết 2026 ngay
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {filteredOrders.map((order) => {
              const ticketCode =
                order.ticketCode || `TCK-${order.id.slice(0, 8).toUpperCase()}`;
              const qrValue =
                order.qrPayload ||
                JSON.stringify({
                  orderId: order.id,
                  ticketCode,
                  train: order.trainNumber,
                  seats: order.seatLabels,
                });

              return (
                <div
                  key={order.id}
                  className="group relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-card shadow-sm hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Top Header: Train Info & Ticket Code */}
                  <div className="bg-gradient-to-r from-primary to-primary-hover px-5 py-3 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-white/15 text-gold">
                        <TrainFront className="size-4" />
                      </div>
                      <div>
                        <span className="font-mono text-sm font-bold tracking-tight">
                          Đoàn tàu {order.trainNumber ?? "SE"}
                        </span>
                        <span className="text-white/60 text-xs mx-1.5">·</span>
                        <span className="text-xs text-amber-200 font-medium">
                          Toa {order.coachCode ?? "1"} ({order.seatClass ?? "Ngồi mềm"})
                        </span>
                      </div>
                    </div>
                    <Badge variant="gold" className="font-mono text-xs font-bold tracking-wider">
                      {ticketCode}
                    </Badge>
                  </div>

                  {/* Main Journey Details & QR Section */}
                  <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-5 flex-1">
                    {/* Left: Journey & Passenger Info */}
                    <div className="space-y-3 flex-1 w-full sm:w-auto">
                      {/* Station Names */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-lg font-bold text-ink">
                            {order.departureStationName ?? order.departureStationCode}
                          </span>
                          <ArrowRight className="size-4 text-primary shrink-0" />
                          <span className="font-display text-lg font-bold text-ink">
                            {order.arrivalStationName ?? order.arrivalStationCode}
                          </span>
                        </div>
                        <p className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                          <Clock className="size-3.5" />
                          Khởi hành: {formatDateTime(order.departureTime)}
                        </p>
                      </div>

                      {/* Seat details */}
                      <div className="rounded-xl bg-muted/40 border border-border/60 p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-ink-muted">Chỗ ngồi:</span>
                          <span className="font-mono font-bold text-ink text-sm">
                            {order.seatLabels && order.seatLabels.length > 0
                              ? order.seatLabels.join(", ")
                              : `${order.quantity} chỗ`}
                          </span>
                        </div>
                        {order.passengers && order.passengers.length > 0 && (
                          <div className="flex justify-between items-center pt-1 border-t border-border/40">
                            <span className="text-ink-muted">Hành khách:</span>
                            <span className="font-medium text-ink truncate max-w-[180px]">
                              {order.passengers.map((p) => p.fullName).join(", ")}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-1 border-t border-border/40">
                          <span className="text-ink-muted">Tổng tiền:</span>
                          <span className="font-display font-bold text-primary text-sm tabular-nums">
                            {formatCurrency(order.totalPrice ?? "0")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Boarding Pass QR Stub */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/30 border border-border/80 shrink-0 text-center w-full sm:w-auto">
                      <div className="p-1 rounded-lg bg-white shadow-xs">
                        <TicketQRCode value={qrValue} size={110} />
                      </div>
                      <span className="mt-2 text-[10px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                        <QrCode className="size-3" />
                        Quét tại cửa ga
                      </span>
                    </div>
                  </div>

                  {/* Perforated dashed divider */}
                  <div className="relative border-t-2 border-dashed border-border/80">
                    <div className="absolute -left-3 -top-2.5 size-5 rounded-full bg-background border-r border-border" />
                    <div className="absolute -right-3 -top-2.5 size-5 rounded-full bg-background border-l border-border" />
                  </div>

                  {/* Bottom Footer Actions */}
                  <div className="bg-muted/10 px-5 py-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-ink-muted flex items-center gap-1">
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      Vé điện tử chính thức
                    </span>

                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm" className="text-xs h-8">
                        <Link href={`/orders/${order.id}`}>
                          Xem chi tiết đơn
                        </Link>
                      </Button>
                      <Button asChild variant="default" size="sm" className="text-xs h-8">
                        <Link href={`/orders/${order.id}`}>
                          Xem thẻ lên tàu
                          <ArrowRight className="size-3.5 ml-1" />
                        </Link>
                      </Button>
                    </div>
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
