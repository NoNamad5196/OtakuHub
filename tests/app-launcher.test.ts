import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppLauncher, getOtakuSServices, validUrl } from "@/components/app-launcher";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("validUrl", () => {
  it("accepts https URLs and normalizes via URL.href", () => {
    expect(validUrl("https://sipsungjang.example.com")).toBe("https://sipsungjang.example.com/");
    expect(validUrl("https://gachaguard.example.com/budget")).toBe(
      "https://gachaguard.example.com/budget",
    );
  });

  it("rejects non-https protocols and invalid or empty values", () => {
    expect(validUrl(undefined)).toBeNull();
    expect(validUrl("")).toBeNull();
    expect(validUrl("   ")).toBeNull();
    expect(validUrl("not-a-url")).toBeNull();
    expect(validUrl("http://sipsungjang.example.com")).toBeNull();
    expect(validUrl("javascript:alert(1)")).toBeNull();
    expect(validUrl("ftp://example.com/file")).toBeNull();
  });
});

describe("getOtakuSServices", () => {
  it("returns the 3 OtakuS services with OtakuHub as the current service", () => {
    const services = getOtakuSServices({});

    expect(services).toHaveLength(3);
    expect(services.map((service) => service.name)).toEqual([
      "SipSungJang",
      "OtakuHub",
      "GachaGuard",
    ]);

    expect(services[0]).toMatchObject({
      name: "SipSungJang",
      description: "육성 · 주간 목표 · 플레이 수첩",
      href: null,
      current: false,
    });
    expect(services[1]).toMatchObject({
      name: "OtakuHub",
      description: "게임 · 서브컬처 이벤트와 일정",
      href: "/dashboard",
      current: true,
    });
    expect(services[2]).toMatchObject({
      name: "GachaGuard",
      description: "소비 기록 · 예산 · 과금 돌아보기",
      href: null,
      current: false,
    });
  });

  it("reads and validates NEXT_PUBLIC sibling URLs from process.env", () => {
    vi.stubEnv("NEXT_PUBLIC_SIPSUNGJANG_URL", "https://sipsungjang.web.app");
    vi.stubEnv("NEXT_PUBLIC_GACHAGUARD_URL", "http://insecure.example.com");

    const services = getOtakuSServices();

    expect(services[0]?.href).toBe("https://sipsungjang.web.app/");
    expect(services[1]?.href).toBe("/dashboard");
    expect(services[2]?.href).toBeNull();
  });
});

describe("AppLauncher", () => {
  it("renders disabled placeholders when sibling URLs are missing", () => {
    const html = renderToStaticMarkup(
      createElement(AppLauncher, { services: getOtakuSServices({}) }),
    );

    expect(html).toContain('href="/dashboard"');
    expect(html).toContain("◆ 현재 서비스");
    expect(html).toContain("연결 준비 중");
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toContain("서비스 열기 ↗");
  });

  it("renders external target=_blank links when sibling HTTPS URLs are configured", () => {
    const services = getOtakuSServices({
      NEXT_PUBLIC_SIPSUNGJANG_URL: "https://sipsungjang.web.app",
      NEXT_PUBLIC_GACHAGUARD_URL: "https://gachaguard.web.app",
    });
    const html = renderToStaticMarkup(createElement(AppLauncher, { services }));

    expect(html).toContain('href="https://sipsungjang.web.app/"');
    expect(html).toContain('href="https://gachaguard.web.app/"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("서비스 열기 ↗");
    expect(html).not.toContain("연결 준비 중");
  });

  it("omits descriptions in compact mode while keeping names and statuses", () => {
    const services = getOtakuSServices({
      NEXT_PUBLIC_SIPSUNGJANG_URL: "https://sipsungjang.web.app",
    });
    const html = renderToStaticMarkup(createElement(AppLauncher, { compact: true, services }));

    expect(html).toContain("SipSungJang");
    expect(html).toContain("OtakuHub");
    expect(html).toContain("GachaGuard");
    expect(html).toContain("◆ 현재 서비스");
    expect(html).toContain("서비스 열기 ↗");
    expect(html).toContain("연결 준비 중");
    expect(html).not.toContain("육성 · 주간 목표 · 플레이 수첩");
  });
});
