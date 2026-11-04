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
  if (await skip.isVisible())
    await skip.click({ timeout: 1000 }).catch(() => {});
  await expect(page.locator("#entrance")).not.toBeVisible({ timeout: 10000 });
  await page.evaluate(() => document.fonts.ready);
}

async function enterRoom(page) {
  await page.locator("#enter-room").click();
  await expect
    .poll(() => page.evaluate(() => galleryDiagnostics().location), {
      timeout: 15000,
    })
    .toBe("interior");
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
    test.setTimeout(120000);
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
    await enterRoom(page);
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
    await page.locator("#leave-room").click();
    await expect
      .poll(() => page.evaluate(() => galleryDiagnostics().location), {
        timeout: 15000,
      })
      .toBe("courtyard");
    await page.locator(".settings-toggle").click();
    await page.locator('button[data-theme="dark"]').click();
    await page.locator("#close-atmosphere").click();
    await page.locator('[data-weather="storm"]').click();
    await capture(page, `${name}-night`);
    expect(errors).toEqual([]);
  });
}

test("all exhibits open, close, and restore keyboard focus in a real browser", async ({
  page,
}) => {
  // This test includes twelve real-time animations plus inspection screenshots.
  test.setTimeout(300000);
  await ready(page);
  await enterRoom(page);
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
      await expect(page.locator("#exhibit-actions")).toBeVisible({
        timeout: 12000,
      });
      await expect(page.locator("#project-dialog")).not.toBeVisible();
      await capture(page, "face-drawing-inspection");
      await page.locator("#end-exhibit").click();
      continue;
    }
    if (project.id === "house") {
      await expect(page.locator("#exhibit-actions")).toBeVisible({
        timeout: 12000,
      });
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
      await expect(page.locator("#exhibit-actions")).toBeVisible({
        timeout: 12000,
      });
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
    ["kl", 1100],
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

test("roof controls, vector artwork, two white flashes, nozzle exhaust, and red close buttons", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.clock.install();
  await ready(page);
  await expect
    .poll(() => page.evaluate(() => galleryDiagnostics().vectorDrawing))
    .toBe(true);
  expect(
    await page.evaluate(() => galleryDiagnostics().roofNavigation.attached),
  ).toBe(true);
  await expect(page.locator(".site-header")).toHaveCount(0);
  await enterRoom(page);
  const inside = await page.evaluate(() => galleryDiagnostics());
  expect(inside.cameraPosition[2]).toBeLessThan(-5);
  expect(inside.shelfPosition[2]).toBeLessThan(inside.cameraPosition[2]);
  await page.clock.pauseAt(new Date(Date.now() + 120000));
  await page.locator('[data-project="voxelcraft"]').click();
  await page.clock.runFor(480);
  await expect(page.locator("#transition-effect")).toHaveAttribute(
    "data-effect",
    "tnt-white",
  );
  await expect(page.locator("#transition-effect")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(page.locator("#transition-effect")).toHaveCSS("opacity", "1");
  expect(await page.evaluate(() => galleryDiagnostics().location)).toBe(
    "interior",
  );
  await capture(page, "tnt-first-white");
  await page.clock.runFor(120);
  await expect(page.locator("#transition-effect")).not.toHaveAttribute(
    "data-effect",
    "tnt-white",
  );
  await page.clock.runFor(150);
  await expect(page.locator("#transition-effect")).toHaveAttribute(
    "data-effect",
    "tnt-white",
  );
  await capture(page, "tnt-second-white");
  await page.clock.runFor(300);
  await expect(page.locator("#transition-effect")).toHaveAttribute(
    "data-effect",
    "tnt-black",
  );
  await capture(page, "tnt-black-debris");
  await page.clock.runFor(450);
  await page.locator("#close-detail").click();
  await page.locator('[data-project="rocket"]').click();
  await page.clock.runFor(1125);
  const exhaust = await page.evaluate(() => galleryDiagnostics());
  expect(exhaust.nozzleWorld).toEqual(exhaust.smokeOrigin);
  await capture(page, "rocket-nozzle-exhaust");
  await page.clock.runFor(375);
  await expect(page.locator("#close-detail")).toHaveCSS(
    "background-color",
    "rgb(255, 95, 87)",
  );
  for (const id of [
    "close-detail",
    "close-atmosphere",
    "close-inspection",
    "cancel-transition",
  ]) {
    await expect(page.locator(`#${id}`)).toHaveCSS(
      "background-color",
      "rgb(255, 95, 87)",
    );
  }
  await capture(page, "red-close-detail");
});

test("entrance plays again on reload and roof weather uses direct SVG icons", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.clock.install();
  await ready(page);
  await page.clock.pauseAt(new Date(Date.now() + 120000));
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.clock.runFor(1000);
  await page.waitForFunction(
    () => typeof window.galleryDiagnostics === "function",
  );
  await expect(page.locator("#entrance")).toBeVisible();
  await page.locator("#skip-entrance").click();
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator(".roof-weather svg")).toHaveCount(3);
  await expect(page.locator("#weather")).toHaveCount(0);
  await page.locator('[data-weather="cloudy"]').click();
  await expect(page.locator('[data-weather="cloudy"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(
    await page.evaluate(() => galleryDiagnostics().preferences.weather),
  ).toBe("cloudy");
  await capture(page, "roof-weather-icons");
  await page.locator("#replay-roof").click();
  await expect(page.locator("#entrance")).toBeVisible();
  await page.locator("#skip-entrance").click();
});

test("MIPS home visibly scans, assembles, installs the shelf chip, and places roof last", async ({
  page,
}) => {
  test.setTimeout(240000);
  await page.clock.install();
  await ready(page);
  await enterRoom(page);
  await page.clock.pauseAt(new Date(Date.now() + 120000));
  await page.locator('[data-project="house"]').click();
  let elapsed = 0;
  for (const [time, stage, name] of [
    [1400, "grabbing-blueprint", "mips-grab"],
    [2400, "laser-scanning", "mips-laser"],
    [4000, "assembling-walls", "mips-walls"],
    [6000, "chip-emerging", "mips-chip-shelf"],
    [7200, "installing-chip", "mips-chip-install"],
    [8400, "placing-roof", "mips-roof"],
  ]) {
    await page.clock.runFor(time - elapsed);
    elapsed = time;
    expect(await page.evaluate(() => galleryDiagnostics().houseStage)).toBe(
      stage,
    );
    const parts = await page.evaluate(() => galleryDiagnostics().houseParts);
    if (time === 2400)
      expect(parts.laser && parts.blueprint && !parts.house).toBe(true);
    if (time >= 4000) expect(parts.blueprint).toBe(false);
    if (time < 8400) expect(parts.roof).toBe(false);
    await capture(page, name);
  }
  await page.clock.runFor(600);
  await expect(page.locator("#exhibit-actions")).toBeVisible();
  expect(await page.evaluate(() => galleryDiagnostics().houseStage)).toBe(
    "complete",
  );
  await capture(page, "mips-complete");
  await page.locator("#end-exhibit").click();
  await page.locator('[data-project="cooking"]').click();
  await page.clock.runFor(1100);
  await capture(page, "steaming-mug");
  await page.locator("#cancel-transition").click();
  await expect(page.locator("#transition")).not.toBeVisible();
});
