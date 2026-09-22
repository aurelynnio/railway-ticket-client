"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  TrainFront,
  Sparkles,
  Armchair,
  Bed,
  CheckCircle2,
  Eye,
  Layers,
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
import { useAddTicketItem, useRemoveTicketItem, useTicket } from "@/hooks/ticket.hook";
import { formatCurrency } from "@/lib/formatters";
import {
  optionalIntegerText,
  requiredCsvText,
  requiredText,
  splitCsv,
} from "@/lib/validation";
import { cn } from "@/lib/utils";

const itemSchema = z
  .object({
    name: requiredText("Tên hạng"),
    coachCode: z.string().optional(),
    seatClass: z.string().optional(),
    seatType: z.string().optional(),
    priceOriginal: z
      .string()
      .trim()
      .min(1, "Giá gốc là bắt buộc")
      .regex(/^\d+$/, "Giá gốc phải là số nguyên"),
    priceFlash: z
      .string()
      .trim()
      .refine(
        (v) => v.length === 0 || /^\d+$/.test(v),
        "Giá flash phải là số nguyên",
      )
      .optional(),
    stockInitial: optionalIntegerText("Số chỗ", 0),
    availableSeatLabels: requiredCsvText("Danh sách chỗ"),
    saleStartTime: z.string().optional(),
    saleEndTime: z.string().optional(),
  })
  .refine(
    (v) => !v.saleStartTime || !v.saleEndTime || v.saleStartTime <= v.saleEndTime,
    { message: "Thời gian mở bán phải trước thời gian đóng bán", path: ["saleEndTime"] },
  )
  .refine(
    (v) => {
      if (!v.priceFlash?.trim() || !v.priceOriginal?.trim()) return true;
      const flash = Number(v.priceFlash.trim());
      const orig = Number(v.priceOriginal.trim());
      if (Number.isNaN(flash) || Number.isNaN(orig)) return true;
      return flash <= orig;
    },
    { message: "Giá flash không được lớn hơn giá gốc", path: ["priceFlash"] },
  );

export default function AdminTicketItemsPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;

  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name?: string | null } | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const query = useTicket(ticketId);
  const ticket = query.data;
  const addItem = useAddTicketItem();
  const removeItem = useRemoveTicketItem();

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "Ngồi mềm điều hòa",
      coachCode: "Toa 1",
      seatClass: "ngồi",
      seatType: "ngồi mềm điều hòa",
      priceOriginal: "950000",
      priceFlash: "",
      stockInitial: "64",
      availableSeatLabels: Array.from({ length: 64 }, (_, i) => String(i + 1).padStart(2, "0")).join(", "),
      saleStartTime: "",
      saleEndTime: "",
    },
  });

  // Preset generator helpers
  const applyPreset = (preset: "seat64" | "bed28" | "bed42" | "vip16") => {
    if (preset === "seat64") {
      const seats = Array.from({ length: 64 }, (_, i) => String(i + 1).padStart(2, "0")).join(", ");
      form.setValue("name", "Ngồi mềm điều hòa (64 chỗ)");
      form.setValue("coachCode", "Toa 1");
      form.setValue("seatClass", "ngồi");
      form.setValue("seatType", "ngồi mềm điều hòa");
      form.setValue("priceOriginal", "850000");
      form.setValue("stockInitial", "64");
      form.setValue("availableSeatLabels", seats);
    } else if (preset === "bed28") {
      // 7 cabins x 4 beds
      const seats: string[] = [];
      for (let c = 1; c <= 7; c++) {
        for (let b = 1; b <= 4; b++) {
          seats.push(`K${c}-G${b}`);
        }
      }
      form.setValue("name", "Giường nằm khoang 4 (28 giường)");
      form.setValue("coachCode", "Toa 2");
      form.setValue("seatClass", "nằm");
      form.setValue("seatType", "khoang 4 giường");
      form.setValue("priceOriginal", "1450000");
      form.setValue("stockInitial", "28");
      form.setValue("availableSeatLabels", seats.join(", "));
    } else if (preset === "bed42") {
      // 7 cabins x 6 beds
      const seats: string[] = [];
      for (let c = 1; c <= 7; c++) {
        for (let b = 1; b <= 6; b++) {
          seats.push(`K${c}-G${b}`);
        }
      }
      form.setValue("name", "Giường nằm khoang 6 (42 giường)");
      form.setValue("coachCode", "Toa 3");
      form.setValue("seatClass", "nằm");
      form.setValue("seatType", "khoang 6 giường");
      form.setValue("priceOriginal", "1150000");
      form.setValue("stockInitial", "42");
      form.setValue("availableSeatLabels", seats.join(", "));
    } else if (preset === "vip16") {
      const seats = Array.from({ length: 16 }, (_, i) => `VIP-${String(i + 1).padStart(2, "0")}`).join(", ");
      form.setValue("name", "Toa VIP khoang đôi cao cấp (16 chỗ)");
      form.setValue("coachCode", "Toa VIP");
      form.setValue("seatClass", "ngồi");
      form.setValue("seatType", "ghế VIP thương gia");
      form.setValue("priceOriginal", "2200000");
      form.setValue("stockInitial", "16");
      form.setValue("availableSeatLabels", seats);
    }
  };

  if (query.isLoading) {
    return (
      <AdminLayout title="Quản lý hạng vé">
        <Skeleton className="h-60 w-full" />
      </AdminLayout>
    );
  }

  const items = ticket?.ticketItems ?? [];

  return (
    <AdminLayout
      title={`Quản lý hạng vé — Tàu ${ticket?.trainNumber ?? ""}`}
      description={`Cấu hình toa tàu, giá vé và số chỗ cho tuyến ${ticket?.departureStationName} → ${ticket?.arrivalStationName}`}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/tickets/${ticketId}`}>
              <ArrowLeft className="size-3.5 mr-1" />
              Chi tiết vé tàu
            </Link>
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={() => setShowForm((v) => !v)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            {showForm ? "Đóng form" : "Thêm toa / Hạng vé"}
          </Button>
        </div>
      }
    >
      {/* Train Info Banner */}
      <Card variant="outlined" padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground font-mono text-sm font-bold shadow-xs">
              {ticket?.trainNumber ?? "SE"}
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                {ticket?.title || `${ticket?.departureStationName} → ${ticket?.arrivalStationName}`}
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                {ticket?.departureStationName} ({ticket?.departureStationCode}) →{" "}
                {ticket?.arrivalStationName} ({ticket?.arrivalStationCode}) • {items.length} toa/hạng vé đã tạo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline">
              Tổng số chỗ: {items.reduce((s, i) => s + (i.stockInitial ?? 0), 0)}
            </Badge>
            <Badge variant="success">
              Còn trống: {items.reduce((s, i) => s + (i.stockAvailable ?? 0), 0)}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Preset Creation Form */}
      {showForm && (
        <Card variant="outlined" padding="lg" className="border-primary/40 bg-card shadow-sm animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
                <Sparkles className="size-4 text-accent" />
                Thêm toa tàu / Hạng vé mới
              </h3>
              <p className="text-xs text-ink-muted">
                Chọn mẫu cấu hình tự động (Preset) hoặc tự điền chi tiết bên dưới.
              </p>
            </div>

            {/* Presets Button Bar */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-ink-muted mr-1">Mẫu nhanh:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8 gap-1"
                onClick={() => applyPreset("seat64")}
              >
                <Armchair className="size-3 text-primary" />
                Ngồi mềm 64 chỗ
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8 gap-1"
                onClick={() => applyPreset("bed28")}
              >
                <Bed className="size-3 text-accent" />
                Nằm khoang 4 (28)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8 gap-1"
                onClick={() => applyPreset("bed42")}
              >
                <Bed className="size-3 text-gold" />
                Nằm khoang 6 (42)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8 gap-1"
                onClick={() => applyPreset("vip16")}
              >
                <Sparkles className="size-3 text-primary" />
                Toa VIP 16 chỗ
              </Button>
            </div>
          </div>

          <form
            className="mt-5 space-y-5"
            onSubmit={form.handleSubmit((values) =>
              addItem.mutate(
                {
                  ticketId,
                  payload: {
                    name: values.name,
                    coachCode: values.coachCode || undefined,
                    seatClass: values.seatClass || undefined,
                    seatType: values.seatType || undefined,
                    priceOriginal: Number(values.priceOriginal),
                    priceFlash: values.priceFlash ? Number(values.priceFlash) : undefined,
                    stockInitial: values.stockInitial ? Number(values.stockInitial) : undefined,
                    availableSeatLabels: splitCsv(values.availableSeatLabels),
                    saleStartTime: values.saleStartTime ? new Date(values.saleStartTime).toISOString() : undefined,
                    saleEndTime: values.saleEndTime ? new Date(values.saleEndTime).toISOString() : undefined,
                  },
                },
                {
                  onSuccess: () => {
                    form.reset();
                    setShowForm(false);
                  },
                },
              ),
            )}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Tên hạng vé */}
              <div className="space-y-1.5 lg:col-span-2">
                <Label htmlFor="itemName">Tên hạng vé & Toa</Label>
                <Input
                  id="itemName"
                  placeholder="VD: Ngồi mềm điều hòa"
                  aria-invalid={Boolean(form.formState.errors.name)}
                  {...form.register("name")}
                />
                {form.formState.errors.name?.message && (
                  <p className="text-xs font-medium text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Mã toa */}
              <div className="space-y-1.5">
                <Label htmlFor="coachCode">Mã toa</Label>
                <Input
                  id="coachCode"
                  placeholder="VD: Toa 1, Toa 2"
                  {...form.register("coachCode")}
                />
              </div>

              {/* Phân loại ghế */}
              <div className="space-y-1.5">
                <Label htmlFor="seatClass">Hạng chỗ</Label>
                <Select id="seatClass" {...form.register("seatClass")}>
                  <option value="ngồi">Ghế ngồi</option>
                  <option value="nằm">Giường nằm</option>
                </Select>
              </div>

              {/* Loại chỗ chi tiết */}
              <div className="space-y-1.5">
                <Label htmlFor="seatType">Loại chỗ chi tiết</Label>
                <Input
                  id="seatType"
                  placeholder="VD: ngồi mềm, khoang 4..."
                  {...form.register("seatType")}
                />
              </div>

              {/* Giá vé gốc */}
              <div className="space-y-1.5">
                <Label htmlFor="origPrice">Giá vé niêm yết (VNĐ)</Label>
                <Input
                  id="origPrice"
                  placeholder="VD: 850000"
                  aria-invalid={Boolean(form.formState.errors.priceOriginal)}
                  {...form.register("priceOriginal")}
                />
                {form.formState.errors.priceOriginal?.message && (
                  <p className="text-xs font-medium text-destructive">{form.formState.errors.priceOriginal.message}</p>
                )}
              </div>

              {/* Giá flash sale */}
              <div className="space-y-1.5">
                <Label htmlFor="flashPrice">Giá ưu đãi Tết (nếu có)</Label>
                <Input
                  id="flashPrice"
                  placeholder="VD: 750000"
                  {...form.register("priceFlash")}
                />
              </div>

              {/* Tổng số chỗ */}
              <div className="space-y-1.5">
                <Label htmlFor="stock">Tổng số chỗ</Label>
                <Input
                  id="stock"
                  placeholder="VD: 64"
                  aria-invalid={Boolean(form.formState.errors.stockInitial)}
                  {...form.register("stockInitial")}
                />
              </div>
            </div>

            {/* Danh sách ghế */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="seats">Danh sách mã ghế (phân cách bằng dấu phẩy)</Label>
                <span className="text-[11px] text-ink-muted">
                  {splitCsv(form.watch("availableSeatLabels") || "").length} mã ghế hợp lệ
                </span>
              </div>
              <textarea
                id="seats"
                rows={3}
                className="w-full rounded-lg border border-border bg-background p-2.5 font-mono text-xs text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="01, 02, 03, 04, 05..."
                {...form.register("availableSeatLabels")}
              />
              {form.formState.errors.availableSeatLabels?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.availableSeatLabels.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="default" disabled={addItem.isPending}>
                {addItem.isPending ? "Đang lưu..." : "Xác nhận tạo hạng vé"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Items List Table */}
      <Card variant="outlined" padding="none">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-ink">
            Danh sách toa & hạng vé của tàu ({items.length} hạng)
          </h3>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-muted">
            Chưa có hạng vé nào. Hãy bấm <b>"Thêm toa / Hạng vé"</b> ở trên để tạo toa đầu tiên!
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Toa</TableHead>
                <TableHead>Tên hạng vé</TableHead>
                <TableHead>Loại chỗ</TableHead>
                <TableHead className="text-right">Giá gốc</TableHead>
                <TableHead className="text-right">Giá Tết</TableHead>
                <TableHead className="text-center">Số chỗ khả dụng</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isExpanded = expandedItemId === item.id;
                const seatList = item.availableSeatLabels ?? [];

                return (
                  <>
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Badge variant="outline" className="font-mono font-semibold">
                          {item.coachCode || "Toa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-sm text-ink">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-xs text-ink-muted capitalize">
                        {item.seatClass ? `${item.seatClass} (${item.seatType || "tiêu chuẩn"})` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-sm text-ink">
                        {formatCurrency(item.priceOriginal ?? "0")}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-accent">
                        {item.priceFlash ? formatCurrency(item.priceFlash) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={(item.stockAvailable ?? 0) > 0 ? "success" : "destructive"}
                          className="font-mono text-xs"
                        >
                          {item.stockAvailable ?? 0} / {item.stockInitial ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                            className="text-xs gap-1"
                          >
                            <Eye className="size-3.5" />
                            {isExpanded ? "Thu gọn" : "Xem chỗ"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expandable Seat Matrix */}
                    {isExpanded && (
                      <TableRow key={`expand-${item.id}`} className="bg-muted/20">
                        <TableCell colSpan={7} className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-ink">
                              <span>Sơ đồ danh sách mã chỗ ({seatList.length} chỗ mở bán):</span>
                              <span className="text-[11px] text-ink-muted">
                                Xanh: Ghế khả dụng • Mã toa: {item.coachCode || "N/A"}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 rounded-lg border border-border bg-card">
                              {seatList.length === 0 ? (
                                <span className="text-xs text-ink-muted">Không có danh sách ghế cụ thể.</span>
                              ) : (
                                seatList.map((seat, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="inline-flex items-center justify-center rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 shadow-2xs"
                                  >
                                    {seat}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa hạng vé?"
        description={`Bạn có chắc chắn muốn xóa hạng vé "${deleteTarget?.name}" không? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa hạng vé"
        confirmPending={removeItem.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            removeItem.mutate(
              { ticketId, ticketItemId: deleteTarget.id },
              { onSuccess: () => setDeleteTarget(null) },
            );
          }
        }}
      />
    </AdminLayout>
  );
}