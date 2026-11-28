import type { Metadata, Viewport } from "next";
import { AppProvider } from "@/src/components/AppProvider";
import { AppShell } from "@/src/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyShelf",
  description: "Mandado, inventario y gastos compartidos por grupo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-stone-100">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
