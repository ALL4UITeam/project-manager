import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Gothic_A1, DM_Mono } from "next/font/google";
import { AppProvider } from "@/context/app-context";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const gothicA1 = Gothic_A1({
  variable: "--font-sans-kr",
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "All4Land | 프로젝트 현황 & 주간 업무 보고",
  description: "프로젝트 현황 및 파트별 주간 업무 보고 시스템 UI 프로토타입",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${plusJakarta.variable} ${gothicA1.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
