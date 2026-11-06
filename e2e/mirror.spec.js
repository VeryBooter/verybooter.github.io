import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

test("mirror settles at idle and refreshes for doors, exhibits and daylight", async ({
  page,
}) => {
  test.setTimeout(120000);
  page.setDefaultTimeout(15000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(() => window.galleryDiagnostics?.().webgl);
  if (await page.locator("#skip-entrance").isVisible())
    await page
      .locator("#skip-entrance")
      .click({ timeout: 1000 })
      .catch(() => {});
  await expect(page.locator("#entrance")).toBeHidden();
  await page.locator("#enter-room").click();
  const settled = () =>
    page.waitForFunction(() => {
      const d = galleryDiagnostics();
      return (
        d.location === "interior" &&
        d.mirror.baked &&
        !d.mirror.dirty &&
        d.mirror.pendingFace === 0
      );
    });
  await settled();
  const before = await page.evaluate(
    () => galleryDiagnostics().mirror.facesRendered,
  );
  // Use real animation frames: fake clocks cannot establish rendering performance.
  const profile = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const samples = [];
        let last = performance.now();
        const start = last;
        function sample(now) {
          samples.push(now - last);
          last = now;
          if (now - start < 6000) requestAnimationFrame(sample);
          else {
            const gl = document.querySelector("canvas").getContext("webgl2");
            const ext = gl.getExtension("WEBGL_debug_renderer_info");
            resolve({
              samples: samples.slice(1),
              mirror: galleryDiagnostics().mirror,
              gpu: ext
                ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
                : "unavailable",
            });
          }
        }
        requestAnimationFrame(sample);
      }),
  );
  expect(profile.mirror.facesRendered).toBe(before);
  const ordered = [...profile.samples].sort((a, b) => a - b);
  profile.summary = {
    frames: ordered.length,
    median: ordered[Math.floor(ordered.length * 0.5)],
    p95: ordered[Math.floor(ordered.length * 0.95)],
    max: ordered.at(-1),
    over18: ordered.filter((x) => x > 18).length,
  };
  await mkdir("artifacts/browser", { recursive: true });
  await writeFile(
    "artifacts/browser/mirror-profile.json",
    JSON.stringify(profile, null, 2),
  );
  console.log("Mirror idle performance", profile.summary, profile.gpu);
  await page.locator("#doors").click();
  await expect
    .poll(() => page.evaluate(() => galleryDiagnostics().mirror.facesRendered))
    .toBeGreaterThan(before);
  await settled();
  await page.screenshot({ path: "artifacts/browser/mirror-open.png" });
  let count = await page.evaluate(() => galleryDiagnostics().mirror.captures);
  await page.locator("#leave-room").click();
  await expect
    .poll(() => page.evaluate(() => galleryDiagnostics().location))
    .toBe("courtyard");
  await page.locator(".settings-toggle").click();
  await page.locator('[data-theme="dark"]').click();
  await page.locator("#close-atmosphere").click();
  await page.locator("#enter-room").click();
  await expect
    .poll(() => page.evaluate(() => galleryDiagnostics().mirror.captures))
    .toBeGreaterThan(count);
  await settled();
  count = await page.evaluate(() => galleryDiagnostics().mirror.captures);
  await page.locator('[data-project="drawing"]').click();
  await expect
    .poll(() => page.evaluate(() => galleryDiagnostics().mirror.captures))
    .toBeGreaterThan(count);
  await expect(page.locator("#close-inspection")).toBeVisible();
  await settled();
  await page.locator("#close-inspection").click();
  await settled();
  expect(errors).toEqual([]);
});
