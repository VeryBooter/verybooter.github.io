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
const controller = new GalleryController({
  onChange(state, id) {
    document.body.dataset.state = state;
    $("#transition").hidden = state !== "transition";
    if (state === "transition") {
      $("#transition-title").textContent = getProject(id).title;
      scene?.select(id, preferences.motion);
      $("#skip-transition").focus({ preventScroll: true });
    }
    if (state === "detail") {
      $("#transition").hidden = true;
      scene?.reset();
      renderDetail(getProject(id));
      if (!dialog.open) dialog.showModal();
      $("#close-detail").focus({ preventScroll: true });
    }
    if (state === "gallery") {
      if (dialog.open) dialog.close();
      scene?.reset();
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
  index.append(button);
}
function showLabel(id) {
  const label = $("#object-label");
  label.hidden = !id;
  if (id)
    label.textContent = `${getProject(id).number} / ${getProject(id).title}`;
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
  if (dialog.open) dialog.close();
  if (controller.state !== "transition")
    previousFocus = document.activeElement?.matches("[data-project]")
      ? document.activeElement
      : index.querySelector(`[data-project="${id}"]`);
  cabinetOpen = true;
  updateDoors();
  gallery.scrollIntoView({ behavior: "instant", block: "start" });
  updateScroll();
  if (!fromRoute) {
    history.pushState({ galleryProject: true }, "", `#project/${id}`);
    routeOwned = true;
  } else routeOwned = false;
  controller.select(id, animate && preferences.motion && !fallback);
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
$("#back-gallery").addEventListener("click", closeProject);
$("#skip-transition").addEventListener("click", () => controller.finish());
$("#cancel-transition").addEventListener("click", closeProject);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (controller.state === "transition") closeProject();
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
  $("#weather").value = preferences.weather;
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
$("#weather").addEventListener("change", (e) => {
  preferences.weather = e.target.value;
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
  for (const target of [$(".site-header"), $("#atmosphere"), $("main")])
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
  if (restoreFocus) $(".brand").focus({ preventScroll: true });
}
function playEntrance() {
  if (!preferences.motion) return;
  clearTimeout(entranceTimer);
  clearTimeout(entranceHideTimer);
  entrance.hidden = false;
  entrance.classList.remove("leaving");
  setEntranceInert(true);
  controller.change("entrance");
  const svg = entrance.querySelector("svg");
  const replacement = svg.cloneNode(true);
  svg.replaceWith(replacement);
  $("#skip-entrance").focus({ preventScroll: true });
  entranceTimer = setTimeout(() => {
    entrance.classList.add("leaving");
    entranceHideTimer = setTimeout(finishEntrance, 500);
  }, 2200);
}
$("#skip-entrance").addEventListener("click", () => {
  finishEntrance();
  $(".brand").focus({ preventScroll: true });
});
$("#replay").addEventListener("click", () => {
  $("#atmosphere").classList.remove("open");
  $(".settings-toggle").setAttribute("aria-expanded", "false");
  if (dialog.open) closeProject();
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
applyPreferences();
$("#year").textContent = new Date().getFullYear();
const initialProject = projectFromHash(location.hash);
if (initialProject)
  openProject(initialProject.id, { fromRoute: true, animate: false });
else if (preferences.motion && safeRead(session, "gallery.entered") !== "yes")
  playEntrance();
try {
  const { GalleryScene } = await import("./scene.js");
  scene = new GalleryScene($("#scene"), projects, {
    onSelect: (id) => openProject(id),
    onHover: showLabel,
    onFailure: handleFailure,
    onFrame: ({ effect, strength }) => {
      $("#scene").style.filter =
        effect === "arrow" ? `sepia(${strength * 0.5})` : "";
      $("#scene").style.clipPath =
        effect === "aperture"
          ? `circle(${100 - strength * 65}% at 50% 50%)`
          : effect === "arrow"
            ? `inset(0 ${strength * 100}% 0 0)`
            : "";
    },
  });
  scene.setPreferences(preferences);
  updateDoors();
  updateScroll();
} catch (error) {
  console.warn("Gallery fallback:", error);
  handleFailure();
}
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
  drawCalls: scene?.renderer.info.render.calls,
  triangles: scene?.renderer.info.render.triangles,
  averageFps: scene?.frameTimes.length
    ? Math.round(
        1000 /
          (scene.frameTimes.reduce((a, b) => a + b, 0) /
            scene.frameTimes.length),
      )
    : null,
});
