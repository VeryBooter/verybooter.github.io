import { test, expect } from "@playwright/test";
import {
  spaces,
  roomsForCollection,
} from "../docs/assets/js/space-catalogue.js";

test("house map reaches every room, opens furniture, and enters Benedum before SailBot", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(() => window.galleryDiagnostics?.().webgl);
  await expect(page.locator("#entrance")).toBeHidden();
  for (const collection of ["career", "personal"]) {
    await page.goto(collection === "personal" ? "/personal-website/" : "/");
    await page.waitForFunction(() => window.galleryDiagnostics?.().webgl);
    await page.locator("#open-map").click();
    await expect(page.locator("#map-rooms button")).toHaveCount(7);
    expect(
      await page
        .locator("#map-rooms button")
        .evaluateAll((nodes) => nodes.map((node) => node.dataset.space)),
    ).toEqual(roomsForCollection(collection).map((room) => room.id));
    await page.locator("#close-map").click();
    for (const room of roomsForCollection(collection)) {
      await page.locator("#open-map").click();
      await page.locator(`#map-rooms [data-space="${room.id}"]`).click();
      expect(await page.evaluate(() => galleryDiagnostics().space)).toBe(
        room.id === "cabinet" ? "gallery" : room.id,
      );
      if (room.id === "kitchen") {
        await page.locator("#space-panel summary").click();
        await page
          .locator("#space-objects button")
          .filter({ hasText: /^Fridge$/ })
          .click();
        expect(
          (await page.evaluate(() => galleryDiagnostics().spaceObjects)).find(
            (x) => x.name === "Fridge",
          ).open,
        ).toBe(true);
      }
      if (room.id === "benedum") {
        await page.locator("#enter-sailbot").click();
        await expect
          .poll(() => page.evaluate(() => galleryDiagnostics().space))
          .toBe("sailbot");
        await expect(page.locator("#space-links a")).toHaveCount(2);
      }
    }
  }
  await page.goto("/#room/library");
  await page.waitForFunction(
    () => window.galleryDiagnostics?.().space === "library",
  );
  await expect(page).toHaveURL(/\/personal-website\/#room\/library$/);
  await expect(page.locator("#space-title")).toHaveText("Library");
  await page.locator("#open-map").click();
  await page.locator('#map-rooms [data-space="music"]').click();
  await page.locator('[data-note="261.63"]').click();
  await page.goBack();
  await expect(page.locator("#space-title")).toHaveText("Library");
  expect(errors).toEqual([]);
});

test("mobile map and opposite-wall projector stay reachable after resize", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForFunction(() => window.galleryDiagnostics?.().webgl);
  await expect(page.locator("#entrance")).toBeHidden();
  for (const [width, height] of [
    [820, 1180],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.locator('button[data-room-view="presentation"]').click();
    await page.waitForTimeout(700);
    await page.locator("#slide-next").click();
    const box = await page.locator("#future-board").boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    await page.locator("#open-map").click();
    await page.locator('#map-rooms [data-space="museum"]').click();
    await expect(page.locator("#space-title")).toHaveText("Museum");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
});

test("Lens Dwellers plays on the cinema screen and pauses when leaving", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/#room/cinema");
  await page.waitForFunction(
    () => window.galleryDiagnostics?.().space === "cinema",
  );
  await expect(page.locator("#film-file")).toHaveCount(0);
  await page.locator("#play-film").click();
  await expect
    .poll(
      () => page.locator("#film-video").evaluate((video) => video.currentTime),
      { timeout: 20000 },
    )
    .toBeGreaterThan(0.25);
  const media = await page.locator("#film-video").evaluate((video) => ({
    width: video.videoWidth,
    height: video.videoHeight,
    duration: video.duration,
    paused: video.paused,
    error: video.error?.message,
  }));
  expect(media).toMatchObject({ width: 1920, height: 1080, paused: false });
  expect(media.duration).toBeCloseTo(113.844, 2);
  expect(media.error).toBeUndefined();
  expect(
    await page.evaluate(() => galleryDiagnostics().cinemaScreenVideo),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/browser/screenshots/lens-dwellers-cinema.png",
  });
  await page.locator("#open-map").click();
  await page.locator('#map-rooms [data-space="library"]').click();
  expect(
    await page.locator("#film-video").evaluate((video) => video.paused),
  ).toBe(true);
});

test("single viewport keeps text selectable and navigation independent of scrolling", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForFunction(() => window.galleryDiagnostics?.().webgl);
  const paragraph = page.locator(".intro-copy .intro-body").first();
  const bounds = await paragraph.boundingBox();
  await page.mouse.move(bounds.x + 2, bounds.y + 5);
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width - 2,
    bounds.y + bounds.height - 3,
    { steps: 15 },
  );
  await page.mouse.up();
  expect(await page.evaluate(() => getSelection().toString())).toContain(
    "physics",
  );
  await page.mouse.wheel(0, 1600);
  await page.waitForTimeout(150);
  expect(
    await page.evaluate(() => ({
      y: scrollY,
      height: document.documentElement.scrollHeight,
      viewport: innerHeight,
      place: galleryDiagnostics().location,
    })),
  ).toEqual({ y: 0, height: 720, viewport: 720, place: "courtyard" });
  await page.locator('button[data-room-view="cabinet"]').click();
  await expect
    .poll(() => page.evaluate(() => galleryDiagnostics().location))
    .toBe("interior");
  await page.mouse.wheel(0, -1600);
  expect(await page.evaluate(() => galleryDiagnostics().location)).toBe(
    "interior",
  );
  await page.locator("#visit-courtyard").click();
  await expect
    .poll(() => page.evaluate(() => galleryDiagnostics().location))
    .toBe("courtyard");
});

test("sky uses distinct sun and crescent silhouettes and the exterior camera is level", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForFunction(() => window.galleryDiagnostics?.().webgl);
  expect(await page.evaluate(() => galleryDiagnostics().skyMark)).toBe(
    "radiant-sun",
  );
  const angles = await page.evaluate(() => galleryDiagnostics().cameraRotation);
  angles.forEach((angle) => expect(Math.abs(angle)).toBeLessThan(0.00001));
  await page.screenshot({
    path: "artifacts/browser/screenshots/level-entrance-sun.png",
  });
  await page.locator(".settings-toggle").click();
  await page.locator('[data-theme="dark"]').click();
  await page.locator("#close-atmosphere").click();
  await expect
    .poll(() => page.evaluate(() => galleryDiagnostics().skyMark))
    .toBe("crescent-moon");
  await page.screenshot({
    path: "artifacts/browser/screenshots/crescent-moon.png",
  });
});
