import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test.use({ actionTimeout: 10000 });

test("logo, articulated attendants, archer, quiet exhibits and optical projector", async ({
  page,
}) => {
  test.setTimeout(240000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install();
  await page.goto("/");
  await page.waitForFunction(() => window.galleryDiagnostics?.().webgl);
  if (await page.locator("#skip-entrance").isVisible())
    await page
      .locator("#skip-entrance")
      .click({ timeout: 1000 })
      .catch(() => {});
  await expect(page.locator("#entrance")).toBeHidden();
  await mkdir("artifacts/browser/screenshots", { recursive: true });
  const capture = async (name) =>
    page.screenshot({
      path: `artifacts/browser/screenshots/refined-${name}.png`,
    });
  await capture("portrait");
  expect(await page.locator(".logo-top").getAttribute("d")).toContain(
    "V3M11 29",
  );
  await page.locator("#enter-room").click();
  await expect
    .poll(() => page.evaluate(() => galleryDiagnostics().location))
    .toBe("interior");
  await page.locator("#doors").click();
  await page.clock.runFor(600);
  await capture("room");
  expect(await page.evaluate(() => galleryDiagnostics().projector)).toEqual({
    visible: true,
    lightSegments: 3,
  });
  await page.locator("#slide-next").click();
  await expect(page.locator("#slide-count")).toHaveText("2 / 2");
  await page.locator("#slide-play").click();
  await page.clock.fastForward(5100);
  await expect(page.locator("#slide-count")).toHaveText("1 / 2");
  await page.locator("#slide-play").click();
  await expect(page.locator("#projected-slide")).toHaveAttribute(
    "alt",
    /Air Battle/,
  );
  await capture("projector-pdf");
  await page.clock.pauseAt(
    new Date(await page.evaluate(() => Date.now() + 1000)),
  );
  for (const kind of ["roman", "butler", "fox"]) {
    await page.locator(`[data-attendant="${kind}"]`).click();
    await page.locator('[data-project="sailbot"]').click();
    await page.clock.fastForward(900);
    const walk = await page.evaluate(() => galleryDiagnostics().attendant);
    expect(walk.stage).toBe("walking-to-cabinet");
    await capture(`${kind}-walking`);
    await page.clock.fastForward(1900);
    expect(
      await page.evaluate(() => galleryDiagnostics().attendant.stage),
    ).toBe("reaching");
    await capture(`${kind}-retrieval`);
    await page.clock.fastForward(3700);
    const handoff = await page.evaluate(() => galleryDiagnostics().attendant);
    expect(handoff.stage).toBe("presenting");
    expect(handoff.giftVisible).toBe(true);
    expect(handoff.elbows[1]).toBeLessThan(-1);
    expect(handoff.position).not.toEqual(walk.position);
    await capture(`${kind}-presenting`);
    await page.locator("#skip-transition").click();
    await page.locator("#close-detail").click();
  }
  await page.locator('[data-project="hackathon"]').click();
  await page.clock.fastForward(1400);
  expect(
    await page.evaluate(() => galleryDiagnostics().archer.draw),
  ).toBeLessThan(-0.5);
  await capture("archer-draw");
  await page.clock.fastForward(1000);
  expect(
    (await page.evaluate(() => galleryDiagnostics().archer.arrow))[0],
  ).toBeGreaterThan(2);
  await capture("archer-release");
  await page.locator("#skip-transition").click();
  await page.locator("#close-detail").click();
  await page.locator('[data-project="cooking"]').click();
  await expect(page.locator("#transition")).toBeHidden();
  await expect(page.locator("#project-dialog")).toBeHidden();
  await page.clock.fastForward(2700);
  await page.locator('[data-project="drawing"]').click();
  await page.clock.fastForward(1600);
  await expect(page.locator("#end-exhibit")).toBeHidden();
  await expect(page.locator("#close-inspection")).toBeVisible();
  await capture("painting");
  await page.locator("#close-inspection").click();
  for (const [name, width, height] of [
    ["tablet", 820, 1180],
    ["phone", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.clock.runFor(150);
    expect(await page.evaluate(() => galleryDiagnostics().location)).toBe(
      "interior",
    );
    const screen = await page.locator("#future-board").boundingBox();
    expect(screen.x).toBeGreaterThanOrEqual(0);
    expect(screen.x + screen.width).toBeLessThanOrEqual(width);
    await page.locator("#slide-next").click();
    await capture(`${name}-room`);
  }
  expect(errors).toEqual([]);
});
