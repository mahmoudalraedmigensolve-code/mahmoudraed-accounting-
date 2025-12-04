import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://accounting.migensolve.com"),
  title: {
    default: "نظام المحاسبة | MigenSolve - برنامج محاسبة سحابي متكامل",
    template: "%s | نظام المحاسبة MigenSolve",
  },
  description: "نظام محاسبة سحابي متكامل لإدارة المبيعات والمشتريات والعملاء والموردين والمخزون. برنامج محاسبة عربي سهل الاستخدام للشركات الصغيرة والمتوسطة في مصر والوطن العربي.",
  keywords: [
    "برنامج محاسبة",
    "نظام محاسبة",
    "برنامج حسابات",
    "إدارة المبيعات",
    "إدارة المشتريات",
    "إدارة العملاء",
    "إدارة الموردين",
    "إدارة المخزون",
    "فواتير إلكترونية",
    "برنامج محاسبة سحابي",
    "برنامج محاسبة مجاني",
    "برنامج محاسبة للشركات الصغيرة",
    "accounting software",
    "MigenSolve",
    "محاسبة مصر",
  ],
  authors: [{ name: "MigenSolve", url: "https://migensolve.com" }],
  creator: "MigenSolve",
  publisher: "MigenSolve",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "محاسبة MigenSolve",
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: "/",
    siteName: "نظام المحاسبة MigenSolve",
    title: "نظام المحاسبة | MigenSolve - برنامج محاسبة سحابي متكامل",
    description: "نظام محاسبة سحابي متكامل لإدارة المبيعات والمشتريات والعملاء والموردين والمخزون. برنامج محاسبة عربي سهل الاستخدام.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "نظام المحاسبة MigenSolve",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "نظام المحاسبة | MigenSolve - برنامج محاسبة سحابي متكامل",
    description: "نظام محاسبة سحابي متكامل لإدارة المبيعات والمشتريات والعملاء والموردين والمخزون.",
    images: ["/og-image.png"],
    creator: "@migensolve",
  },
  alternates: {
    canonical: "/",
    languages: {
      "ar-EG": "/",
      "ar": "/",
    },
  },
  category: "business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
