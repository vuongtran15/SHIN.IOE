import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function pngSize(file: string): { width: number; height: number } {
  const buf = readFileSync(file);
  expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(buf.subarray(12, 16).toString("ascii")).toBe("IHDR");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe("cài lên màn hình chính", () => {
  const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8")) as {
    name: string;
    short_name: string;
    start_url: string;
    scope: string;
    display: string;
    display_override: string[];
    background_color: string;
    theme_color: string;
    icons: Array<{ src: string; sizes: string; type: string; purpose: string }>;
  };
  const html = readFileSync("index.html", "utf8");

  it("manifest mở toàn màn hình, có tên và biểu tượng 192/512 kể cả maskable", () => {
    expect(manifest.name).toBe("Học từ vựng lớp 1");
    expect(manifest.short_name).toBe("SHIN IOE");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.display_override).toEqual(["fullscreen", "standalone"]);
    expect(manifest.theme_color).toBe("#1E6FE8");
    expect(manifest.background_color).toBe("#E8F6FF");

    const anyIcons = manifest.icons.filter((icon) => icon.purpose === "any");
    const maskable = manifest.icons.filter((icon) => icon.purpose === "maskable");
    expect(anyIcons.map((icon) => icon.sizes).sort()).toEqual(["192x192", "512x512"]);
    expect(maskable.map((icon) => icon.sizes).sort()).toEqual(["192x192", "512x512"]);
    for (const icon of manifest.icons) {
      expect(icon.type).toBe("image/png");
      expect(icon.src.startsWith("/icons/")).toBe(true);
      const size = Number(icon.sizes.split("x")[0]);
      expect(pngSize(`public${icon.src}`)).toEqual({ width: size, height: size });
    }
  });

  it("Safari có thẻ apple và biểu tượng 180, nội dung né tai thỏ", () => {
    expect(html).toContain('name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"');
    expect(html).toContain('name="apple-mobile-web-app-capable" content="yes"');
    expect(html).toContain('name="mobile-web-app-capable" content="yes"');
    expect(html).toContain('name="apple-mobile-web-app-status-bar-style" content="black-translucent"');
    expect(html).toContain('name="apple-mobile-web-app-title" content="SHIN IOE"');
    expect(html).toContain('rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180"');
    expect(html).toContain('rel="manifest" href="/manifest.webmanifest"');
    expect(pngSize("public/icons/apple-touch-icon.png")).toEqual({ width: 180, height: 180 });

    const css = readFileSync("src/styles.css", "utf8");
    expect(css).toContain("env(safe-area-inset-top)");
    expect(css).toContain("env(safe-area-inset-right)");
    expect(css).toContain("env(safe-area-inset-bottom)");
    expect(css).toContain("env(safe-area-inset-left)");

    const sw = readFileSync("public/sw.js", "utf8");
    expect(sw).toContain('addEventListener("fetch"');
    const vercel = JSON.parse(readFileSync("vercel.json", "utf8")) as {
      headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    };
    const manifestHeaders = vercel.headers.find((item) => item.source === "/manifest.webmanifest");
    expect(manifestHeaders?.headers).toContainEqual({
      key: "Content-Type",
      value: "application/manifest+json; charset=utf-8",
    });
  });
});
