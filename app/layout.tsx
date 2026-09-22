import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

/**
 * Typography strategy — Vé Tàu Tết Design System
 *
 * Two-tier font system with Poppins:
 *   - Sans / Display: Poppins (300/400/500/600/700/800)
 *     Editorial headlines, page titles, card titles, UI body, labels,
 *     navigation, form controls, data tables. Geometric, modern, warm,
 *     highly legible with distinctive rounded terminals.
 *   - Mono: JetBrains Mono (400/500/600)
 *     Ticket numbers, seat labels, order IDs, prices, timestamps, code.
 *     Distinctive character, tabular alignment for scan-reading.
 *
 * Both include vietnamese subset for full Vietnamese language support.
 */
const poppinsFont = Poppins({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const poppinsDisplayFont = Poppins({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vé Tàu Tết 2026 — Đặt vé trực tuyến",
    template: "%s | Vé Tàu Tết 2026",
  },
  description:
    "Hệ thống đặt vé tàu Tết Ất Tỵ 2026 trực tuyến chính thức. Giữ chỗ siêu tốc, chọn ghế ưng ý, thanh toán an toàn qua VNPay, xuất vé điện tử tức thì.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${poppinsFont.variable} ${poppinsDisplayFont.variable} ${monoFont.variable} h-full`}
    >
      <body className="min-h-full font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Bỏ qua đến nội dung chính
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
