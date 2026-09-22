"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Plus,
  ArrowRight,
  TrainFront,
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
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
import { useTickets } from "@/hooks/ticket.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { STATIONS } from "@/lib/stations";
import { cn } from "@/lib/utils";

export default function AdminTicketsPage() {
  const [page, setPage] = useState(1);
  const [searchTrain, setSearchTrain] = useState("");
  const [filterDep, setFilterDep] = useState("");
  const [filterArr, setFilterArr] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const query = useTickets({
    page,
    limit: 50,
    departureStationCode: filterDep || undefined,
    arrivalStationCode: filterArr || undefined,
    status: filterStatus === "all" ? undefined : filterStatus,
  });

  const rawTickets = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  // Client-side search for train number or title
  const filteredTickets = useMemo(() => {
    if (!searchTrain.trim()) return rawTickets;
    const q = searchTrain.toLowerCase().trim();
    return rawTickets.filter(
      (t) =>
        t.trainNumber?.toLowerCase().includes(q) ||
        t.title?.toLowerCase().includes(q) ||
        t.departureStationName?.toLowerCase().includes(q) ||
        t.arrivalStationName?.toLowerCase().includes(q),
    );
  }, [rawTickets, searchTrain]);

  // Export tickets list to CSV
  const handleExportCSV = () => {
    if (!filteredTickets.length) return;
    const headers = [
      "Mã vé",
      "Số tàu",
      "Tiêu đề",
      "Ga đi",
      "Ga đến",
      "Thời gian đi",
      "Thời gian đến",
      "Trạng thái",
      "Số hạng vé",
      "Tổng số chỗ",
      "Chỗ khả dụng",
      "Giá vé thấp nhất",
    ];

    const rows = filteredTickets.map((t) => {
      const totalStock = t.ticketItems?.reduce((s, i) => s + (i.stockInitial ?? 0), 0) ?? 0;
      const availStock = t.ticketItems?.reduce((s, i) => s + (i.stockAvailable ?? 0), 0) ?? 0;
      const minPrice = t.ticketItems?.[0]?.priceOriginal ?? 0;

      return [
        `"${t.id}"`,
        `"${t.trainNumber ?? ""}"`,
        `"${t.title ?? ""}"`,
        `"${t.departureStationName ?? t.departureStationCode ?? ""}"`,
        `"${t.arrivalStationName ?? t.arrivalStationCode ?? ""}"`,
        `"${t.dateStart ? new Date(t.dateStart).toLocaleString("vi-VN") : ""}"`,
        `"${t.dateEnd ? new Date(t.dateEnd).toLocaleString("vi-VN") : ""}"`,
        `"${t.status === 1 ? "Đang mở bán" : "Nháp/Tạm dừng"}"`,
        t.ticketItems?.length ?? 0,
        totalStock,
        availStock,
        minPrice,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `danh-sach-ve-tau-tet-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearchTrain("");
    setFilterDep("");
    setFilterArr("");
    setFilterStatus("all");
    setPage(1);
  };

  const hasFilters = Boolean(searchTrain || filterDep || filterArr || filterStatus !== "all");

  return (
    <AdminLayout
      title="Quản lý vé tàu Tết 2026"
      description="Quản lý chuyến tàu, hạng vé, sơ đồ ghế và lịch trình cao điểm Tết Ất Tỵ."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!filteredTickets.length}
            className="gap-1.5"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Xuất CSV</span>
          </Button>
          <Button asChild variant="accent" size="sm" className="gap-1.5">
            <Link href="/admin/tickets/new">
              <Plus className="size-4" />
              Tạo chuyến mới
            </Link>
          </Button>
        </div>
      }
    >
      {/* Search & Filter Bar */}
      <Card variant="outlined" padding="lg">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-center">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <Input
              placeholder="Tìm theo số tàu (SE1, TN1) hoặc tên chuyến..."
              value={searchTrain}
              onChange={(e) => setSearchTrain(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Filter Ga Đi */}
          <div>
            <Select
              value={filterDep}
              onChange={(e) => {
                setFilterDep(e.target.value);
                setPage(1);
              }}
              className="text-xs"
            >
              <option value="">Tất cả ga đi</option>
              {STATIONS.map((s) => (
                <option key={`dep-${s.code}`} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </Select>
          </div>

          {/* Filter Ga Đến */}
          <div>
            <Select
              value={filterArr}
              onChange={(e) => {
                setFilterArr(e.target.value);
                setPage(1);
              }}
              className="text-xs"
            >
              <option value="">Tất cả ga đến</option>
              {STATIONS.map((s) => (
                <option key={`arr-${s.code}`} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </Select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2">
            <Select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs flex-1"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="1">Đang mở bán</option>
              <option value="0">Nháp / Đóng</option>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-ink-muted hover:text-ink shrink-0"
              >
                Đặt lại
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card variant="outlined" padding="none">
        {query.isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-muted">
            Không tìm thấy chuyến tàu nào phù hợp với bộ lọc.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Tàu</TableHead>
                <TableHead>Hành trình</TableHead>
                <TableHead>Ngày khởi hành</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Giá thấp nhất</TableHead>
                <TableHead className="text-center">Chỗ khả dụng</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((t) => {
                const totalStock =
                  t.ticketItems?.reduce((s, i) => s + (i.stockInitial ?? 0), 0) ?? 0;
                const availableStock =
                  t.ticketItems?.reduce((s, i) => s + (i.stockAvailable ?? 0), 0) ?? 0;
                const booked = Math.max(0, totalStock - availableStock);
                const occupancy = totalStock > 0 ? Math.round((booked / totalStock) * 100) : 0;
                const isPublished = t.status === 1;

                return (
                  <TableRow key={t.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Badge variant="default" className="font-mono font-bold">
                        <TrainFront className="size-3 mr-1" />
                        {t.trainNumber ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-sm text-ink">
                        {t.departureStationName ?? t.departureStationCode} →{" "}
                        {t.arrivalStationName ?? t.arrivalStationCode}
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        {t.title || `${t.ticketItems?.length ?? 0} hạng vé`}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-ink-muted">
                      {formatDateTime(t.dateStart)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isPublished ? "success" : "secondary"}>
                        {isPublished ? "Đang mở bán" : "Nháp"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold tabular-nums text-primary text-sm">
                      {formatCurrency(t.ticketItems?.[0]?.priceOriginal ?? "0")}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge
                          variant={availableStock > 0 ? "outline" : "destructive"}
                          className="font-mono text-xs"
                        >
                          {availableStock} / {totalStock || "—"}
                        </Badge>
                        {totalStock > 0 && (
                          <span className="text-[10px] text-ink-muted">
                            ({occupancy}% đã đặt)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/tickets/${t.id}`}>
                          Quản lý
                          <ArrowRight className="size-3.5 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
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
            Trang trước
          </Button>
          <span className="text-xs text-ink-muted font-medium">
            Trang {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Trang sau
          </Button>
        </div>
      )}
    </AdminLayout>
  );
}
