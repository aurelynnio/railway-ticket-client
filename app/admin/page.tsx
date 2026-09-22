"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Ticket,
  ShoppingCart,
  Users,
  Wallet,
  TrendingUp,
  RefreshCw,
  Plus,
  Tag,
  Bell,
  ArrowRight,
  TrainFront,
  Calendar,
  CheckCircle2,
  Clock3,
  Percent,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useTickets } from "@/hooks/ticket.hook";
import { useOrders } from "@/hooks/order.hook";
import { usePayments } from "@/hooks/payment.hook";
import { useListUsers } from "@/hooks/user.hook";
import {
  formatCurrency,
  formatDateTime,
  formatOrderStatus,
  getOrderStatusTone,
} from "@/lib/formatters";
import { OrderStatus } from "@/lib/api-types/order";
import { cn } from "@/lib/utils";

type TimeRange = "today" | "7d" | "30d" | "all";

export default function AdminPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const tickets = useTickets({ page: 1, limit: 100 });
  const orders = useOrders({ page: 1, limit: 100 });
  const payments = usePayments({ page: 1, limit: 100 });
  const users = useListUsers(1, 100);

  const isRefreshing =
    tickets.isFetching || orders.isFetching || payments.isFetching || users.isFetching;

  const refreshAll = () => {
    tickets.refetch();
    orders.refetch();
    payments.refetch();
    users.refetch();
  };

  // Filter orders by time range
  const filteredOrders = useMemo(() => {
    const list = orders.data?.data ?? [];
    if (timeRange === "all") return list;

    const now = new Date().getTime();
    const msLimit =
      timeRange === "today"
        ? 24 * 60 * 60 * 1000
        : timeRange === "7d"
          ? 7 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;

    return list.filter((o) => {
      const created = new Date(o.createdAt).getTime();
      return now - created <= msLimit;
    });
  }, [orders.data?.data, timeRange]);

  // Financial calculations
  const metrics = useMemo(() => {
    const all = filteredOrders;
    const paidOrders = all.filter(
      (o) =>
        o.status === OrderStatus.Paid ||
        o.status === OrderStatus.Confirmed ||
        o.status === OrderStatus.TicketIssued,
    );

    const totalRevenue = paidOrders.reduce(
      (sum, o) => sum + (Number(o.totalPrice) || 0),
      0,
    );

    const successRate =
      all.length > 0 ? Math.round((paidOrders.length / all.length) * 100) : 100;

    // Ticket capacity metrics
    const ticketList = tickets.data?.data ?? [];
    let totalSeats = 0;
    let availableSeats = 0;

    ticketList.forEach((t) => {
      (t.ticketItems ?? []).forEach((item) => {
        totalSeats += item.stockInitial ?? 0;
        availableSeats += item.stockAvailable ?? 0;
      });
    });

    const bookedSeats = Math.max(0, totalSeats - availableSeats);
    const occupancyRate =
      totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

    return {
      totalRevenue,
      totalOrdersCount: all.length,
      paidOrdersCount: paidOrders.length,
      successRate,
      totalSeats,
      availableSeats,
      bookedSeats,
      occupancyRate,
      totalUsers: users.data?.pagination?.total ?? 0,
      totalTrains: ticketList.length,
    };
  }, [filteredOrders, tickets.data?.data, users.data?.pagination?.total]);

  // Chart data: 7 days timeline simulation based on real orders
  const chartPoints = useMemo(() => {
    const days: Array<{ label: string; revenue: number; count: number }> = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;

      // Sum orders for this day
      const dayOrders = (orders.data?.data ?? []).filter((o) => {
        const orderDate = new Date(o.createdAt);
        return (
          orderDate.getDate() === d.getDate() &&
          orderDate.getMonth() === d.getMonth() &&
          orderDate.getFullYear() === d.getFullYear()
        );
      });

      const dayRevenue = dayOrders
        .filter(
          (o) =>
            o.status === OrderStatus.Paid ||
            o.status === OrderStatus.Confirmed ||
            o.status === OrderStatus.TicketIssued,
        )
        .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

      days.push({
        label: dateStr,
        revenue: dayRevenue,
        count: dayOrders.length,
      });
    }

    const maxRev = Math.max(...days.map((d) => d.revenue), 1000000);
    return { days, maxRev };
  }, [orders.data?.data]);

  const recentOrders = (orders.data?.data ?? []).slice(0, 6);
  const activeTickets = (tickets.data?.data ?? []).slice(0, 5);

  return (
    <AdminLayout
      title="Bảng điều khiển quản trị"
      description="Giám sát doanh thu, tỷ lệ lấp đầy ghế và tình trạng đặt vé tàu Tết 2026."
      actions={
        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="hidden sm:flex items-center rounded-lg border border-border bg-card p-0.5 text-xs font-medium">
            {(
              [
                { id: "all", label: "Toàn bộ" },
                { id: "30d", label: "30 ngày" },
                { id: "7d", label: "7 ngày" },
                { id: "today", label: "Hôm nay" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeRange(t.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 transition-colors",
                  timeRange === t.id
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCw
              className={cn("size-3.5", isRefreshing && "animate-spin")}
            />
            <span>Đồng bộ</span>
          </Button>
        </div>
      }
    >
      {/* Quick Actions Shortcuts Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          href="/admin/tickets/new"
          className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary-soft/60 p-3.5 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 group shadow-xs"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary group-hover:bg-primary-foreground/20 group-hover:text-primary-foreground">
            <Plus className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-xs leading-none">Tạo chuyến tàu</p>
            <p className="mt-1 text-[11px] opacity-80 truncate">Thêm lịch tàu mới</p>
          </div>
        </Link>

        <Link
          href="/admin/orders"
          className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent-soft/60 p-3.5 text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-200 group shadow-xs"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent group-hover:bg-accent-foreground/20 group-hover:text-accent-foreground">
            <ShoppingCart className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-xs leading-none">Xử lý đơn hàng</p>
            <p className="mt-1 text-[11px] opacity-80 truncate">Xem các đơn cần duyệt</p>
          </div>
        </Link>

        <Link
          href="/admin/vouchers"
          className="flex items-center gap-3 rounded-xl border border-gold/20 bg-gold-soft/60 p-3.5 text-gold hover:bg-gold hover:text-ink transition-all duration-200 group shadow-xs"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold group-hover:bg-ink/10 group-hover:text-ink">
            <Tag className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-xs leading-none">Mã ưu đãi Tết</p>
            <p className="mt-1 text-[11px] opacity-80 truncate">Tạo & phát hành mã</p>
          </div>
        </Link>

        <Link
          href="/admin/notifications"
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-ink hover:border-primary/50 transition-all duration-200 group shadow-xs"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-ink-muted group-hover:bg-primary group-hover:text-primary-foreground">
            <Bell className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-xs leading-none">Gửi thông báo</p>
            <p className="mt-1 text-[11px] text-ink-muted truncate">Email marketing Tết</p>
          </div>
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Doanh thu */}
        <Card variant="outlined" padding="lg" className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Wallet className="size-5" />
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <TrendingUp className="size-3.5" />
              Tết 2026
            </span>
          </div>
          <p className="mt-4 font-display text-2xl sm:text-3xl font-bold tabular-nums text-ink">
            {orders.isLoading ? "—" : formatCurrency(metrics.totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Doanh thu thực nhận ({metrics.paidOrdersCount} đơn thành công)
          </p>
        </Card>

        {/* Tổng đơn hàng & Tỷ lệ thành công */}
        <Card variant="outlined" padding="lg">
          <div className="flex items-center justify-between">
            <span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <ShoppingCart className="size-5" />
            </span>
            <Badge variant="outline" className="text-xs">
              {metrics.successRate}% hoàn tất
            </Badge>
          </div>
          <p className="mt-4 font-display text-2xl sm:text-3xl font-bold tabular-nums text-ink">
            {orders.isLoading ? "—" : metrics.totalOrdersCount}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Tổng đơn hàng đặt chỗ trong hệ thống
          </p>
        </Card>

        {/* Lấp đầy ghế Tết */}
        <Card variant="outlined" padding="lg">
          <div className="flex items-center justify-between">
            <span className="flex size-11 items-center justify-center rounded-xl bg-gold-soft text-gold">
              <Ticket className="size-5" />
            </span>
            <Badge
              variant={metrics.occupancyRate > 70 ? "destructive" : "secondary"}
              className="text-xs"
            >
              {metrics.occupancyRate}% đã đặt
            </Badge>
          </div>
          <p className="mt-4 font-display text-2xl sm:text-3xl font-bold tabular-nums text-ink">
            {tickets.isLoading
              ? "—"
              : `${metrics.bookedSeats} / ${metrics.totalSeats || "—"}`}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Chỗ đã bán trên {metrics.totalTrains} chuyến tàu
          </p>
        </Card>

        {/* Khách hàng & Thành viên */}
        <Card variant="outlined" padding="lg">
          <div className="flex items-center justify-between">
            <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-ink">
              <Users className="size-5" />
            </span>
            <span className="text-xs text-ink-muted font-medium">Toàn hệ thống</span>
          </div>
          <p className="mt-4 font-display text-2xl sm:text-3xl font-bold tabular-nums text-ink">
            {users.isLoading ? "—" : metrics.totalUsers}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Tài khoản người dùng đã đăng ký
          </p>
        </Card>
      </div>

      {/* Revenue & Bookings Trend Chart */}
      <Card variant="outlined" padding="lg" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h2 className="font-display text-base font-bold text-ink">
              Biểu đồ doanh thu 7 ngày gần nhất
            </h2>
            <p className="text-xs text-ink-muted">
              Theo dõi tốc độ thanh toán và giao dịch đặt vé tàu Tết theo từng ngày
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary" />
              Doanh thu
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-accent" />
              Số lượng đơn
            </span>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="pt-4">
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 border-b border-border pb-2">
            {chartPoints.days.map((item, idx) => {
              const heightPercent =
                chartPoints.maxRev > 0
                  ? Math.max(12, Math.round((item.revenue / chartPoints.maxRev) * 100))
                  : 12;

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-end h-full gap-2 group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-ink text-background text-[11px] rounded-md px-2 py-1 shadow-lg whitespace-nowrap pointer-events-none">
                    <span className="font-semibold">{formatCurrency(item.revenue)}</span>
                    <span className="text-[10px] opacity-80">{item.count} đơn</span>
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[42px] bg-muted rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-primary to-accent rounded-t-md transition-all duration-500 group-hover:opacity-90"
                    />
                  </div>

                  {/* Day Label */}
                  <span className="text-[11px] font-medium text-ink-muted group-hover:text-ink">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Tabs: Đơn hàng gần đây & Chuyến tàu tiêu biểu */}
      <Tabs defaultValue="orders">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <TabsList>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="size-3.5" />
              Đơn hàng gần đây
            </TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2">
              <TrainFront className="size-3.5" />
              Chuyến tàu Tết mở bán
            </TabsTrigger>
          </TabsList>

          <Button asChild variant="ghost" size="sm" className="text-xs gap-1">
            <Link href="/admin/orders">
              Xem tất cả
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {/* Tab 1: Orders */}
        <TabsContent value="orders" className="mt-4">
          <Card variant="outlined" padding="none">
            {orders.isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-12 text-center text-sm text-ink-muted">
                Chưa có đơn hàng nào được ghi nhận.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-card border border-border text-primary font-mono text-xs font-bold shrink-0">
                        #{order.id?.slice(0, 6).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-ink">
                            {order.trainNumber
                              ? `Tàu ${order.trainNumber}`
                              : order.ticketTitle || "Vé tàu"}
                          </span>
                          <Badge variant={getOrderStatusTone(order.status)}>
                            {formatOrderStatus(order.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {order.departureStationName && order.arrivalStationName
                            ? `${order.departureStationName} → ${order.arrivalStationName} • `
                            : ""}
                          {order.quantity} vé • {formatDateTime(order.createdAt)}
                          {order.contactEmail ? ` • ${order.contactEmail}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-13 sm:pl-0">
                      <span className="font-mono text-sm font-bold tabular-nums text-primary">
                        {formatCurrency(order.totalPrice ?? "0")}
                      </span>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/orders/${order.id}`}>
                          Chi tiết
                          <ArrowRight className="size-3.5 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab 2: Tickets */}
        <TabsContent value="tickets" className="mt-4">
          <Card variant="outlined" padding="none">
            {tickets.isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : activeTickets.length === 0 ? (
              <div className="p-12 text-center text-sm text-ink-muted">
                Chưa có chuyến tàu nào trong hệ thống.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {activeTickets.map((t) => {
                  const totalSeats =
                    t.ticketItems?.reduce((s, i) => s + (i.stockInitial ?? 0), 0) ?? 0;
                  const availableSeats =
                    t.ticketItems?.reduce((s, i) => s + (i.stockAvailable ?? 0), 0) ?? 0;
                  const booked = Math.max(0, totalSeats - availableSeats);
                  const occupancy = totalSeats > 0 ? Math.round((booked / totalSeats) * 100) : 0;

                  return (
                    <div
                      key={t.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-mono text-xs font-bold shrink-0">
                          {t.trainNumber ?? "SE"}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-ink">
                              {t.departureStationName} → {t.arrivalStationName}
                            </span>
                            <Badge variant={t.status === 1 ? "success" : "secondary"}>
                              {t.status === 1 ? "Đang mở bán" : "Nháp"}
                            </Badge>
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5">
                            Khởi hành: {formatDateTime(t.dateStart)} • {t.ticketItems?.length ?? 0} hạng vé
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pl-13 sm:pl-0">
                        {/* Occupancy bar */}
                        <div className="w-32 hidden md:block">
                          <div className="flex justify-between text-[10px] text-ink-muted mb-1">
                            <span>Lấp đầy</span>
                            <span className="font-semibold">{occupancy}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              style={{ width: `${occupancy}%` }}
                              className={cn(
                                "h-full rounded-full",
                                occupancy > 80 ? "bg-destructive" : "bg-primary",
                              )}
                            />
                          </div>
                        </div>

                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/tickets/${t.id}`}>
                            Quản lý
                            <ArrowRight className="size-3.5 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
