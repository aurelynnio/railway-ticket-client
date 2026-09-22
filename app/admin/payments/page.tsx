"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  ArrowRight,
  Search,
  Download,
  Wallet,
  CheckCircle2,
  Clock3,
  XCircle,
  RotateCcw,
  CreditCard,
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
import { usePayments } from "@/hooks/payment.hook";
import {
  formatCurrency,
  formatDateTime,
  formatPaymentStatus,
  getPaymentStatusTone,
} from "@/lib/formatters";
import { PaymentStatus } from "@/lib/api-types/payment";
import { cn } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const query = usePayments({
    page,
    limit: 50,
    status: statusFilter === "all" ? undefined : Number(statusFilter),
    paymentMethod: methodFilter === "all" ? undefined : methodFilter,
  });

  const rawPayments = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  // Search filter
  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return rawPayments;
    const q = searchQuery.toLowerCase().trim();
    return rawPayments.filter(
      (p) =>
        p.id?.toLowerCase().includes(q) ||
        p.orderId?.toLowerCase().includes(q) ||
        p.transactionId?.toLowerCase().includes(q) ||
        p.userId?.toLowerCase().includes(q),
    );
  }, [rawPayments, searchQuery]);

  // Financial summary
  const summary = useMemo(() => {
    const paidList = filteredPayments.filter((p) => p.status === PaymentStatus.Paid);
    const totalAmount = paidList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return {
      totalCount: filteredPayments.length,
      paidCount: paidList.length,
      totalAmount,
    };
  }, [filteredPayments]);

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredPayments.length) return;
    const headers = [
      "Mã thanh toán",
      "Mã đơn hàng",
      "Mã giao dịch cổng (VNPay)",
      "User ID",
      "Phương thức",
      "Số tiền (VNĐ)",
      "Trạng thái",
      "Ngày tạo",
      "Ngày thanh toán",
    ];

    const rows = filteredPayments.map((p) => [
      `"${p.id}"`,
      `"${p.orderId ?? ""}"`,
      `"${p.transactionId ?? ""}"`,
      `"${p.userId ?? ""}"`,
      `"${p.paymentMethod ?? "VNPay"}"`,
      Number(p.amount) || 0,
      `"${formatPaymentStatus(p.status)}"`,
      `"${new Date(p.createdAt).toLocaleString("vi-VN")}"`,
      `"${p.paidAt ? new Date(p.paidAt).toLocaleString("vi-VN") : ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `danh-sach-thanh-toan-tet-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout
      title="Quản lý giao dịch thanh toán"
      description="Giám sát dòng tiền, cổng thanh toán VNPay và đối soát giao dịch trực tuyến."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={!filteredPayments.length}
          className="gap-1.5"
        >
          <Download className="size-3.5" />
          <span>Xuất file đối soát CSV</span>
        </Button>
      }
    >
      {/* Financial KPIs Banner */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="outlined" padding="lg">
          <p className="text-xs text-ink-muted">Tổng tiền thực thu (Thành công)</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-primary">
            {formatCurrency(summary.totalAmount)}
          </p>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            {summary.paidCount} giao dịch hoàn tất
          </p>
        </Card>

        <Card variant="outlined" padding="lg">
          <p className="text-xs text-ink-muted">Tổng số giao dịch ghi nhận</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-ink">
            {summary.totalCount}
          </p>
          <p className="mt-1 text-[11px] text-ink-muted">
            Bao gồm cả đang chờ và đã hoàn tất
          </p>
        </Card>

        <Card variant="outlined" padding="lg">
          <p className="text-xs text-ink-muted">Cổng thanh toán chính</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="font-semibold text-xs px-2.5 py-1">
              VNPay Cổng Quốc Gia
            </Badge>
            <span className="text-[11px] text-emerald-600 font-medium">● Hoạt động 24/7</span>
          </div>
          <p className="mt-1 text-[11px] text-ink-muted">
            Hỗ trợ Thẻ ATM / Thẻ Visa / VNPay-QR
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card variant="outlined" padding="lg">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-center">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <Input
              placeholder="Tìm theo mã thanh toán, mã đơn hàng, mã VNPay..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value={String(PaymentStatus.Paid)}>Đã thanh toán (Thành công)</option>
              <option value={String(PaymentStatus.Pending)}>Đang chờ thanh toán</option>
              <option value={String(PaymentStatus.Failed)}>Thất bại</option>
              <option value={String(PaymentStatus.Refunded)}>Đã hoàn tiền</option>
            </Select>
          </div>

          <div>
            <Select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs"
            >
              <option value="all">Tất cả phương thức</option>
              <option value="VNPAY">VNPay</option>
              <option value="MOCK">Thử nghiệm (Mock)</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Payments Table */}
      <Card variant="outlined" padding="none">
        {query.isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-muted">
            Không tìm thấy giao dịch nào phù hợp.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Mã GD</TableHead>
                <TableHead>Mã đơn hàng</TableHead>
                <TableHead>Phương thức</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/30">
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-ink">
                      #{p.id?.slice(0, 8).toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${p.orderId}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      #{p.orderId?.slice(0, 8).toUpperCase()}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {p.paymentMethod ?? "VNPay"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {formatDateTime(p.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPaymentStatusTone(p.status)}>
                      {formatPaymentStatus(p.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold tabular-nums text-primary text-sm">
                    {formatCurrency(p.amount ?? "0")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/payments/${p.id}`}>
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
