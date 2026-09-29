"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  Search,
  X,
  TrainFront,
  ArrowRight,
  MapPin,
  Sparkles,
  ChevronRight,
  Filter,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuickSearchTrains } from "@/hooks/search.hook";
import { formatCurrency } from "@/lib/formatters";
import type { SearchTripResponse } from "@/lib/api-types";
import { cn } from "@/lib/utils";

const POPULAR_TRAINS = ["SE1", "SE2", "SE3", "SE4", "SE5", "SE6", "SE7", "SE8", "TN1"];
const POPULAR_ROUTES = [
  { label: "Hà Nội → Sài Gòn", query: "Sài Gòn" },
  { label: "Sài Gòn → Đà Nẵng", query: "Đà Nẵng" },
  { label: "Sài Gòn → Nha Trang", query: "Nha Trang" },
  { label: "Hà Nội → Vinh", query: "Vinh" },
];

export interface QuickSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickSearchModal({ open, onOpenChange }: QuickSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { data: trips = [], isLoading } = useQuickSearchTrains(query, 8);

  // Focus input when modal opens
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setQuery("");
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle keyboard navigation (ArrowUp, ArrowDown, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (trips.length > 0 ? (prev + 1) % trips.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (trips.length > 0 ? (prev - 1 + trips.length) % trips.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (trips.length > 0 && trips[selectedIndex]) {
        handleSelectTrip(trips[selectedIndex]);
      } else if (query.trim()) {
        onOpenChange(false);
        router.push(`/search?from=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const handleSelectTrip = (trip: SearchTripResponse) => {
    onOpenChange(false);
    router.push(`/tickets/${trip.ticketId}`);
  };

  const handleSearchPage = () => {
    onOpenChange(false);
    if (query.trim()) {
      router.push(`/search?from=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-1400 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Modal content dialog */}
        <DialogPrimitive.Content
          onKeyDown={handleKeyDown}
          className={cn(
            "fixed left-1/2 top-[12%] z-1450 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl bg-card border border-surface-3 shadow-overlay focus:outline-none focus-visible:outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Tìm kiếm chuyến tàu nhanh
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Gõ số hiệu tàu hoặc ga để tìm kiếm chuyến tàu và chọn vé nhanh.
          </DialogPrimitive.Description>

          {/* Search Input Bar */}
          <div className="relative flex items-center border-b border-surface-3 px-4 py-3.5 sm:px-6">
            <Search className="size-5 shrink-0 text-primary" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Tìm theo số hiệu tàu (SE1, SE3...), ga đi, ga đến..."
              className="ml-3 flex-1 bg-transparent text-sm sm:text-base font-medium text-ink placeholder:text-ink-muted border-none p-0 outline-none ring-0 ring-offset-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
              style={{ outline: "none", boxShadow: "none", border: "none" }}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="mr-2 rounded-md p-1 text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors"
                aria-label="Xóa từ khóa"
              >
                <X className="size-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center rounded-md bg-surface-2 px-2 py-0.5 text-[10px] font-mono text-ink-subtle">
              ESC
            </kbd>
          </div>

          {/* Content Body */}
          <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Quick chips when query is empty or short */}
            {!query.trim() && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5 mb-2.5">
                    <Sparkles className="size-3.5 text-gold" />
                    Đoàn tàu Tết phổ biến
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_TRAINS.map((train) => (
                      <button
                        key={train}
                        type="button"
                        onClick={() => {
                          setQuery(train);
                          inputRef.current?.focus();
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-surface-2 hover:bg-surface-3 px-2.5 py-1 text-xs font-mono font-semibold text-ink transition-colors"
                      >
                        <TrainFront className="size-3 text-primary" />
                        {train}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5 mb-2.5">
                    <MapPin className="size-3.5 text-accent" />
                    Tuyến đường cao điểm
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                    {POPULAR_ROUTES.map((route) => (
                      <button
                        key={route.label}
                        type="button"
                        onClick={() => {
                          setQuery(route.query);
                          inputRef.current?.focus();
                        }}
                        className="flex items-center justify-between rounded-xl bg-surface-2/60 hover:bg-surface-2 p-2.5 text-left text-xs font-medium text-ink transition-colors border border-surface-3/50"
                      >
                        <span>{route.label}</span>
                        <ChevronRight className="size-3 text-ink-subtle" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Live Search Results */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  {query.trim() ? "Kết quả chuyến tàu phù hợp" : "Chuyến tàu Tết đang mở bán"}
                </span>
                {trips.length > 0 && (
                  <span className="text-[11px] font-medium text-ink-subtle">
                    {trips.length} chuyến tìm thấy
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border border-surface-3 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-6 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : trips.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-subtle">
                    <TrainFront className="size-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink text-sm sm:text-base">
                      Không tìm thấy chuyến tàu nào cho &quot;{query}&quot;
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Thử tìm kiếm với số hiệu tàu khác (ví dụ SE1, SE3) hoặc tên ga (Hà Nội, Sài Gòn).
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSearchPage}
                    className="mt-2"
                  >
                    <Filter className="size-3.5 mr-1.5" />
                    Mở trang tìm kiếm nâng cao
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {trips.map((trip: SearchTripResponse, idx: number) => {
                    const isSelected = idx === selectedIndex;
                    const depTime = trip.dateStart
                      ? new Date(trip.dateStart).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      : "—:—";
                    const arrTime = trip.dateEnd
                      ? new Date(trip.dateEnd).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      : "—:—";

                    return (
                      <div
                        key={trip.ticketId}
                        onClick={() => handleSelectTrip(trip)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          "group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-3 sm:px-4 sm:py-3 transition-all cursor-pointer border",
                          isSelected
                            ? "border-primary/40 bg-primary/5 shadow-2xs"
                            : "border-surface-3/70 bg-card hover:border-surface-3 hover:bg-surface-2/60",
                        )}
                      >
                        {/* Left: Train details */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="font-mono text-xs py-0.5">
                              <TrainFront className="size-3 mr-1" />
                              Tàu {trip.trainNumber ?? "—"}
                            </Badge>
                            <Badge
                              variant={
                                trip.availableSeats > 5
                                  ? "success"
                                  : trip.availableSeats > 0
                                    ? "warning"
                                    : "destructive"
                              }
                              className="text-[10px]"
                            >
                              {trip.availableSeats > 0 ? `${trip.availableSeats} chỗ` : "Hết chỗ"}
                            </Badge>
                            {trip.title && (
                              <span className="text-xs text-ink-muted truncate max-w-50">
                                {trip.title}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold text-ink">
                              {trip.from.name ?? trip.from.code}
                            </span>
                            <span className="text-primary font-bold">→</span>
                            <span className="font-semibold text-ink">
                              {trip.to.name ?? trip.to.code}
                            </span>
                            <span className="text-xs text-ink-muted font-mono ml-1">
                              ({depTime} – {arrTime})
                            </span>
                          </div>
                        </div>

                        {/* Right: Price & CTA */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-3/60">
                          <div className="text-left sm:text-right">
                            <p className="text-[10px] uppercase font-semibold text-ink-muted">
                              Giá từ
                            </p>
                            <p className="font-display text-base font-bold tabular-nums text-primary">
                              {formatCurrency(trip.minPrice)}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                              isSelected
                                ? "bg-primary text-white"
                                : "bg-surface-2 text-ink group-hover:bg-primary group-hover:text-white",
                            )}
                          >
                            <span>Chọn vé</span>
                            <ArrowRight className="size-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-3 bg-surface-2/40 px-4 py-3 sm:px-6 text-xs text-ink-muted">
            <button
              type="button"
              onClick={handleSearchPage}
              className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
            >
              <span>Xem tất cả kết quả trên trang Tìm vé Tết</span>
              <ArrowRight className="size-3.5" />
            </button>
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-ink-subtle">
              <span>
                <kbd className="rounded bg-card px-1 py-0.5 border border-surface-3">↑</kbd>{" "}
                <kbd className="rounded bg-card px-1 py-0.5 border border-surface-3">↓</kbd> để chọn
              </span>
              <span>
                <kbd className="rounded bg-card px-1 py-0.5 border border-surface-3">↵</kbd> xem vé
              </span>
              <span>
                <kbd className="rounded bg-card px-1 py-0.5 border border-surface-3">esc</kbd> đóng
              </span>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
