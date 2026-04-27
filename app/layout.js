import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import InstallPrompt from "@/components/InstallPrompt";

export const metadata = {
  title: "MoneyLeft — Simple Budgeting",
  description: "Answer one question every day: how much money can I safely spend?",
  applicationName: "MoneyLeft",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "MoneyLeft",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png",   sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png",   sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1a6b4a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* iOS splash screen */}
        <link
          rel="apple-touch-startup-image"
          href="/icons/splash.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)"
        />
        {/* Older iOS Safari needs these explicit meta tags for full PWA behavior */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MoneyLeft" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        <ServiceWorkerRegister />
        <InstallPrompt />
      </body>
    </html>
  );
}