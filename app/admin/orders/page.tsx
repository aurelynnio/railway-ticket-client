"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  ArrowRight,
  Search,
  Download,
  Filter,
  ShoppingCart,
  Mail,
  Phone,
  Calendar,
  Ticket,
} from "lucide-react";

import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrders } from "@/hooks/order.hook";
import {
  formatCurrency,
  formatDateTime,
  formatOrderStatus,
  getOrderStatusTone,
} from "@/lib/formatters";
import { OrderStatus } from "@/lib/api-types/order";
import { cn } from "@/lib/utils";

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const statusNumber = selectedStatus === "all" ? undefined : Number(selectedStatus);

  const query = useOrders({
    page,
    limit: 50,
    status: statusNumber,
  });

  const rawOrders = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  // Search filter
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return rawOrders;
    const q = searchQuery.toLowerCase().trim();
    return rawOrders.filter((o) => {
      const idMatch = o.id?.toLowerCase().includes(q);
      const emailMatch = o.contactEmail?.toLowerCase().includes(q);
      const phoneMatch = o.contactPhone?.toLowerCase().includes(q);
      const trainMatch = o.trainNumber?.toLowerCase().includes(q);
      const userMatch = o.userId?.toLowerCase().includes(q);
      return idMatch || emailMatch || phoneMatch || trainMatch || userMatch;
    });
  }, [rawOrders, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredOrders.length) return;
    const headers = [
      "Mã đơn",
      "Khách hàng (User ID)",
      "Email liên hệ",
      "Số điện thoại",
      "Số tàu",
      "Ga đi",
      "Ga đến",
      "Số lượng vé",
      "Danh sách chỗ",
      "Tổng tiền (VNĐ)",
      "Trạng thái",
      "Ngày đặt",
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.id}"`,
      `"${o.userId ?? ""}"`,
      `"${o.contactEmail ?? ""}"`,
      `"${o.contactPhone ?? ""}"`,
      `"${o.trainNumber ?? ""}"`,
      `"${o.departureStationName ?? ""}"`,
      `"${o.arrivalStationName ?? ""}"`,
      o.quantity ?? 1,
      `"${(o.seatLabels ?? []).join(", ")}"`,
      Number(o.totalPrice) || 0,
      `"${formatOrderStatus(o.status)}"`,
      `"${new Date(o.createdAt).toLocaleString("vi-VN")}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `danh-sach-don-hang-tet-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusTabs = [
    { value: "all", label: "Tất cả" },
    { value: String(OrderStatus.PendingPayment), label: "Chờ thanh toán" },
    { value: String(OrderStatus.Paid), label: "Đã thanh toán" },
    { value: String(OrderStatus.Confirmed), label: "Đã xác nhận" },
    { value: String(OrderStatus.TicketIssued), label: "Đã xuất vé" },
    { value: String(OrderStatus.Cancelled), label: "Đã hủy" },
    { value: String(OrderStatus.Refunded), label: "Đã hoàn tiền" },
  ];

  return (
    <AdminLayout
      title="Quản lý đơn hàng đặt vé"
      description="Theo dõi danh sách đặt chỗ, hành khách, trạng thái thanh toán và xuất vé."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={!filteredOrders.length}
          className="gap-1.5"
        >
          <Download className="size-3.5" />
          <span>Xuất file CSV</span>
        </Button>
      }
    >
      {/* Search and Filters */}
      <Card variant="outlined" padding="lg" className="space-y-4">
        {/* Status Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-border">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(1);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                selectedStatus === tab.value
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-muted/40 text-ink-muted hover:bg-muted hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <Input
              placeholder="Tìm theo mã đơn hàng (#A1B2C3), email, số điện thoại, số tàu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="text-xs text-ink-muted"
            >
              Xóa tìm kiếm
            </Button>
          )}
        </div>
      </Card>

      {/* Orders Table */}
      <Card variant="outlined" padding="none">
        {query.isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-muted">
            Không tìm thấy đơn hàng nào phù hợp với điều kiện tìm kiếm.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Mã đơn</TableHead>
                <TableHead>Khách hàng & Liên hệ</TableHead>
                <TableHead>Chuyến tàu & Chỗ</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((o) => (
                <TableRow key={o.id} className="hover:bg-muted/30">
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-ink">
                      #{o.id?.slice(0, 8).toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-xs text-ink truncate max-w-[200px]">
                        {o.contactEmail || `User: ${o.userId?.slice(0, 8)}`}
                      </p>
                      {o.contactPhone && (
                        <p className="text-[11px] text-ink-muted flex items-center gap-1 font-mono">
                          <Phone className="size-3 text-ink-subtle" />
                          {o.contactPhone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-xs text-ink">
                        {o.trainNumber ? `Tàu ${o.trainNumber}` : o.ticketTitle || "Vé tàu"}
                      </p>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        {o.departureStationName && o.arrivalStationName
                          ? `${o.departureStationName} → ${o.arrivalStationName} • `
                          : ""}
                        {o.quantity} vé {o.seatLabels?.length ? `(${o.seatLabels.join(", ")})` : ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {formatDateTime(o.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getOrderStatusTone(o.status)}>
                      {formatOrderStatus(o.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold tabular-nums text-primary text-sm">
                    {formatCurrency(o.totalPrice ?? "0")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/orders/${o.id}`}>
                        Chi tiết
                        <ArrowRight className="size-3.5 ml-1" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
