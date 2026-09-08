import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { AppStateProvider } from "@/context/app-state-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Routine Dashboard",
  description: "A calm routine dashboard for sustainable weekday progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppStateProvider>
          <AppShell>{children}</AppShell>
        </AppStateProvider>
      </body>
    </html>
  );
}
