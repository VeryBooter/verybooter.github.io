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
    expect(diagnostics.objects).toBe(13);
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
  await ready(page);
  for (const project of projects) {
    const button = page.locator(`[data-project="${project.id}"]`);
    await button.click();
    await expect(page.locator("#project-dialog")).toBeVisible();
    await expect(page.locator("#detail-title")).toHaveText(project.title);
    await expect(page).toHaveURL(new RegExp(`#project/${project.id}$`));
    await page.keyboard.press("Escape");
    await expect(page.locator("#project-dialog")).not.toBeVisible();
    await expect(button).toBeFocused();
  }
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
