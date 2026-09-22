import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tài khoản của tôi",
  description: "Quản lý thông tin tài khoản, hồ sơ cá nhân và bảo mật",
};

export default function ProfileLayoutWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
