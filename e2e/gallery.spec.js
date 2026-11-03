import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { projects } from "../docs/assets/js/catalogue.js";

const screenshotDirectory = "artifacts/browser/screenshots";

async function ready(page, hash = "") {
  await page.goto(`/${hash}`);
  await page.waitForFunction(
    () => typeof window.galleryDiagnostics === "function",
  );
  const skip = page.locator("#skip-entrance");
  if (await skip.isVisible()) await skip.click();
  await page.evaluate(() => document.fonts.ready);
}

async function capture(page, name) {
  await mkdir(screenshotDirectory, { recursive: true });
  await page.evaluate(() => document.activeElement?.blur());
  await page.screenshot({ path: `${screenshotDirectory}/${name}.png` });
}

for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["tablet", 820, 1180],
  ["phone", 390, 844],
]) {
  test(`${name}: real WebGL, gallery controls, and layout`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400)
        errors.push(`${response.status()}: ${response.url()}`);
    });
    await ready(page);
    await capture(page, `${name}-introduction`);
    const diagnostics = await page.evaluate(() => window.galleryDiagnostics());
    expect(diagnostics.webgl, JSON.stringify(diagnostics)).toBe(true);
    expect(diagnostics.objects).toBe(projects.length);
    expect(diagnostics.architecture).toEqual({
      columns: 2,
      pediment: true,
      ornateFrame: true,
    });
    await expect(page.locator('[data-project="embedded"]')).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page
      .locator("#gallery")
      .evaluate((element) => element.scrollIntoView({ behavior: "instant" }));
    await capture(page, `${name}-cabinet-closed`);
    await page.locator("#doors").click();
    await expect(page.locator("#doors")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.waitForTimeout(500);
    await capture(page, `${name}-cabinet-open`);
    await page.locator('[data-project="sailbot"]').click();
    await expect(page.locator("#project-dialog")).toBeVisible();
    await capture(page, `${name}-project`);
    await page.locator("#close-detail").click();
    await expect(page.locator("#project-dialog")).not.toBeVisible();
    await page.locator(".settings-toggle").click();
    await page.locator('button[data-theme="dark"]').click();
    await page.locator("#weather").selectOption("storm");
    await page.locator(".settings-toggle").click();
    await capture(page, `${name}-night`);
    expect(errors).toEqual([]);
  });
}

test("all exhibits open, close, and restore keyboard focus in a real browser", async ({
  page,
}) => {
  // This test includes twelve real-time animations plus inspection screenshots.
  test.setTimeout(120000);
  await ready(page);
  for (const project of projects) {
    const button = page.locator(`[data-project="${project.id}"]`);
    await button.click();
    await page.waitForTimeout(500);
    await capture(page, `${project.id}-transition`);
    if (project.presentation === "effect") {
      await expect
        .poll(() => page.evaluate(() => galleryDiagnostics().state))
        .toBe("gallery");
      await expect(page.locator("#project-dialog")).not.toBeVisible();
      continue;
    }
    if (project.presentation === "display") {
      await expect(page.locator("#exhibit-actions")).toBeVisible();
      await expect(page.locator("#project-dialog")).not.toBeVisible();
      await capture(page, "face-drawing-inspection");
      await page.locator("#end-exhibit").click();
      continue;
    }
    if (project.id === "house") {
      await expect(page.locator("#exhibit-actions")).toBeVisible();
      await page.locator("#inspect-chip").click();
      await expect(page.locator("#inspect-chip")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await page.waitForTimeout(650);
      await capture(page, "smart-house-chip");
      await page.locator("#read-story").click();
    }
    if (project.id === "games") {
      await expect(page.locator("#exhibit-actions")).toBeVisible();
      await capture(page, "controller-inspection");
      await page.locator("#game-buttons button").first().click();
    }
    await expect(page.locator("#project-dialog")).toBeVisible();
    await expect(page.locator("#detail-title")).toHaveText(project.title);
    await expect(page).toHaveURL(new RegExp(`#project/${project.id}$`));
    await page.keyboard.press("Escape");
    await expect(page.locator("#project-dialog")).not.toBeVisible();
    await expect(button).toBeFocused();
  }
});

test("replayed entrance follows the hello, theta, and parting-cloud sequence", async ({
  page,
}) => {
  const clockStart = Date.now() - 60000;
  await page.clock.install({ time: clockStart });
  await ready(page);
  await page.clock.pauseAt(clockStart + 120000);
  // Sample each authored CSS-animation stage without depending on screenshot/GPU timing.
  for (const [name, time] of [
    ["hello", 450],
    ["theta", 2200],
    ["clouds", 2950],
  ]) {
    await page.locator(".settings-toggle").click();
    await page.locator("#replay").click();
    await expect(page.locator("#entrance")).toBeVisible();
    await page.locator("#entrance").evaluate((element, time) => {
      for (const animation of element.getAnimations({ subtree: true })) {
        animation.pause();
        animation.currentTime = time;
      }
    }, time);
    await capture(page, `entrance-${name}`);
    await page.locator("#skip-entrance").click();
  }
  await page.locator(".settings-toggle").click();
  await page.locator("#replay").click();
  await page.clock.fastForward(3200);
  await expect(page.locator("#entrance")).toHaveClass("leaving");
  await page.clock.fastForward(500);
  await expect(page.locator("#entrance")).not.toBeVisible();
});

test("project links bypass the entrance and browser Back closes a selected project", async ({
  page,
}) => {
  await ready(page, "#project/rocket");
  await expect(page.locator("#entrance")).not.toBeVisible();
  await expect(page.locator("#detail-title")).toHaveText("SOAR / Rocket");
  await page.locator("#back-gallery").click();
  await expect(page).toHaveURL(/#gallery$/);
  await page.locator('[data-project="drone"]').click();
  await expect(page.locator("#project-dialog")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#project-dialog")).not.toBeVisible();
});
