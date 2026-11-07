import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { projects } from "../docs/assets/js/catalogue.js";

test.use({ actionTimeout: 10000 });
const screenshots = "artifacts/browser/screenshots";
async function ready(page, hash = "") {
  await page.goto(`/${hash}`);
  await page.waitForFunction(() => window.galleryDiagnostics?.().webgl);
  await expect(page.locator("#entrance")).toBeHidden();
  if (!hash) {
    await page.locator('button[data-room-view="cabinet"]').click();
    if ((await page.locator("#doors").getAttribute("aria-pressed")) === "false")
      await page.locator("#doors").click();
  }
}
async function pause(page) {
  await page.clock.pauseAt(
    new Date(await page.evaluate(() => Date.now() + 1000)),
  );
}
async function capture(page, name) {
  await mkdir(screenshots, { recursive: true });
  await page.screenshot({ path: `${screenshots}/${name}.png` });
}
async function outside(page) {
  await page.locator("#visit-courtyard").click();
  await expect
    .poll(() => page.evaluate(() => galleryDiagnostics().location))
    .toBe("courtyard");
}
for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["tablet", 820, 1180],
  ["phone", 390, 844],
]) {
  test(`${name}: courtyard navigation, cabinet, opposite-wall slides and bulletin portrait`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await ready(page);
    await expect
      .poll(() => page.evaluate(() => galleryDiagnostics().location))
      .toBe("interior");
    await expect(page.locator("#doors")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(await page.evaluate(() => galleryDiagnostics().objects)).toBe(
      projects.length,
    );
    const index = await page.locator(".collection-index").boundingBox();
    expect(index.x).toBeGreaterThanOrEqual(0);
    expect(index.x + index.width).toBeLessThanOrEqual(width);
    await capture(page, `${name}-auto-open`);
    await page.locator('[data-project="sailbot"]').click();
    await expect(page.locator("#project-dialog")).toBeVisible();
    await expect(page.locator("#detail-links a")).toHaveCount(2);
    await page.locator("#close-detail").click();
    await page.locator('button[data-room-view="presentation"]').click();
    await expect
      .poll(() => page.evaluate(() => galleryDiagnostics().view))
      .toBe("presentation");
    await page.waitForTimeout(700);
    const screen = await page.locator("#future-board").boundingBox();
    expect(screen.x).toBeGreaterThanOrEqual(0);
    expect(screen.x + screen.width).toBeLessThanOrEqual(width);
    expect(
      await page.evaluate(() => galleryDiagnostics().projectionPosition[2]),
    ).toBeGreaterThan(-6);
    await page.locator("#slide-next").click();
    await expect(page.locator("#slide-count")).toHaveText("2 / 2");
    await capture(page, `${name}-opposite-wall`);
    await page.locator('button[data-room-view="bulletin"]').click();
    await page.waitForTimeout(700);
    expect(
      await page.evaluate(() => galleryDiagnostics().portraitPosition[2]),
    ).toBeLessThan(-32);
    await capture(page, `${name}-bulletin`);
    await outside(page);
    await expect(
      page.locator('.contact-road-sign a[href="mailto:yul424@pitt.edu"]'),
    ).toBeVisible();
    await expect(page.locator("#pediment-name")).toHaveText(/Kevin\s*Li/);
    await capture(page, `${name}-courtyard-sign`);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    expect(errors).toEqual([]);
  });
}

test("all exhibits finish within 750 ms, close, and restore keyboard focus", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.clock.install();
  await ready(page);
  await pause(page);
  for (const project of projects) {
    const button = page.locator(`[data-project="${project.id}"]`);
    await button.click();
    await page.clock.fastForward(749);
    expect(await page.evaluate(() => galleryDiagnostics().state)).toBe(
      "transition",
    );
    await page.clock.fastForward(2);
    if (project.presentation === "effect") {
      await expect(page.locator("#project-dialog")).toBeHidden();
      expect(await page.evaluate(() => galleryDiagnostics().state)).toBe(
        "gallery",
      );
      continue;
    }
    if (project.presentation === "display") {
      await expect(page.locator("#exhibit-actions")).toBeVisible();
      await expect(page.locator("#end-exhibit")).toBeHidden();
      await page.locator("#close-inspection").click();
      continue;
    }
    if (project.id === "house") {
      await page.locator("#inspect-chip").click();
      await expect(page.locator("#inspect-chip")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await page.locator("#read-story").click();
    }
    if (project.id === "games") {
      await page.locator("#game-buttons button").first().click();
      await page.clock.fastForward(281);
    }
    await expect(page.locator("#project-dialog")).toBeVisible();
    await expect(page.locator("#detail-title")).toHaveText(project.title);
    await page.keyboard.press("Escape");
    await expect(page.locator("#project-dialog")).toBeHidden();
    await expect(button).toBeFocused();
  }
});

test("courtyard opens without the archived animation and matches front-page controls", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForFunction(() => window.galleryDiagnostics?.().webgl);
  await expect(page.locator("#entrance")).toBeHidden();
  await expect(page.locator("#replay-roof")).toBeHidden();
  await expect(page.locator(".roof-weather")).toBeHidden();
  await expect(page.locator(".intro-lead")).toBeHidden();
  await expect(page.locator(".intro-copy")).toBeVisible();
  expect(await page.evaluate(() => galleryDiagnostics().location)).toBe(
    "courtyard",
  );
  expect(await page.evaluate(() => galleryDiagnostics().entranceEnabled)).toBe(
    false,
  );
  expect((await page.locator("#room-navigation").boundingBox()).y).toBeLessThan(
    30,
  );
  await capture(page, "front-page-revised");
});

test("direct project links and browser Back preserve navigation", async ({
  page,
}) => {
  await ready(page, "#project/rocket");
  await expect(page.locator("#detail-title")).toHaveText("SOAR / Rocket");
  await page.locator("#close-detail").click();
  await expect(page).toHaveURL(/#gallery$/);
  await page.locator('[data-project="drone"]').click();
  await expect(page.locator("#project-dialog")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#project-dialog")).toBeHidden();
});

test("cartoon clouds visibly drift and independent weather preferences persist", async ({
  page,
}) => {
  await page.clock.install();
  await ready(page);
  await outside(page);
  await pause(page);
  await page.locator('[data-condition="clouds"]').evaluate((el) => el.click());
  const before = await page.evaluate(() => galleryDiagnostics().cloudPositions);
  await page.clock.fastForward(1000);
  const after = await page.evaluate(() => galleryDiagnostics().cloudPositions);
  expect(after[0][0]).not.toBe(before[0][0]);
  await page.locator('[data-condition="rain"]').evaluate((el) => el.click());
  await page.locator('[data-condition="thunder"]').evaluate((el) => el.click());
  await page.locator(".settings-toggle").click();
  await page.locator('[data-theme="dark"]').click();
  await page.locator("#close-atmosphere").click();
  expect(
    await page.evaluate(() => galleryDiagnostics().preferences),
  ).toMatchObject({ clouds: true, rain: true, thunder: true, theme: "dark" });
  await capture(page, "cartoon-clouds-night");
});

test("fast MIPS sequence preserves scan, walls, chip, and roof order", async ({
  page,
}) => {
  await page.clock.install();
  await ready(page);
  await pause(page);
  await page.locator('[data-project="house"]').click();
  let elapsed = 0;
  for (const [time, stage] of [
    [120, "grabbing-blueprint"],
    [200, "laser-scanning"],
    [335, "assembling-walls"],
    [500, "chip-emerging"],
    [600, "installing-chip"],
    [700, "placing-roof"],
  ]) {
    await page.clock.fastForward(time - elapsed);
    elapsed = time;
    expect(await page.evaluate(() => galleryDiagnostics().houseStage)).toBe(
      stage,
    );
  }
  await page.clock.fastForward(51);
  await expect(page.locator("#exhibit-actions")).toBeVisible();
  expect(await page.evaluate(() => galleryDiagnostics().houseStage)).toBe(
    "complete",
  );
});

test("running attendants retrieve and toss each story toward the viewer", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.clock.install();
  await ready(page);
  await pause(page);
  for (const kind of ["roman", "butler", "fox"]) {
    await page.locator(`[data-attendant="${kind}"]`).click();
    await page.locator('[data-project="sailbot"]').click();
    await page.clock.fastForward(100);
    expect(
      await page.evaluate(() => galleryDiagnostics().attendant.stage),
    ).toBe("running-to-cabinet");
    await page.clock.fastForward(200);
    expect(
      await page.evaluate(() => galleryDiagnostics().attendant.stage),
    ).toBe("reaching");
    await page.clock.fastForward(310);
    expect(
      await page.evaluate(() => galleryDiagnostics().attendant.stage),
    ).toBe("throwing");
    const before = await page.evaluate(
      () => galleryDiagnostics().attendant.giftDistance,
    );
    await page.clock.fastForward(110);
    expect(
      await page.evaluate(() => galleryDiagnostics().attendant.giftDistance),
    ).toBeLessThan(before);
    await capture(page, `${kind}-toss`);
    await page.clock.fastForward(31);
    await expect(page.locator("#project-dialog")).toHaveAttribute(
      "data-presentation",
      kind,
    );
    await page.locator("#close-detail").click();
  }
});

test("archer releases the arrow, quiet exhibits avoid windows, and vector drawing stays accessible", async ({
  page,
}) => {
  await page.clock.install();
  await ready(page);
  await pause(page);
  await page.locator('[data-project="hackathon"]').click();
  await page.clock.fastForward(330);
  expect(
    await page.evaluate(() => galleryDiagnostics().archer.draw),
  ).toBeLessThan(-0.5);
  await page.clock.fastForward(210);
  expect(
    (await page.evaluate(() => galleryDiagnostics().archer.arrow))[0],
  ).toBeGreaterThan(2);
  await page.clock.fastForward(211);
  await page.locator("#close-detail").click();
  for (const id of ["cooking", "lamp"]) {
    await page.locator(`[data-project="${id}"]`).click();
    await expect(page.locator("#transition")).toBeHidden();
    await page.clock.fastForward(751);
    await expect(page.locator("#project-dialog")).toBeHidden();
  }
  await page.locator('[data-project="drawing"]').click();
  await page.clock.fastForward(751);
  await expect(page.locator("#close-inspection")).toBeVisible();
  await expect(page.locator("#end-exhibit")).toBeHidden();
  expect(await page.evaluate(() => galleryDiagnostics().vectorDrawing)).toBe(
    true,
  );
});

test("TNT interruption and rocket nozzle effects remain correctly timed", async ({
  page,
}) => {
  await page.clock.install();
  await ready(page);
  await pause(page);
  await page.locator('[data-project="voxelcraft"]').click();
  await page.clock.fastForward(255);
  await expect(page.locator("#transition-effect")).toHaveAttribute(
    "data-effect",
    "tnt-white",
  );
  await page.clock.fastForward(70);
  await expect(page.locator("#transition-effect")).toHaveAttribute(
    "data-effect",
    "",
  );
  await page.clock.fastForward(426);
  await page.locator("#close-detail").click();
  await page.locator('[data-project="rocket"]').click();
  await page.clock.fastForward(560);
  const d = await page.evaluate(() => galleryDiagnostics());
  expect(d.nozzleWorld).toEqual(d.smokeOrigin);
  await page.clock.fastForward(191);
  await expect(page.locator("#close-detail")).toHaveCSS(
    "background-color",
    "rgb(255, 95, 87)",
  );
});
