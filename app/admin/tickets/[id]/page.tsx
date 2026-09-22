"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
  Trash2,
  TrainFront,
  Package,
  Megaphone,
  PauseCircle,
  PlayCircle,
  Boxes,
  LayoutGrid,
  SlidersHorizontal,
  Armchair,
  Layers,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCloseSale,
  useOpenSale,
  usePrepareStock,
  usePublishTicket,
  useRemoveTicket,
  useSeatMap,
  useTicket,
  useUnpublishTicket,
  useUpdateTicket,
} from "@/hooks/ticket.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import {
  requiredStationCode,
  requiredStationName,
  requiredText,
  splitCsv,
} from "@/lib/validation";
import { cn } from "@/lib/utils";

const editSchema = z
  .object({
    title: requiredText("Tiêu đề"),
    trainNumber: requiredText("Số tàu"),
    departureStationCode: requiredStationCode("Mã ga đi"),
    departureStationName: requiredStationName("Tên ga đi"),
    arrivalStationCode: requiredStationCode("Mã ga đến"),
    arrivalStationName: requiredStationName("Tên ga đến"),
    dateStart: z.string().min(1, "Vui lòng chọn thời gian khởi hành"),
    dateEnd: z.string().min(1, "Vui lòng chọn thời gian đến"),
    journeyNote: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.departureStationCode || !data.arrivalStationCode) return true;
      return (
        data.departureStationCode.trim().toUpperCase() !==
        data.arrivalStationCode.trim().toUpperCase()
      );
    },
    {
      message: "Ga đến không được trùng với ga đi",
      path: ["arrivalStationCode"],
    },
  )
  .refine(
    (data) => {
      if (!data.dateStart || !data.dateEnd) return true;
      return new Date(data.dateEnd) >= new Date(data.dateStart);
    },
    {
      message: "Thời gian đến phải sau thời gian khởi hành",
      path: ["dateEnd"],
    },
  );

const stockSchema = z.object({
  stockInitial: z
    .string()
    .trim()
    .min(1, "Số chỗ ban đầu là bắt buộc")
    .regex(/^\d+$/, "Số chỗ phải là số nguyên")
    .refine((v) => Number(v) >= 0, "Số chỗ phải lớn hơn hoặc bằng 0"),
  availableSeatLabels: z.string().optional(),
});

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;

  const query = useTicket(ticketId);
  const ticket = query.data;

  const seatMapQuery = useSeatMap(ticketId);
  const seatMap = seatMapQuery.data;

  const update = useUpdateTicket(ticketId);
  const remove = useRemoveTicket();
  const publish = usePublishTicket();
  const unpublish = useUnpublishTicket();
  const openSale = useOpenSale();
  const closeSale = useCloseSale();
  const prepareStock = usePrepareStock();

  const [isEditing, setIsEditing] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeCoachTab, setActiveCoachTab] = useState<string>("all");

  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: "",
      trainNumber: "",
      departureStationCode: "",
      departureStationName: "",
      arrivalStationCode: "",
      arrivalStationName: "",
      dateStart: "",
      dateEnd: "",
      journeyNote: "",
    },
  });

  const stockForm = useForm<z.infer<typeof stockSchema>>({
    resolver: zodResolver(stockSchema),
    defaultValues: { stockInitial: "", availableSeatLabels: "" },
  });

  useEffect(() => {
    if (ticket) {
      form.reset({
        title: ticket.title ?? "",
        trainNumber: ticket.trainNumber ?? "",
        departureStationCode: ticket.departureStationCode ?? "",
        departureStationName: ticket.departureStationName ?? "",
        arrivalStationCode: ticket.arrivalStationCode ?? "",
        arrivalStationName: ticket.arrivalStationName ?? "",
        dateStart: ticket.dateStart ? ticket.dateStart.slice(0, 16) : "",
        dateEnd: ticket.dateEnd ? ticket.dateEnd.slice(0, 16) : "",
        journeyNote: ticket.journeyNote ?? "",
      });
    }
  }, [ticket, form]);

  if (query.isLoading) {
    return (
      <AdminLayout title="Chi tiết vé tàu">
        <Skeleton className="h-60 w-full" />
      </AdminLayout>
    );
  }

  const published = ticket?.status === 1;
  const items = ticket?.ticketItems ?? [];
  const totalStock = items.reduce((s, i) => s + (i.stockInitial ?? 0), 0);
  const availableStock = items.reduce((s, i) => s + (i.stockAvailable ?? 0), 0);
  const bookedStock = Math.max(0, totalStock - availableStock);
  const occupancyPercent = totalStock > 0 ? Math.round((bookedStock / totalStock) * 100) : 0;

  return (
    <AdminLayout
      title={`Chi tiết chuyến tàu ${ticket?.trainNumber ?? ""}`}
      description={`${ticket?.departureStationName} → ${ticket?.arrivalStationName} (${formatDateTime(ticket?.dateStart)})`}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/tickets">
              <ArrowLeft className="size-3.5 mr-1" />
              Danh sách vé
            </Link>
          </Button>
          <Button asChild variant="accent" size="sm" className="gap-1.5">
            <Link href={`/admin/tickets/${ticketId}/items`}>
              <Layers className="size-3.5" />
              Quản lý toa & hạng vé
            </Link>
          </Button>
        </div>
      }
    >
      {/* Top Status & Summary Card */}
      <Card variant="outlined" padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-mono text-base font-bold shadow-xs">
              {ticket?.trainNumber ?? "SE"}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-ink">
                  {ticket?.departureStationName} → {ticket?.arrivalStationName}
                </h2>
                <Badge variant={published ? "success" : "secondary"}>
                  {published ? "Đang mở bán" : "Nháp / Đóng"}
                </Badge>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                {ticket?.title}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg border border-border bg-card px-3 py-1.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-ink-muted">Tổng số chỗ</p>
              <p className="font-mono text-base font-bold text-ink">{totalStock}</p>
            </div>
            <div className="rounded-lg border border-border bg-card px-3 py-1.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-ink-muted">Chỗ còn trống</p>
              <p className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                {availableStock}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card px-3 py-1.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-ink-muted">Lấp đầy</p>
              <p className="font-mono text-base font-bold text-accent">{occupancyPercent}%</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs: Tổng quan & Sơ đồ đoàn tàu */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <TrainFront className="size-3.5" />
            Thông tin hành trình & Thao tác
          </TabsTrigger>
          <TabsTrigger value="seatmap" className="gap-2">
            <LayoutGrid className="size-3.5" />
            Sơ đồ ghế trực quan ({seatMap?.items?.length ?? items.length} toa)
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card variant="outlined" padding="lg">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-display text-base font-bold text-ink">
                Lịch trình & Thông tin chi tiết
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing((v) => !v)}
              >
                <SlidersHorizontal className="size-3.5 mr-1" />
                {isEditing ? "Đóng chỉnh sửa" : "Chỉnh sửa"}
              </Button>
            </div>

            {isEditing ? (
              <form
                className="mt-5 space-y-5"
                onSubmit={form.handleSubmit((values) =>
                  update.mutate(values, {
                    onSuccess: () => setIsEditing(false),
                  }),
                )}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="t">Tiêu đề</Label>
                    <Input id="t" {...form.register("title")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="n">Số tàu</Label>
                    <Input id="n" {...form.register("trainNumber")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ds">Ga đi</Label>
                    <Input id="ds" {...form.register("departureStationName")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="as">Ga đến</Label>
                    <Input id="as" {...form.register("arrivalStationName")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dStart">Thời gian khởi hành</Label>
                    <Input id="dStart" type="datetime-local" {...form.register("dateStart")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dEnd">Thời gian đến</Label>
                    <Input id="dEnd" type="datetime-local" {...form.register("dateEnd")} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="note">Ghi chú hành trình</Label>
                  <Input id="note" {...form.register("journeyNote")} />
                </div>
                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" variant="default" disabled={update.isPending}>
                    <Save className="size-3.5 mr-1" />
                    Lưu thay đổi
                  </Button>
                </div>
              </form>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Info label="Ga khởi hành" value={`${ticket?.departureStationName} (${ticket?.departureStationCode})`} />
                <Info label="Ga đến" value={`${ticket?.arrivalStationName} (${ticket?.arrivalStationCode})`} />
                <Info label="Số hiệu đoàn tàu" value={ticket?.trainNumber ?? "—"} />
                <Info label="Thời gian khởi hành" value={formatDateTime(ticket?.dateStart)} />
                <Info label="Thời gian đến dự kiến" value={formatDateTime(ticket?.dateEnd)} />
                <Info label="Số hạng vé đang có" value={`${items.length} hạng vé`} />
                <div className="sm:col-span-2 lg:col-span-3">
                  <Info label="Ghi chú dịch vụ" value={ticket?.journeyNote || "Không có ghi chú"} />
                </div>
              </div>
            )}

            {/* Thao tác điều hành */}
            <div className="mt-6 border-t border-border pt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Thao tác vận hành đoàn tàu
              </h4>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {published ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unpublish.mutate({ ticketId })}
                    disabled={unpublish.isPending}
                    className="gap-1.5"
                  >
                    <PauseCircle className="size-3.5 text-amber-600" />
                    Tạm dừng bán
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => publish.mutate({ ticketId })}
                    disabled={publish.isPending}
                    className="gap-1.5"
                  >
                    <Megaphone className="size-3.5" />
                    Công bố & Mở bán
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openSale.mutate({ ticketId, payload: {} })}
                  disabled={openSale.isPending}
                  className="gap-1.5"
                >
                  <PlayCircle className="size-3.5 text-emerald-600" />
                  Mở bán chỗ
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => closeSale.mutate({ ticketId })}
                  disabled={closeSale.isPending}
                  className="gap-1.5"
                >
                  <PauseCircle className="size-3.5" />
                  Đóng bán chỗ
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStock((v) => !v)}
                  className="gap-1.5"
                >
                  <Package className="size-3.5" />
                  {showStock ? "Đóng kho" : "Cập nhật kho nhanh"}
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  className="gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  Xóa chuyến tàu
                </Button>
              </div>

              {/* Quick Stock Prep Form */}
              {showStock && (
                <form
                  className="mt-4 grid gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:grid-cols-3"
                  onSubmit={stockForm.handleSubmit((values) =>
                    prepareStock.mutate(
                      {
                        ticketId,
                        payload: {
                          stockInitial: Number(values.stockInitial),
                          availableSeatLabels: splitCsv(values.availableSeatLabels ?? ""),
                        },
                      },
                      { onSuccess: () => setShowStock(false) },
                    ),
                  )}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="stock">Số chỗ ban đầu</Label>
                    <Input id="stock" placeholder="VD: 64" {...stockForm.register("stockInitial")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="seats">Danh sách mã chỗ</Label>
                    <Input id="seats" placeholder="01, 02, 03..." {...stockForm.register("availableSeatLabels")} />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" variant="default" size="sm" disabled={prepareStock.isPending}>
                      <Boxes className="size-3.5 mr-1" />
                      {prepareStock.isPending ? "Đang xử lý..." : "Cập nhật kho"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Visual Real-Time Seat Map */}
        <TabsContent value="seatmap" className="mt-4 space-y-4">
          <Card variant="outlined" padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="font-display text-base font-bold text-ink">
                  Sơ đồ đoàn tàu & Trạng thái chỗ ngồi thực tế
                </h3>
                <p className="text-xs text-ink-muted">
                  Dữ liệu đồng bộ trực tiếp từ hệ thống giữ chỗ Redis & cơ sở dữ liệu
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded border border-emerald-500 bg-emerald-500/20" />
                  Ghế trống
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded border border-destructive bg-destructive/20" />
                  Đã đặt / Đang giữ
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => seatMapQuery.refetch()}
                  disabled={seatMapQuery.isFetching}
                  className="h-8 text-xs"
                >
                  <RefreshCw className={cn("size-3 mr-1", seatMapQuery.isFetching && "animate-spin")} />
                  Làm mới
                </Button>
              </div>
            </div>

            {/* Coach filter selector */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant={activeCoachTab === "all" ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setActiveCoachTab("all")}
              >
                Tất cả các toa ({items.length})
              </Button>
              {items.map((item) => (
                <Button
                  key={item.id}
                  variant={activeCoachTab === item.id ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setActiveCoachTab(item.id)}
                >
                  {item.coachCode || item.name}
                </Button>
              ))}
            </div>

            {/* Carriages display */}
            <div className="mt-6 space-y-6">
              {items
                .filter((item) => activeCoachTab === "all" || activeCoachTab === item.id)
                .map((coach) => {
                  const mapItem = seatMap?.items?.find((m) => m.ticketItemId === coach.id);
                  const available = mapItem?.availableSeatLabels ?? coach.availableSeatLabels ?? [];
                  const occupied = mapItem?.occupiedSeatLabels ?? [];
                  const allSeats = mapItem?.seatLabels?.length
                    ? mapItem.seatLabels
                    : Array.from(new Set([...available, ...occupied]));

                  return (
                    <div
                      key={coach.id}
                      className="rounded-xl border border-border bg-card p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono font-bold">
                            {coach.coachCode || "Toa"}
                          </Badge>
                          <span className="font-semibold text-sm text-ink">{coach.name}</span>
                          <span className="text-xs text-ink-muted capitalize">
                            • {coach.seatClass || "Tiêu chuẩn"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-emerald-600 font-medium">
                            {available.length} trống
                          </span>
                          <span>/</span>
                          <span className="text-destructive font-medium">
                            {occupied.length} đã đặt
                          </span>
                        </div>
                      </div>

                      {/* Visual Seat Grid */}
                      <div className="pt-2">
                        {allSeats.length === 0 ? (
                          <p className="text-xs text-ink-muted py-4 text-center">
                            Toa này chưa cấu hình danh sách ghế. Hãy vào "Quản lý toa & hạng vé" để cấu hình.
                          </p>
                        ) : (
                          <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-12 gap-1.5 max-h-60 overflow-y-auto p-1">
                            {allSeats.map((seat) => {
                              const isOccupied = occupied.includes(seat);
                              return (
                                <div
                                  key={seat}
                                  title={`${seat}: ${isOccupied ? "Đã đặt / Đang giữ chỗ" : "Còn trống"}`}
                                  className={cn(
                                    "flex flex-col items-center justify-center rounded-md p-1.5 font-mono text-[11px] font-bold border transition-colors cursor-default",
                                    isOccupied
                                      ? "border-destructive/40 bg-destructive/15 text-destructive"
                                      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:border-emerald-500",
                                  )}
                                >
                                  <span>{seat}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Xóa chuyến tàu này?"
        description={`Bạn có chắc chắn muốn xóa chuyến tàu "${ticket?.trainNumber}" (${ticket?.departureStationName} → ${ticket?.arrivalStationName}) và toàn bộ toa ghế liên quan? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa chuyến tàu"
        confirmPending={remove.isPending}
        onConfirm={() =>
          remove.mutate({ ticketId }, { onSuccess: () => router.push("/admin/tickets") })
        }
      />
    </AdminLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <p className="text-[11px] uppercase tracking-wider text-ink-muted font-semibold">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}