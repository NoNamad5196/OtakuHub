import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/components/auth/auth-provider";
import { getDashboardData } from "@/lib/data";

export const metadata: Metadata = {
  title: "OtakuHub | Astral Express",
  description: "서브컬처 일정 수집, AI 검수, 캘린더, 굿즈 관리를 한곳에서 다루는 Astral Express 포털",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const data = await getDashboardData();
  const pendingSuggestionCount = data.suggestions.filter((suggestion) => suggestion.status === "pending").length;

  return (
    <html lang="ko" suppressHydrationWarning data-theme="dark">
      <body className="font-sans antialiased">
        <Script id="otakuhub-theme" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var saved = localStorage.getItem("otakuhub-theme") || "dark";
                var theme = saved;
                if (saved === "system") {
                  theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                }
                if (theme === "dark") document.documentElement.dataset.theme = "dark";
                else document.documentElement.dataset.theme = "light";
              } catch (error) {
                document.documentElement.dataset.theme = "dark";
              }
            })();
          `}
        </Script>
        <AuthProvider>
          <AppShell franchises={data.franchises} pendingSuggestionCount={pendingSuggestionCount}>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
