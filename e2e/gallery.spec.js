import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { projects } from "../docs/assets/js/catalogue.js";

test.use({ actionTimeout: 10000 });

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
    expect(diagnostics.sunlight.sky && diagnostics.sunlight.shadows).toBe(true);
    expect(diagnostics.sunlight.intensity).toBeGreaterThan(3);
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
    const wall = await page.evaluate(() => galleryDiagnostics().wallIndex);
    expect(wall.attached && wall.visible).toBe(true);
    expect(wall.position[2]).toBeLessThan(-32);
    await expect(page.locator("#project-index .project-number")).toHaveCount(
      12,
    );
    await capture(page, `${name}-cabinet-closed`);
    await page.locator("#doors").click();
    await expect(page.locator("#doors")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.waitForTimeout(500);
    await capture(page, `${name}-cabinet-open`);
    await page.locator('[data-project="sailbot"]').click();
    await expect(page.locator("#project-dialog")).toBeVisible({
      timeout: 10000,
    });
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
      await page.locator("#close-inspection").click();
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
    await expect(page.locator("#project-dialog")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("#detail-title")).toHaveText(project.title);
    await expect(page).toHaveURL(new RegExp(`#project/${project.id}$`));
    await page.keyboard.press("Escape");
    await expect(page.locator("#project-dialog")).not.toBeVisible();
    await expect(button).toBeFocused();
  }
});

test("replayed entrance writes KL then assembles circle, diameter, and opposing lids", async ({
  page,
}) => {
  const clockStart = Date.now() - 60000;
  await page.clock.install({ time: clockStart });
  await ready(page);
  await page.clock.pauseAt(clockStart + 120000);
  // Sample each authored CSS-animation stage without depending on screenshot/GPU timing.
  for (const [name, time] of [
    ["kl", 1000],
    ["kl-complete", 1300],
    ["circle", 1850],
    ["diameter", 2150],
    ["lids", 2450],
    ["theta", 2850],
    ["clouds", 3300],
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
    await expect(page.locator(".hello-script")).toHaveCount(0);
    if (name === "circle") {
      await expect(page.locator(".logo-centre")).toHaveCSS(
        "stroke-dashoffset",
        "0px",
      );
      await expect(page.locator(".logo-diameter")).toHaveCSS(
        "stroke-dashoffset",
        "1px",
      );
      await expect(page.locator(".logo-top")).toHaveCSS("opacity", "0");
    }
    if (name === "lids") {
      const directions = await page.evaluate(() => ({
        top: new DOMMatrix(
          getComputedStyle(document.querySelector(".logo-top")).transform,
        ).m42,
        bottom: new DOMMatrix(
          getComputedStyle(document.querySelector(".logo-bottom")).transform,
        ).m42,
      }));
      expect(directions.top).toBeLessThan(0);
      expect(directions.bottom).toBeGreaterThan(0);
    }
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
  await page.locator("#close-detail").click();
  await expect(page).toHaveURL(/#gallery$/);
  await page.locator('[data-project="drone"]').click();
  await expect(page.locator("#project-dialog")).toBeVisible({ timeout: 10000 });
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
  await page.clock.fastForward(2448);
  await expect(page.locator("#transition-effect")).toHaveAttribute(
    "data-effect",
    "tnt-white",
  );
  await capture(page, "tnt-interrupted-white");
  await page.clock.fastForward(700);
  await expect(page.locator("#transition-effect")).toHaveAttribute(
    "data-effect",
    "",
  );
  await capture(page, "tnt-guard-interruption");
  await page.clock.fastForward(4052);
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
  await expect(page.locator("#transition")).not.toBeVisible();
  await page.clock.runFor(1600);
});

test("original PDF face is shown as vectors and wall numbers have accessible project names", async ({
  page,
}) => {
  test.setTimeout(120000);
  await ready(page);
  await enterRoom(page);
  await expect(page.locator('[data-project="drawing"]')).toHaveAttribute(
    "aria-label",
    /Face Drawing/,
  );
  await page.locator('[data-project="drawing"]').click();
  await expect(page.locator("#exhibit-actions")).toBeVisible({
    timeout: 12000,
  });
  await capture(page, "original-pdf-face-vectors");
  await page.locator("#close-inspection").click();
  await page.locator('[data-project="sailbot"]').focus();
  await expect(page.locator("#object-label")).toContainText("SailBot");
  const rect = await page.locator(".collection-index").boundingBox();
  expect(rect.width).toBeLessThan(350);
  expect(rect.height).toBeLessThan(page.viewportSize().height * 0.4);
  const projector = await page.locator("#future-board").boundingBox();
  expect(rect.y + rect.height).toBeLessThan(projector.y);
});

test("weather toggles remain independent and render in the courtyard", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.locator('[data-condition="rain"]').click();
  await page.locator('[data-condition="thunder"]').click();
  let state = await page.evaluate(() => galleryDiagnostics().preferences);
  expect(state.rain).toBe(true);
  expect(state.thunder).toBe(true);
  expect(state.clouds).toBe(false);
  await page.locator('[data-condition="clouds"]').click();
  await page.locator("#sky-phase").click();
  await capture(page, "weather-moon-rain-thunder");
  await page.locator('[data-condition="rain"]').click();
  state = await page.evaluate(() => galleryDiagnostics().preferences);
  expect(state).toMatchObject({
    theme: "dark",
    clouds: true,
    rain: false,
    thunder: true,
  });
  await page.reload();
  await ready(page);
  expect(
    await page.evaluate(() => galleryDiagnostics().preferences),
  ).toMatchObject({ theme: "dark", clouds: true, rain: false, thunder: true });
  await page.locator("#sky-phase").click();
  await capture(page, "weather-day-clouds");
});

test("portrait, wall controls and attendants hand off project stories", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install();
  await ready(page);
  await capture(page, "supplied-portrait-entrance");
  await enterRoom(page);
  await page.locator("#doors").click();
  await page.clock.runFor(600);
  await capture(page, "interior-mirror-chalkboard");
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  for (const kind of ["roman", "butler", "fox"]) {
    await page.locator(`[data-attendant="${kind}"]`).click();
    await page.locator('[data-project="sailbot"]').click();
    await page.clock.fastForward(6500);
    await capture(page, `attendant-${kind}-handoff`);
    await page.locator("#skip-transition").click();
    await expect(page.locator("#project-dialog")).toHaveAttribute(
      "data-presentation",
      kind,
    );
    await page.locator("#close-detail").click();
  }
  expect(errors).toEqual([]);
});

test("research toucan arrives and the guard interrupts TNT", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.clock.install();
  await ready(page);
  await enterRoom(page);
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.locator('[data-project="kichua"]').click();
  await page.clock.fastForward(1600);
  await capture(page, "kichua-toucan-arrival");
  await page.clock.fastForward(1100);
  await capture(page, "kichua-scroll-handoff");
  await page.locator("#skip-transition").click();
  await expect(page.locator("#detail-title")).toHaveText("Kichua Research");
  await page.locator("#close-detail").click();
  await page.locator('[data-project="voxelcraft"]').click();
  await page.clock.fastForward(2448);
  await capture(page, "voxelcraft-interrupted-flash");
  await page.clock.fastForward(500);
  await expect(page.locator("#transition-effect")).toHaveAttribute(
    "data-effect",
    "",
  );
  await capture(page, "voxelcraft-guard-stops-blast");
  await page.clock.fastForward(900);
  await capture(page, "voxelcraft-scroll-handoff");
  await page.locator("#skip-transition").click();
  await expect(page.locator("#project-dialog")).toHaveAttribute(
    "data-presentation",
    "roman",
  );
});
