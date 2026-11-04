import test from "node:test";
import assert from "node:assert/strict";
import { projects, projectFromHash } from "../docs/assets/js/catalogue.js";
import { GalleryController } from "../docs/assets/js/controller.js";
import { readPreferences, safeWrite } from "../docs/assets/js/preferences.js";
import { buildObject, buildCabinet } from "../docs/assets/js/models.js";
import { Scene } from "three";

test("every catalogue entry has a distinct, nonempty 3D model and stable route", () => {
  assert.equal(projects.length, 13);
  assert.equal(new Set(projects.map((p) => p.id)).size, 13);
  for (const project of projects) {
    assert.equal(projectFromHash(`#project/${project.id}`), project);
    assert.ok(
      buildObject(project.id).children.length,
      `${project.id} has geometry`,
    );
    assert.ok(project.description && project.summary);
    assert.equal(project.placeholder, true);
  }
  for (const hash of [
    "#project/unknown",
    "#project/%",
    "#project/sailbot/extra",
    "#gallery",
  ])
    assert.equal(projectFromHash(hash), undefined);
});
test("cabinet maps all twelve objects and has two independently hinged doors", () => {
  const cabinet = buildCabinet(new Scene(), projects);
  assert.equal(cabinet.exhibits.size, 13);
  assert.equal(cabinet.doors.length, 2);
  for (const [id, model] of cabinet.exhibits) {
    assert.ok(model.userData.basePosition);
    model.traverse((child) => assert.equal(child.userData.projectId, id));
  }
});
test("rapid reselection cancels stale transitions and closing prevents delayed reopening", async () => {
  const seen = [];
  const controller = new GalleryController({
    duration: 15,
    onChange: (state, id) => seen.push([state, id]),
  });
  controller.select("rocket");
  controller.select("sailbot");
  await new Promise((resolve) => setTimeout(resolve, 35));
  assert.deepEqual(
    seen.filter(([state]) => state === "detail"),
    [["detail", "sailbot"]],
  );
  controller.select("house");
  controller.back();
  await new Promise((resolve) => setTimeout(resolve, 35));
  assert.equal(controller.state, "gallery");
  assert.equal(controller.activeId, null);
});
test("skip and reduced-motion selection open details immediately", () => {
  const controller = new GalleryController();
  controller.select("drone");
  controller.finish();
  assert.equal(controller.state, "detail");
  controller.select("drawing", false);
  assert.equal(controller.state, "detail");
  assert.equal(controller.activeId, "drawing");
  controller.dispose();
});
test("blocked and malformed storage use safe preferences", () => {
  const blocked = {
    getItem() {
      throw Error("denied");
    },
    setItem() {
      throw Error("denied");
    },
  };
  assert.deepEqual(readPreferences(blocked, true), {
    theme: "light",
    weather: "clear",
    clouds: false,
    rain: false,
    thunder: false,
    motion: false,
  });
  assert.doesNotThrow(() => safeWrite(blocked, "key", "value"));
  assert.equal(readPreferences({ getItem: () => "invalid" }).weather, "clear");
  const values = {
    "gallery.theme": "dark",
    "gallery.weather": "storm",
    "gallery.motion": "off",
  };
  assert.deepEqual(readPreferences({ getItem: (key) => values[key] }), {
    theme: "dark",
    weather: "storm",
    clouds: true,
    rain: true,
    thunder: false,
    motion: false,
  });
});

test("rain, clouds, and thunder preferences persist independently", () => {
  const values = {
    "gallery.rain": "on",
    "gallery.clouds": "off",
    "gallery.thunder": "on",
    "gallery.weather": "storm",
  };
  const prefs = readPreferences({ getItem: (key) => values[key] ?? null });
  assert.equal(prefs.rain, true);
  assert.equal(prefs.clouds, false);
  assert.equal(prefs.thunder, true);
});
