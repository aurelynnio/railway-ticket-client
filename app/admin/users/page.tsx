"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  ArrowRight,
  Plus,
  Trash2,
  Search,
  Users,
  Shield,
  UserCheck,
  Download,
  Mail,
  Calendar,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { CreateUserPayload } from "@/lib/api-types";
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
import { useCreateUser, useDeleteUser, useListUsers } from "@/hooks/user.hook";
import { formatDateTime } from "@/lib/formatters";
import { emailField, passwordField, requiredText } from "@/lib/validation";
import { cn } from "@/lib/utils";

const createSchema = z.object({
  username: requiredText("Username"),
  email: emailField,
  password: passwordField,
  role: z.number(),
});

type CreateFormValues = z.infer<typeof createSchema>;

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    email?: string | null;
  } | null>(null);

  const query = useListUsers(page, 50);
  const rawUsers = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  const create = useCreateUser();
  const remove = useDeleteUser();

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { username: "", email: "", password: "", role: 0 },
  });

  // Filter users
  const filteredUsers = useMemo(() => {
    let list = rawUsers;

    if (roleFilter !== "all") {
      const targetRole = Number(roleFilter);
      list = list.filter((u) => (Number(u.role) || 0) === targetRole);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.username?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.name?.toLowerCase().includes(q) ||
          u.id?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [rawUsers, roleFilter, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredUsers.length) return;
    const headers = ["User ID", "Username", "Email", "Họ tên", "Vai trò", "Ngày tạo"];
    const rows = filteredUsers.map((u) => [
      `"${u.id}"`,
      `"${u.username ?? ""}"`,
      `"${u.email ?? ""}"`,
      `"${u.name ?? ""}"`,
      `"${Number(u.role) === 1 ? "Quản trị viên" : "Khách hàng"}"`,
      `"${u.createdAt ? new Date(u.createdAt).toLocaleString("vi-VN") : ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `danh-sach-nguoi-dung-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout
      title="Quản lý người dùng & Phân quyền"
      description="Quản lý danh sách tài khoản khách hàng, quản trị viên và quyền truy cập."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!filteredUsers.length}
            className="gap-1.5"
          >
            <Download className="size-3.5" />
            <span>Xuất CSV</span>
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={() => setShowCreate((v) => !v)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            {showCreate ? "Đóng form" : "Thêm người dùng"}
          </Button>
        </div>
      }
    >
      {/* Create User Form */}
      {showCreate && (
        <Card variant="outlined" padding="lg" className="border-primary/40 bg-card shadow-sm animate-in fade-in">
          <div className="border-b border-border pb-3">
            <h3 className="font-display text-base font-bold text-ink">
              Tạo tài khoản người dùng mới
            </h3>
            <p className="text-xs text-ink-muted">
              Cấp tài khoản cho nhân viên quản trị hoặc tạo tài khoản khách hàng trực tiếp.
            </p>
          </div>
          <form
            className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            onSubmit={createForm.handleSubmit((values) =>
              create.mutate(values as unknown as CreateUserPayload, {
                onSuccess: () => {
                  createForm.reset({ username: "", email: "", password: "", role: 0 });
                  setShowCreate(false);
                },
              }),
            )}
          >
            <div className="space-y-1.5">
              <Label htmlFor="u">Tên đăng nhập (Username)</Label>
              <Input id="u" placeholder="VD: nguyenvanan" {...createForm.register("username")} />
              {createForm.formState.errors.username?.message && (
                <p className="text-xs font-medium text-destructive">
                  {createForm.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="e">Email</Label>
              <Input id="e" type="email" placeholder="email@example.com" {...createForm.register("email")} />
              {createForm.formState.errors.email?.message && (
                <p className="text-xs font-medium text-destructive">
                  {createForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p">Mật khẩu ban đầu</Label>
              <Input id="p" type="password" placeholder="Tối thiểu 6 ký tự" {...createForm.register("password")} />
              {createForm.formState.errors.password?.message && (
                <p className="text-xs font-medium text-destructive">
                  {createForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="r">Vai trò tài khoản</Label>
              <Select
                id="r"
                value={String(createForm.watch("role"))}
                onChange={(e) => createForm.setValue("role", Number(e.target.value))}
              >
                <option value="0">Khách hàng (User)</option>
                <option value="1">Quản trị viên (Admin)</option>
              </Select>
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 border-t border-border pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="default" size="sm" disabled={create.isPending}>
                {create.isPending ? "Đang tạo..." : "Xác nhận tạo tài khoản"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter and Search */}
      <Card variant="outlined" padding="lg">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-center">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <Input
              placeholder="Tìm theo username, email, họ tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div>
            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="1">Quản trị viên (Admin)</option>
              <option value="0">Khách hàng (Customer)</option>
            </Select>
          </div>

          <div className="text-right text-xs text-ink-muted">
            Tổng cộng: <span className="font-semibold text-ink">{filteredUsers.length}</span> người dùng
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card variant="outlined" padding="none">
        {query.isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-muted">
            Không tìm thấy người dùng nào phù hợp.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Ngày đăng ký</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => {
                const isAdmin = Number(u.role) === 1;

                return (
                  <TableRow key={u.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-full font-bold text-xs uppercase",
                            isAdmin
                              ? "bg-accent/15 text-accent border border-accent/30"
                              : "bg-primary/10 text-primary",
                          )}
                        >
                          {u.username?.charAt(0) || u.email?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-ink">
                            {u.username || "Chưa đặt"}
                          </p>
                          {u.name && (
                            <p className="text-[11px] text-ink-muted">{u.name}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-ink">
                      {u.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <Badge variant="accent" className="font-semibold text-[11px] gap-1">
                          <Shield className="size-3" />
                          Quản trị viên
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[11px]">
                          Khách hàng
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-ink-muted">
                      {u.createdAt ? formatDateTime(u.createdAt) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button asChild variant="ghost" size="sm" className="text-xs">
                          <Link href={`/admin/users/${u.id}`}>
                            Chi tiết
                            <ArrowRight className="size-3.5 ml-1" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget({ id: u.id, email: u.email })}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
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

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa người dùng?"
        description={`Bạn có chắc chắn muốn xóa tài khoản "${deleteTarget?.email ?? deleteTarget?.id}" không? Người dùng sẽ không thể đăng nhập nữa.`}
        confirmLabel="Xóa tài khoản"
        confirmPending={remove.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            remove.mutate({ userId: deleteTarget.id }, {
              onSuccess: () => setDeleteTarget(null),
            });
          }
        }}
      />
    </AdminLayout>
  );
}