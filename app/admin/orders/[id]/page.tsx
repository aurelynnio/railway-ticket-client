"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Wallet,
  CheckCircle2,
  TicketCheck,
  XCircle,
  Clock3,
  RotateCcw,
  Hourglass,
  Printer,
  Mail,
  Phone,
  User,
  TrainFront,
  QrCode,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import QRCode from "qrcode";

import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatus } from "@/lib/api-types/order";
import {
  useCancelOrder,
  useConfirmOrder,
  useExpireOrder,
  useIssueTicket,
  useMarkOrderPaid,
  useMarkOrderPendingPayment,
  useOrder,
  useRefundOrder,
  useRemoveOrder,
} from "@/hooks/order.hook";
import {
  formatCurrency,
  formatDateTime,
  formatOrderStatus,
  getOrderStatusTone,
} from "@/lib/formatters";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;

  const query = useOrder(orderId);
  const order = query.data;

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const markPending = useMarkOrderPendingPayment();
  const markPaid = useMarkOrderPaid();
  const confirm = useConfirmOrder();
  const issue = useIssueTicket();
  const cancel = useCancelOrder();
  const expire = useExpireOrder();
  const refund = useRefundOrder();
  const remove = useRemoveOrder();

  // Generate QR code if QR payload exists
  useEffect(() => {
    if (order?.qrPayload || order?.ticketCode) {
      const payload = order.qrPayload || `VETAUTET-2026:${order.ticketCode || order.id}`;
      QRCode.toDataURL(payload, { width: 180, margin: 1 })
        .then((url) => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [order?.qrPayload, order?.ticketCode, order?.id]);

  if (query.isLoading) {
    return (
      <AdminLayout title="Chi tiết đơn">
        <Skeleton className="h-60 w-full" />
      </AdminLayout>
    );
  }

  const status = order?.status ?? 0;

  const showMarkPending = status === OrderStatus.Draft;
  const showMarkPaid = status === OrderStatus.PendingPayment;
  const showConfirm = status === OrderStatus.Paid;
  const showIssue = status === OrderStatus.Confirmed;
  const showExpire = status === OrderStatus.PendingPayment;
  const showFailed = [
    OrderStatus.Paid,
    OrderStatus.Confirmed,
    OrderStatus.TicketIssued,
  ].includes(status);
  const showCancel = ![
    OrderStatus.Cancelled,
    OrderStatus.Expired,
    OrderStatus.Refunded,
  ].includes(status);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminLayout
      title={`Chi tiết đơn hàng #${(orderId ?? "").slice(0, 8).toUpperCase()}`}
      description="Quản lý thông tin hành khách, trạng thái xử lý và xuất vé điện tử."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/orders">
              <ArrowLeft className="size-3.5 mr-1" />
              Danh sách đơn
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5"
          >
            <Printer className="size-3.5" />
            <span>In vé / Biên lai</span>
          </Button>
        </div>
      }
    >
      {/* Top Order Status & Price */}
      <Card variant="outlined" padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-ink">
                #{order?.id?.toUpperCase()}
              </span>
              <Badge variant={getOrderStatusTone(status)}>
                {formatOrderStatus(status)}
              </Badge>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              Khởi tạo lúc: {formatDateTime(order?.createdAt)} • Cập nhật lúc: {formatDateTime(order?.updatedAt)}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-ink-muted">Tổng số tiền thanh toán</p>
            <p className="font-mono text-2xl sm:text-3xl font-bold tabular-nums text-primary">
              {formatCurrency(order?.totalPrice ?? "0")}
            </p>
          </div>
        </div>
      </Card>

      {/* Grid: 2 columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column (2 cols): Train journey & Customer info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Journey Card */}
          <Card variant="outlined" padding="lg">
            <h3 className="font-display text-base font-bold text-ink flex items-center gap-2 border-b border-border pb-3">
              <TrainFront className="size-4 text-primary" />
              Thông tin chuyến tàu & Chỗ ngồi
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Row label="Số hiệu đoàn tàu" value={order?.trainNumber ? `Tàu ${order.trainNumber}` : "—"} />
              <Row label="Tên chuyến vé" value={order?.ticketTitle || "Vé Tàu Tết 2026"} />
              <Row label="Ga đi" value={`${order?.departureStationName ?? "—"} (${order?.departureStationCode ?? "—"})`} />
              <Row label="Ga đến" value={`${order?.arrivalStationName ?? "—"} (${order?.arrivalStationCode ?? "—"})`} />
              <Row label="Thời gian khởi hành" value={formatDateTime(order?.departureTime)} />
              <Row label="Thời gian đến dự kiến" value={formatDateTime(order?.arrivalTime)} />
              <Row label="Mã toa & Hạng ghế" value={`${order?.coachCode || "Toa"} • ${order?.seatClass || "Tiêu chuẩn"}`} />
              <Row
                label="Danh sách số chỗ đã chọn"
                value={order?.seatLabels?.join(", ") || `${order?.quantity ?? 1} chỗ`}
                highlight
              />
            </div>
          </Card>

          {/* Customer & Passenger List Card */}
          <Card variant="outlined" padding="lg">
            <h3 className="font-display text-base font-bold text-ink flex items-center gap-2 border-b border-border pb-3">
              <User className="size-4 text-accent" />
              Thông tin khách hàng & Hành khách
            </h3>

            {/* Contact details */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 bg-muted/30 p-3.5 rounded-xl border border-border">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Email liên hệ nhận vé</p>
                <p className="font-medium text-sm text-ink mt-0.5 flex items-center gap-1.5">
                  <Mail className="size-3.5 text-ink-muted" />
                  {order?.contactEmail || "Chưa cập nhật"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Số điện thoại liên hệ</p>
                <p className="font-medium text-sm text-ink mt-0.5 flex items-center gap-1.5 font-mono">
                  <Phone className="size-3.5 text-ink-muted" />
                  {order?.contactPhone || "Chưa cập nhật"}
                </p>
              </div>
            </div>

            {/* Passenger table */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-ink mb-2">
                Danh sách hành khách đi tàu ({order?.passengers?.length ?? 0} người):
              </p>
              {!order?.passengers?.length ? (
                <p className="text-xs text-ink-muted py-2">
                  Đơn hàng áp dụng thông tin của người đặt vé chính.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 text-ink-muted font-semibold border-b border-border">
                      <tr>
                        <th className="p-2.5">Họ và tên</th>
                        <th className="p-2.5">Đối tượng</th>
                        <th className="p-2.5">Số CCCD / Hộ chiếu</th>
                        <th className="p-2.5">Số điện thoại</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {order.passengers.map((p, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="p-2.5 font-semibold text-ink">{p.fullName}</td>
                          <td className="p-2.5 capitalize">{p.passengerType || "Người lớn"}</td>
                          <td className="p-2.5 font-mono text-ink-muted">{p.identityNumber || "—"}</td>
                          <td className="p-2.5 font-mono text-ink-muted">{p.phoneNumber || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right column (1 col): Ticket QR & Workflow Actions */}
        <div className="space-y-6">
          {/* E-Ticket Preview Card */}
          <Card variant="outlined" padding="lg" className="border-primary/30 bg-card text-center space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-semibold text-xs text-ink flex items-center gap-1.5">
                <QrCode className="size-4 text-primary" />
                Vé điện tử Tết 2026
              </span>
              <span className="font-mono text-xs font-bold text-accent">
                {order?.ticketCode || "VTT-ETICKET"}
              </span>
            </div>

            {/* QR code */}
            <div className="flex justify-center p-2">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code Vé Tàu"
                  className="size-36 rounded-lg border border-border shadow-xs"
                />
              ) : (
                <div className="flex size-36 items-center justify-center rounded-lg border border-border bg-muted/40 text-ink-muted text-xs">
                  Chưa có mã QR
                </div>
              )}
            </div>

            <div className="text-xs text-ink-muted space-y-1">
              <p className="font-semibold text-ink">Quét mã tại cổng soát vé</p>
              <p className="text-[11px]">Hành khách xuất trình mã QR cùng CCCD/Hộ chiếu khi lên tàu.</p>
            </div>
          </Card>

          {/* Workflow Status Actions */}
          <Card variant="outlined" padding="lg">
            <h3 className="font-display text-sm font-bold text-ink border-b border-border pb-3">
              Quy trình xử lý đơn hàng
            </h3>

            <div className="mt-4 flex flex-col gap-2">
              {showMarkPending && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markPending.mutate({ orderId })}
                  disabled={markPending.isPending}
                  className="w-full justify-start gap-2 text-xs"
                >
                  <Hourglass className="size-3.5 text-amber-600" />
                  Chuyển sang "Chờ thanh toán"
                </Button>
              )}

              {showMarkPaid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markPaid.mutate({ orderId })}
                  disabled={markPaid.isPending}
                  className="w-full justify-start gap-2 text-xs"
                >
                  <Wallet className="size-3.5 text-emerald-600" />
                  Xác nhận khách đã thanh toán
                </Button>
              )}

              {showConfirm && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => confirm.mutate({ orderId })}
                  disabled={confirm.isPending}
                  className="w-full justify-start gap-2 text-xs"
                >
                  <CheckCircle2 className="size-3.5" />
                  Xác nhận đơn hàng
                </Button>
              )}

              {showIssue && (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => issue.mutate({ orderId })}
                  disabled={issue.isPending}
                  className="w-full justify-start gap-2 text-xs"
                >
                  <TicketCheck className="size-3.5" />
                  Phát hành vé điện tử (QR)
                </Button>
              )}

              {showExpire && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => expire.mutate({ orderId })}
                  disabled={expire.isPending}
                  className="w-full justify-start gap-2 text-xs"
                >
                  <Clock3 className="size-3.5" />
                  Đánh dấu hết hạn giữ chỗ
                </Button>
              )}

              {showCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelForm((v) => !v)}
                  className="w-full justify-start gap-2 text-xs text-amber-600 hover:text-amber-700"
                >
                  <XCircle className="size-3.5" />
                  Hủy đơn đặt chỗ
                </Button>
              )}

              {showFailed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refund.mutate({ orderId })}
                  disabled={refund.isPending}
                  className="w-full justify-start gap-2 text-xs text-destructive hover:text-destructive"
                >
                  <RotateCcw className="size-3.5" />
                  Kích hoạt hoàn tiền đơn này
                </Button>
              )}

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="w-full justify-start gap-2 text-xs mt-2"
              >
                <Trash2 className="size-3.5" />
                Xóa đơn hàng khỏi hệ thống
              </Button>
            </div>

            {/* Cancel form inline */}
            {showCancelForm && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 space-y-2">
                <Label htmlFor="cancel" className="text-xs font-semibold text-destructive">
                  Lý do hủy đơn
                </Label>
                <Input
                  id="cancel"
                  placeholder="Khách yêu cầu đổi ngày, không thanh toán..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="text-xs"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowCancelForm(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs"
                    disabled={cancel.isPending}
                    onClick={() =>
                      cancel.mutate(
                        { orderId, payload: { reason: cancelReason } },
                        { onSuccess: () => setShowCancelForm(false) },
                      )
                    }
                  >
                    Xác nhận hủy đơn
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Xóa đơn hàng?"
        description={`Đơn #${orderId.slice(0, 8)} sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu.`}
        confirmLabel="Xóa đơn hàng"
        confirmPending={remove.isPending}
        onConfirm={() =>
          remove.mutate({ orderId }, { onSuccess: () => router.push("/admin/orders") })
        }
      />
    </AdminLayout>
  );
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <p className="text-[11px] uppercase tracking-wider text-ink-muted font-semibold">{label}</p>
      <p className={`mt-1 text-sm font-medium ${highlight ? "text-primary font-bold" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}