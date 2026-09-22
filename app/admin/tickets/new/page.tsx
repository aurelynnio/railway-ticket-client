"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  TrainFront,
  MapPin,
  Clock3,
  Calendar,
  Sparkles,
  Info,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTicket } from "@/hooks/ticket.hook";
import { STATIONS, findStationByCode, estimateJourneyHours } from "@/lib/stations";
import {
  requiredStationCode,
  requiredStationName,
  requiredText,
} from "@/lib/validation";

const schema = z
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

export default function AdminNewTicketPage() {
  const router = useRouter();
  const create = useCreateTicket();

  const [selectedDep, setSelectedDep] = useState("HAN");
  const [selectedArr, setSelectedArr] = useState("SGN");

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "Vé Tàu Tết SE1: Hà Nội → Sài Gòn",
      trainNumber: "SE1",
      departureStationCode: "HAN",
      departureStationName: "Hà Nội",
      arrivalStationCode: "SGN",
      arrivalStationName: "Sài Gòn",
      dateStart: "",
      dateEnd: "",
      journeyNote: "Tàu Thống Nhất cao điểm Tết 2026. Phục vụ ăn nhẹ và nước suối miễn phí.",
    },
  });

  // Calculate distance & travel hours
  const depStation = findStationByCode(selectedDep);
  const arrStation = findStationByCode(selectedArr);
  const estHours = estimateJourneyHours(selectedDep, selectedArr);
  const distanceKm =
    depStation && arrStation
      ? Math.abs(arrStation.kmNum - depStation.kmNum)
      : null;

  // Handle station selection change
  const handleDepartureChange = (code: string) => {
    setSelectedDep(code);
    const station = findStationByCode(code);
    if (station) {
      form.setValue("departureStationCode", station.code);
      form.setValue("departureStationName", station.name);
      updateSuggestedTitle(station.name, form.getValues("arrivalStationName"), form.getValues("trainNumber"));
    }
  };

  const handleArrivalChange = (code: string) => {
    setSelectedArr(code);
    const station = findStationByCode(code);
    if (station) {
      form.setValue("arrivalStationCode", station.code);
      form.setValue("arrivalStationName", station.name);
      updateSuggestedTitle(form.getValues("departureStationName"), station.name, form.getValues("trainNumber"));
    }
  };

  const updateSuggestedTitle = (depName: string, arrName: string, train: string) => {
    if (depName && arrName) {
      form.setValue("title", `Vé Tàu Tết ${train || "SE"}: ${depName} → ${arrName}`);
    }
  };

  // Pre-fill suggested arrival date when departure date is selected
  const handleDateStartChange = (val: string) => {
    form.setValue("dateStart", val);
    if (val && !form.getValues("dateEnd")) {
      const startDate = new Date(val);
      const endDate = new Date(startDate.getTime() + estHours * 60 * 60 * 1000);
      form.setValue("dateEnd", endDate.toISOString().slice(0, 16));
    }
  };

  const onSubmit = form.handleSubmit((values) => {
    create.mutate(values, {
      onSuccess: (data) => router.push(`/admin/tickets/${data.id}`),
    });
  });

  return (
    <AdminLayout
      title="Tạo chuyến tàu mới"
      description="Thêm lịch trình tàu chạy phục vụ cao điểm Tết 2026."
    >
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
          <Link href="/admin/tickets">
            <ArrowLeft className="size-3.5" />
            Quay lại danh sách vé
          </Link>
        </Button>
      </div>

      <Card variant="outlined" padding="lg">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Journey Estimation Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-accent/20 bg-accent-soft/40 p-4 text-xs text-ink">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground font-bold">
                <TrainFront className="size-4" />
              </span>
              <div>
                <p className="font-semibold text-sm">
                  Lộ trình: {depStation?.name} ({depStation?.code}) → {arrStation?.name} ({arrStation?.code})
                </p>
                <p className="text-ink-muted mt-0.5">
                  Đường sắt Bắc - Nam • {distanceKm ? `Cự ly: ${distanceKm} km` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:self-center font-medium bg-card px-3 py-1.5 rounded-lg border border-border">
              <Clock3 className="size-3.5 text-accent" />
              <span>Thời gian chạy ước tính: ~{estHours} giờ</span>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Train Number */}
            <div className="space-y-2">
              <Label htmlFor="trainNumber">Số hiệu tàu</Label>
              <div className="relative">
                <TrainFront className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
                <Input
                  id="trainNumber"
                  placeholder="VD: SE1, SE2, SE3, TN1"
                  className="pl-10 font-mono font-bold"
                  aria-invalid={Boolean(form.formState.errors.trainNumber)}
                  {...form.register("trainNumber", {
                    onChange: (e) =>
                      updateSuggestedTitle(
                        form.getValues("departureStationName"),
                        form.getValues("arrivalStationName"),
                        e.target.value,
                      ),
                  })}
                />
              </div>
              {form.formState.errors.trainNumber?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.trainNumber.message}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề chuyến tàu</Label>
              <Input
                id="title"
                placeholder="VD: Vé Tàu Tết SE1: Hà Nội → Sài Gòn"
                aria-invalid={Boolean(form.formState.errors.title)}
                {...form.register("title")}
              />
              {form.formState.errors.title?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
          </div>

          {/* Station Selectors */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Ga đi */}
            <div className="space-y-2">
              <Label htmlFor="depStation">Ga đi (Khởi hành)</Label>
              <Select
                id="depStation"
                value={selectedDep}
                onChange={(e) => handleDepartureChange(e.target.value)}
              >
                {STATIONS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code}) — km {s.kmNum}
                  </option>
                ))}
              </Select>
              {form.formState.errors.departureStationCode?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.departureStationCode.message}
                </p>
              )}
            </div>

            {/* Ga đến */}
            <div className="space-y-2">
              <Label htmlFor="arrStation">Ga đến (Đích)</Label>
              <Select
                id="arrStation"
                value={selectedArr}
                onChange={(e) => handleArrivalChange(e.target.value)}
              >
                {STATIONS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code}) — km {s.kmNum}
                  </option>
                ))}
              </Select>
              {form.formState.errors.arrivalStationCode?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.arrivalStationCode.message}
                </p>
              )}
            </div>
          </div>

          {/* Departure and Arrival Dates */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateStart">Thời gian khởi hành</Label>
              <Input
                id="dateStart"
                type="datetime-local"
                aria-invalid={Boolean(form.formState.errors.dateStart)}
                {...form.register("dateStart", {
                  onChange: (e) => handleDateStartChange(e.target.value),
                })}
              />
              {form.formState.errors.dateStart?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.dateStart.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="dateEnd">Thời gian đến dự kiến</Label>
                {form.getValues("dateStart") && (
                  <button
                    type="button"
                    onClick={() => {
                      const start = new Date(form.getValues("dateStart"));
                      const end = new Date(start.getTime() + estHours * 3600000);
                      form.setValue("dateEnd", end.toISOString().slice(0, 16));
                    }}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Tự động điền (+{estHours}h)
                  </button>
                )}
              </div>
              <Input
                id="dateEnd"
                type="datetime-local"
                aria-invalid={Boolean(form.formState.errors.dateEnd)}
                {...form.register("dateEnd")}
              />
              {form.formState.errors.dateEnd?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.dateEnd.message}
                </p>
              )}
            </div>
          </div>

          {/* Journey Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Ghi chú hành trình & Dịch vụ trên tàu</Label>
            <Textarea
              id="note"
              rows={3}
              placeholder="VD: Phục vụ suất ăn nóng, máy lạnh xuyên suốt hành trình, wifi miễn phí..."
              {...form.register("journeyNote")}
            />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/tickets")}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={create.isPending}
              className="gap-2"
            >
              <Save className="size-4" />
              {create.isPending ? "Đang lưu..." : "Tạo chuyến tàu"}
            </Button>
          </div>
        </form>
      </Card>
    </AdminLayout>
  );
}
