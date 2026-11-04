import { projects, getProject, projectFromHash } from "./catalogue.js";
import { GalleryController } from "./controller.js";
import { safeRead, safeWrite, readPreferences } from "./preferences.js";

const $ = (selector) => document.querySelector(selector);
let local, session;
try {
  local = localStorage;
} catch {}
try {
  session = sessionStorage;
} catch {}
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const preferences = readPreferences(local, reduced.matches);
const dialog = $("#project-dialog");
const entrance = $("#entrance");
const index = $("#project-index");
const gallery = $("#gallery");
let scene;
let entranceTimer;
let entranceHideTimer;
let previousFocus;
let routeOwned = false;
let cabinetOpen = false;
let fallback = false;
let directStory = false;
let actionTimer;
let attendant = ["roman", "butler", "fox"].includes(
  safeRead(local, "gallery.attendant"),
)
  ? safeRead(local, "gallery.attendant")
  : "roman";
const controller = new GalleryController({
  onChange(state, id) {
    document.body.dataset.state = state;
    $("#transition").hidden = state !== "transition";
    if (state === "transition") {
      $("#transition-title").textContent = getProject(id).title;
      scene?.select(id, preferences.motion, getProject(id).duration);
      $("#skip-transition").focus({ preventScroll: true });
    }
    if (state === "detail") {
      $("#transition").hidden = true;
      const project = getProject(id);
      if (project.presentation === "effect") {
        $("#scene-status").textContent = `${project.title} animation complete.`;
        if (projectFromHash(location.hash)?.id === id)
          history.replaceState(null, "", "#gallery");
        routeOwned = false;
        controller.back();
        return;
      }
      if (
        project.presentation === "display" ||
        (project.presentation === "interactive" && !directStory)
      ) {
        if (scene?.active?.id !== id) scene?.select(id, false);
        showPreview(project);
        return;
      }
      openStory(project);
    }
    if (state === "gallery") {
      if (dialog.open) dialog.close();
      scene?.reset();
      clearTimeout(actionTimer);
      $("#exhibit-actions").hidden = true;
      $("#object-label").hidden = true;
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
    }
  },
});

for (const project of projects) {
  const button = document.createElement("button");
  button.className = "project-item";
  button.dataset.project = project.id;
  button.title = `${project.number} · ${project.title}`;
  button.setAttribute(
    "aria-label",
    `Open ${project.title}: ${project.subtitle}`,
  );
  const number = document.createElement("span");
  number.className = "project-number";
  number.textContent = project.number;
  const name = document.createElement("span");
  name.className = "project-name";
  name.textContent = project.title;
  const subtitle = document.createElement("small");
  subtitle.textContent = project.subtitle;
  name.append(subtitle);
  const arrow = document.createElement("span");
  arrow.className = "project-arrow";
  arrow.textContent = "↗";
  arrow.setAttribute("aria-hidden", "true");
  button.append(number, name, arrow);
  button.addEventListener("click", () => openProject(project.id));
  button.addEventListener("focus", () => showLabel(project.id));
  button.addEventListener("blur", () => showLabel(null));
  button.addEventListener("pointerenter", () => showLabel(project.id));
  button.addEventListener("pointerleave", () => showLabel(null));
  if (project.id === "kichua") {
    button.classList.add("research-entry");
    $("#research-index").append(button);
  } else index.append(button);
}
function showLabel(id) {
  const label = $("#object-label");
  label.hidden = !id;
  if (id)
    label.textContent = `${getProject(id).number} / ${getProject(id).title}`;
}
function openStory(project) {
  dialog.dataset.presentation = ["voxelcraft", "sailbot", "kichua"].includes(
    project.id,
  )
    ? attendant
    : "standard";
  $("#exhibit-actions").hidden = true;
  scene?.reset();
  renderDetail(project);
  dialog.classList.toggle("controller-story", project.id === "games");
  if (!dialog.open) dialog.showModal();
  $("#close-detail").focus({ preventScroll: true });
}
function showPreview(project) {
  $("#exhibit-actions").hidden = false;
  $("#preview-title").textContent = project.title;
  $("#inspect-chip").hidden = project.id !== "house";
  $("#inspect-chip").textContent = "Inspect chip";
  $("#inspect-chip").setAttribute("aria-pressed", "false");
  $("#read-story").hidden = project.id !== "house";
  $("#game-buttons").hidden = project.id !== "games";
  if (project.id === "games") {
    const buttons = [...$("#game-buttons").children];
    for (let i = buttons.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [buttons[i], buttons[j]] = [buttons[j], buttons[i]];
    }
    $("#game-buttons").append(...buttons);
  }
  $("#end-exhibit").focus({ preventScroll: true });
}
function pressGameButton(index) {
  if (controller.activeId !== "games" || $("#exhibit-actions").hidden) return;
  scene?.pressGameButton(index);
  clearTimeout(actionTimer);
  actionTimer = setTimeout(
    () => openStory(getProject("games")),
    preferences.motion ? 280 : 0,
  );
}
$("#end-exhibit").addEventListener("click", closeProject);
$("#close-inspection").addEventListener("click", closeProject);
$("#read-story").addEventListener("click", () =>
  openStory(getProject(controller.activeId)),
);
$("#inspect-chip").addEventListener("click", () => {
  const chip = $("#inspect-chip").getAttribute("aria-pressed") !== "true";
  $("#inspect-chip").setAttribute("aria-pressed", String(chip));
  $("#inspect-chip").textContent = chip ? "Inspect house" : "Inspect chip";
  scene?.showHousePhase(chip ? "chip" : "house");
});
$("#game-buttons")
  .querySelectorAll("button")
  .forEach((button) =>
    button.addEventListener("click", () =>
      pressGameButton(Number(button.dataset.button)),
    ),
  );
for (const button of document.querySelectorAll("[data-attendant]")) {
  button.setAttribute(
    "aria-pressed",
    String(button.dataset.attendant === attendant),
  );
  button.addEventListener("click", () => {
    if (["transition", "detail"].includes(controller.state)) closeProject();
    attendant = button.dataset.attendant;
    safeWrite(local, "gallery.attendant", attendant);
    scene?.setAttendant(attendant);
    document
      .querySelectorAll("[data-attendant]")
      .forEach((option) =>
        option.setAttribute(
          "aria-pressed",
          String(option.dataset.attendant === attendant),
        ),
      );
  });
}
function renderDetail(project) {
  $("#detail-number").textContent = project.number;
  $("#detail-category").textContent = `${project.number} / ${project.category}`;
  $("#detail-title").textContent = project.title;
  $("#detail-summary").textContent = project.summary;
  $("#detail-body").textContent = project.description;
  $("#placeholder-label").hidden = !project.placeholder;
  $("#detail-links").replaceChildren();
  for (const link of project.links) {
    try {
      const url = new URL(link.href, location.origin);
      if (!["https:", "http:", "mailto:"].includes(url.protocol)) continue;
      const a = document.createElement("a");
      a.href = url.href;
      a.textContent = `${link.label} ↗`;
      $("#detail-links").append(a);
    } catch {}
  }
}
function openProject(id, { fromRoute = false, animate = true } = {}) {
  const project = getProject(id);
  if (!project) return;
  finishEntrance();
  clearTimeout(actionTimer);
  $("#exhibit-actions").hidden = true;
  directStory = fromRoute && !animate;
  if (dialog.open) dialog.close();
  if (controller.state !== "transition")
    previousFocus = document.activeElement?.matches("[data-project]")
      ? document.activeElement
      : document.querySelector(`[data-project="${id}"]`);
  if (!["lamp", "satellite", "drawing"].includes(id)) {
    cabinetOpen = true;
    updateDoors();
  }
  gallery.scrollIntoView({ behavior: "instant", block: "start" });
  updateScroll();
  if (!fromRoute && project.presentation !== "effect") {
    history.pushState({ galleryProject: true }, "", `#project/${id}`);
    routeOwned = true;
  } else routeOwned = false;
  controller.select(
    id,
    animate && preferences.motion && !fallback,
    project.duration,
  );
}
function closeProject() {
  controller.back();
  if (routeOwned && projectFromHash(location.hash)) {
    routeOwned = false;
    history.back();
  } else if (projectFromHash(location.hash))
    history.replaceState(null, "", "#gallery");
}
function applyRoute() {
  const project = projectFromHash(location.hash);
  if (project) {
    openProject(project.id, { fromRoute: true, animate: false });
  } else if (["transition", "detail"].includes(controller.state))
    controller.back();
}
window.addEventListener("popstate", applyRoute);
window.addEventListener("hashchange", () => {
  if (projectFromHash(location.hash)?.id !== controller.activeId) applyRoute();
});
dialog.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeProject();
});
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      closeProject();
  }
});
$("#close-detail").addEventListener("click", closeProject);
$("#skip-transition").addEventListener("click", () => controller.finish());
$("#cancel-transition").addEventListener("click", closeProject);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (controller.state === "transition" || !$("#exhibit-actions").hidden)
      closeProject();
    $("#atmosphere").classList.remove("open");
    $(".settings-toggle").setAttribute("aria-expanded", "false");
  }
});
function applyPreferences() {
  document.body.dataset.theme = preferences.theme;
  document.body.dataset.motion = preferences.motion ? "on" : "off";
  document.documentElement.style.scrollBehavior = preferences.motion
    ? "smooth"
    : "auto";
  document.querySelector('meta[name="theme-color"]').content =
    preferences.theme === "dark" ? "#202822" : "#eee9df";
  document.querySelectorAll("[data-theme]").forEach((button) => {
    if (button.tagName === "BUTTON")
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.theme === preferences.theme),
      );
  });
  for (const button of document.querySelectorAll("[data-condition]"))
    button.setAttribute(
      "aria-pressed",
      String(preferences[button.dataset.condition]),
    );
  $("#sky-phase").setAttribute(
    "aria-pressed",
    String(preferences.theme === "dark"),
  );
  $("#sky-phase").setAttribute(
    "aria-label",
    preferences.theme === "dark" ? "Switch to sunlight" : "Switch to moonlight",
  );
  $("#sky-phase span").textContent = preferences.theme === "dark" ? "☾" : "☀";
  $("#motion").textContent = preferences.motion ? "On" : "Off";
  $("#motion").setAttribute("aria-pressed", String(preferences.motion));
  scene?.setPreferences(preferences);
  if (!preferences.motion) {
    finishEntrance();
    if (controller.state === "transition") controller.finish();
  }
}
document.querySelectorAll("button[data-theme]").forEach((button) =>
  button.addEventListener("click", () => {
    preferences.theme = button.dataset.theme;
    safeWrite(local, "gallery.theme", preferences.theme);
    applyPreferences();
  }),
);
$("#sky-phase").addEventListener("click", () => {
  preferences.theme = preferences.theme === "dark" ? "light" : "dark";
  safeWrite(local, "gallery.theme", preferences.theme);
  applyPreferences();
});
for (const button of document.querySelectorAll("[data-condition]"))
  button.addEventListener("click", () => {
    const condition = button.dataset.condition;
    preferences[condition] = !preferences[condition];
    safeWrite(
      local,
      `gallery.${condition}`,
      preferences[condition] ? "on" : "off",
    );
    preferences.weather = preferences.rain
      ? "storm"
      : preferences.clouds
        ? "cloudy"
        : "clear";
    safeWrite(local, "gallery.weather", preferences.weather);
    applyPreferences();
  });
$("#motion").addEventListener("click", () => {
  preferences.motion = !preferences.motion;
  safeWrite(local, "gallery.motion", preferences.motion ? "on" : "off");
  applyPreferences();
});
reduced.addEventListener("change", (e) => {
  if (safeRead(local, "gallery.motion") === null) {
    preferences.motion = !e.matches;
    applyPreferences();
  }
});
$(".settings-toggle").addEventListener("click", () => {
  const open = $("#atmosphere").classList.toggle("open");
  $(".settings-toggle").setAttribute("aria-expanded", String(open));
});
document.addEventListener("click", (e) => {
  if (!e.target.closest("#atmosphere,.settings-toggle")) {
    $("#atmosphere").classList.remove("open");
    $(".settings-toggle").setAttribute("aria-expanded", "false");
  }
});
function updateDoors() {
  scene?.setDoors(cabinetOpen);
  $("#doors").setAttribute("aria-pressed", String(cabinetOpen));
  $("#doors").firstChild.textContent = cabinetOpen
    ? "Close the cabinet "
    : "Open the cabinet ";
}
$("#doors").addEventListener("click", () => {
  cabinetOpen = !cabinetOpen;
  updateDoors();
});
function enterGallery() {
  gallery.scrollIntoView({ behavior: "instant", block: "start" });
  updateScroll();
  scene?.setProgress(1);
  if (scene) document.body.dataset.location = "entering";
}
$("#enter-room").addEventListener("click", enterGallery);
for (const link of document.querySelectorAll('a[href="#gallery"]'))
  link.addEventListener("click", (event) => {
    event.preventDefault();
    history.pushState(null, "", "#gallery");
    enterGallery();
  });
$("#close-atmosphere").addEventListener("click", () => {
  $("#atmosphere").classList.remove("open");
  $(".settings-toggle").setAttribute("aria-expanded", "false");
  $(".settings-toggle").focus();
});
function updateScroll() {
  const progress = Math.max(
    0,
    Math.min(
      1,
      (scrollY - gallery.offsetTop + innerHeight * 0.65) / (innerHeight * 0.85),
    ),
  );
  scene?.setProgress(progress);
  if (!["entrance", "transition", "detail"].includes(controller.state))
    controller.state = progress > 0.5 ? "gallery" : "introduction";
}
window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("resize", updateScroll);
function setEntranceInert(inert) {
  for (const target of [
    $("#roof-controls"),
    $("#enter-room"),
    $("#atmosphere"),
    $(".collection-index"),
    $("main"),
  ])
    target.inert = inert;
}
function finishEntrance() {
  clearTimeout(entranceTimer);
  clearTimeout(entranceHideTimer);
  const restoreFocus = entrance.contains(document.activeElement);
  entrance.hidden = true;
  entrance.classList.remove("leaving");
  setEntranceInert(false);
  safeWrite(session, "gallery.entered", "yes");
  if (controller.state === "entrance") controller.change("introduction");
  if (restoreFocus) $("#roof-about").focus({ preventScroll: true });
}
function playEntrance() {
  if (!preferences.motion) return;
  window.scrollTo({ top: 0, behavior: "instant" });
  clearTimeout(entranceTimer);
  clearTimeout(entranceHideTimer);
  entrance.hidden = false;
  entrance.classList.remove("leaving");
  setEntranceInert(true);
  controller.change("entrance");
  // Restart every authored CSS animation, including the clouds and both marks.
  entrance.style.animation = "none";
  for (const animation of entrance.getAnimations?.({ subtree: true }) || []) {
    animation.cancel();
    animation.play();
  }
  $("#skip-entrance").focus({ preventScroll: true });
  entranceTimer = setTimeout(() => {
    entrance.classList.add("leaving");
    entranceHideTimer = setTimeout(finishEntrance, 500);
  }, 3200);
}
$("#skip-entrance").addEventListener("click", () => {
  finishEntrance();
  $("#roof-about").focus({ preventScroll: true });
});
$("#replay").addEventListener("click", () => {
  $("#atmosphere").classList.remove("open");
  $(".settings-toggle").setAttribute("aria-expanded", "false");
  if (controller.activeId) closeProject();
  window.scrollTo({ top: 0, behavior: "instant" });
  playEntrance();
});
function handleFailure(message) {
  fallback = true;
  document.body.classList.add("no-webgl");
  $("#scene-status").textContent =
    message ||
    "The 3D view is unavailable. Explore every exhibit using the index.";
  $("#doors").hidden = true;
  if (controller.state === "transition") controller.finish();
}
$(".nav-count").textContent = projects.length;
$("#collection-range").textContent = `01 — ${projects.length}`;
applyPreferences();
$("#year").textContent = new Date().getFullYear();
document.body.dataset.location = "courtyard";
const initialProject = projectFromHash(location.hash);
if (initialProject)
  openProject(initialProject.id, { fromRoute: true, animate: false });

try {
  const { GalleryScene } = await import("./scene.js");
  scene = new GalleryScene($("#scene"), projects, {
    onSelect: (id) => openProject(id),
    onHover: showLabel,
    onFailure: handleFailure,
    onGameButton: pressGameButton,
    onEnterRoom: enterGallery,
    onToggleCabinet: () => {
      cabinetOpen = !cabinetOpen;
      updateDoors();
    },
    onLocationChange: (location) => {
      document.body.dataset.location = location;
    },
    onFrame: ({ effect, strength, originX = 50, originY = 80 }) => {
      const overlay = $("#transition-effect");
      overlay.dataset.effect = effect || "";
      overlay.style.setProperty("--exhaust-x", `${originX}%`);
      overlay.style.setProperty("--exhaust-y", `${originY}%`);
      overlay.style.setProperty("--effect", Math.max(0, strength));
    },
  });
  scene.setAttendant(attendant);
  scene.setPreferences(preferences);
  if (initialProject) scene.snapInside();
  updateDoors();
  updateScroll();
} catch (error) {
  console.warn("Gallery fallback:", error);
  handleFailure();
}
// Start only after the renderer/import has finished, so setup cannot consume the opening.
if (!initialProject && preferences.motion) {
  await document.fonts?.ready;
  // Let shader compilation and the first canvas paint finish before starting the clock.
  await new Promise((resolve) =>
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)),
  );
  playEntrance();
}
$("#replay-roof").addEventListener("click", () => $("#replay").click());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) scene?.pause();
  else if (!fallback) scene?.resume();
});
// A small read-only diagnostics surface supports repeatable runtime QA.
window.galleryDiagnostics = () => ({
  state: controller.state,
  activeId: controller.activeId,
  webgl: !!scene && !fallback,
  objects: scene?.collection.exhibits.size || 0,
  preferences: { ...preferences },
  location: scene?.location || "fallback",
  entryProgress: scene?.entryProgress,
  cameraPosition: scene?.camera.position.toArray(),
  shelfPosition: scene?.collection.cabinet.position.toArray(),
  roofNavigation: scene
    ? {
        attached: scene.roofControls.isCSS3DObject,
        position: scene.roofControls.position.toArray(),
        visible: scene.roofControls.visible,
      }
    : null,
  vectorDrawing: scene?.vectorArtworkLoaded || false,
  wallIndex: scene
    ? {
        attached: scene.wallIndex.isCSS3DObject,
        position: scene.wallIndex.position.toArray(),
        visible: scene.wallIndex.visible,
      }
    : null,
  sunlight: scene
    ? {
        sky: scene.sky.visible,
        intensity: scene.sun.intensity,
        shadows: scene.renderer.shadowMap.enabled,
      }
    : null,
  nozzleWorld: scene?.nozzleWorld?.toArray() || null,
  smokeOrigin: scene?.smokeOrigin?.toArray() || null,
  effect: $("#transition-effect").dataset.effect,
  houseStage: scene?.houseStage || null,
  houseParts: scene
    ? (() => {
        const p = scene.collection.exhibits.get("house").userData.parts;
        return {
          blueprint: p.blueprint.visible,
          laser: p.scan.visible,
          house: p.house.visible,
          roof: p.roof.visible,
          chip: p.chip.visible,
          components: p.components.filter((c) => c.visible).length,
        };
      })()
    : null,
  drawCalls: scene?.renderer.info.render.calls,
  triangles: scene?.renderer.info.render.triangles,
  averageFps: scene?.frameTimes.length
    ? Math.round(
        1000 /
          (scene.frameTimes.reduce((a, b) => a + b, 0) /
            scene.frameTimes.length),
      )
    : null,
  architecture: scene
    ? {
        columns: scene.room.children.filter(
          (child) => child.name === "outer-column",
        ).length,
        pediment: !!scene.room.getObjectByName("triangular-pediment"),
        ornateFrame: !!scene.room.getObjectByName("ornate-gilt-portrait-frame"),
      }
    : null,
});
