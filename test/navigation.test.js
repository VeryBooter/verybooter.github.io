import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { projects } from "../docs/assets/js/catalogue.js";

const html = readFileSync(
  new URL("../docs/index.html", import.meta.url),
  "utf8",
);
let fixtureId = 0;
async function fixture(hash = "", { blocked = false, reduced = true } = {}) {
  const dom = new JSDOM(html, {
    url: `http://localhost/${hash}`,
    pretendToBeVisual: true,
  });
  const w = dom.window;
  w.matchMedia = () => ({ matches: reduced, addEventListener() {} });
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.scrollTo = () => {};
  w.HTMLCanvasElement.prototype.getContext = () => null;
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  for (const name of [
    "window",
    "document",
    "location",
    "history",
    "localStorage",
    "sessionStorage",
    "innerWidth",
    "innerHeight",
    "devicePixelRatio",
    "scrollY",
  ]) {
    Object.defineProperty(globalThis, name, {
      value: name === "window" ? w : w[name],
      configurable: true,
      writable: true,
    });
  }
  globalThis.matchMedia = w.matchMedia;
  if (blocked) {
    for (const name of ["localStorage", "sessionStorage"])
      Object.defineProperty(globalThis, name, {
        get() {
          throw Error("denied");
        },
        configurable: true,
      });
  }
  const warn = console.warn,
    error = console.error;
  console.warn = () => {};
  console.error = () => {};
  try {
    await import(`../docs/assets/js/main.js?fixture=${fixtureId++}`);
  } finally {
    console.warn = warn;
    console.error = error;
  }
  return { dom, w, $: (selector) => w.document.querySelector(selector) };
}

test("all twelve exhibits remain usable without WebGL and restore focus", async () => {
  const { dom, w, $ } = await fixture();
  assert.equal(w.galleryDiagnostics().webgl, false);
  assert.equal(w.document.querySelectorAll("[data-project]").length, 12);
  assert.equal($("#doors").hidden, true);
  for (const project of projects) {
    const button = $(`[data-project="${project.id}"]`);
    button.focus();
    button.click();
    if (project.presentation === "effect") {
      assert.equal($("#project-dialog").open, false);
      assert.equal(w.galleryDiagnostics().state, "gallery");
      continue;
    }
    if (project.presentation === "display") {
      assert.equal($("#exhibit-actions").hidden, false);
      assert.equal($("#project-dialog").open, false);
      $("#end-exhibit").click();
      await new Promise((resolve) => setTimeout(resolve, 10));
      continue;
    }
    if (project.id === "house") {
      $("#inspect-chip").click();
      $("#read-story").click();
    }
    if (project.id === "games") {
      $("#game-buttons button").click();
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.equal($("#project-dialog").open, true);
    assert.equal($("#detail-title").textContent, project.title);
    assert.equal(w.location.hash, `#project/${project.id}`);
    assert.equal($("#placeholder-label").hidden, false);
    assert.equal($("#detail-links").children.length, 0);
    $("#project-dialog").dispatchEvent(
      new w.Event("cancel", { cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal($("#project-dialog").open, false);
    assert.equal(w.document.activeElement, button);
  }
  dom.window.close();
});
test("deep links bypass entrance and restore a gallery URL on close", async () => {
  const { dom, w, $ } = await fixture("#project/rocket", { reduced: false });
  assert.equal($("#entrance").hidden, true);
  assert.equal($("#detail-title").textContent, "SOAR / Rocket");
  assert.equal($("#project-dialog").open, true);
  $("#back-gallery").click();
  assert.equal(w.location.hash, "#gallery");
  assert.equal($("#project-dialog").open, false);
  dom.window.close();
});
test("theme, weather, and motion controls work when storage is denied", async () => {
  const { dom, w, $ } = await fixture("", { blocked: true });
  $('button[data-theme="dark"]').click();
  assert.equal(w.document.body.dataset.theme, "dark");
  $("#weather").value = "storm";
  $("#weather").dispatchEvent(new w.Event("change"));
  assert.equal(w.galleryDiagnostics().preferences.weather, "storm");
  assert.equal($("#motion").getAttribute("aria-pressed"), "false");
  $("#motion").click();
  assert.equal($("#motion").getAttribute("aria-pressed"), "true");
  dom.window.close();
});
test("entrance is skippable, removes background controls from focus, and replays", async () => {
  const { dom, w, $ } = await fixture("", { reduced: false });
  assert.equal($("#entrance").hidden, false);
  assert.equal($("main").inert, true);
  $("#skip-entrance").click();
  assert.equal($("#entrance").hidden, true);
  assert.equal($("main").inert, false);
  assert.equal(w.sessionStorage.getItem("gallery.entered"), "yes");
  $("#replay").click();
  assert.equal($("#entrance").hidden, false);
  $("#skip-entrance").click();
  dom.window.close();
});
test("browser Back restores the previous view after opening a project", async () => {
  const { dom, w, $ } = await fixture();
  $('[data-project="sailbot"]').click();
  w.history.back();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal($("#project-dialog").open, false);
  assert.equal(w.galleryDiagnostics().state, "gallery");
  dom.window.close();
});
