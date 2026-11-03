# Make the gallery your own

## Start the website

Use Node.js 20.19+ or a newer supported LTS release.

```sh
npm ci
npm run dev
```

Open Vite's Local URL, usually `http://127.0.0.1:5173/`. The source entry point is `docs/index.html`; opening it directly as a file will not load the package imports. Stop the server with `Ctrl+C`.

In VS Code, use **Terminal → Run Build Task → Start gallery (Vite)**, then open `http://127.0.0.1:5173/`. Use this task instead of **Go Live / Live Server**: Live Server does not resolve the Three.js and Fontsource package imports. The Vite port is fixed, so a second server will report that the port is occupied instead of silently moving to a different URL. If a server is already running at the URL, use that server.

## Personalize the collection

Edit `docs/assets/js/catalogue.js`. Each entry supplies an ID, title, subtitle, category, summary, description, animation name, placeholder label, and optional links. Keep IDs stable to preserve shared URLs.

Replace instructional descriptions with actual project stories and set `placeholder` to `false` when ready. Add verified links like this:

```js
links: [
  {
    label: "Source code",
    href: "https://github.com/your-account/your-project",
  },
];
```

The template makes no award, performance, or competition-result claims. Descriptive labels stand in for handwritten project names that need confirmation. The introductory biography is in `docs/index.html`. The sculptural portrait is an original placeholder created in `buildRoom()` in `models.js`; replace it when you have a portrait to publish.

## Organization

- `docs/index.html`: page structure, introduction, atmosphere controls, and native project dialog.
- `docs/assets/css/`: colors, typography, entrance animation, and responsive layout.
- `docs/assets/js/catalogue.js`: editable project information.
- `docs/assets/js/models.js`: procedural room, cabinet, robotic arm, and thirteen object models.
- `docs/assets/js/scene.js`: rendering, camera movement, raycasting, weather, and object animations.
- `docs/assets/js/controller.js`: navigation states and transition cancellation.
- `docs/assets/js/main.js`: HTML interaction, fragment navigation, and scene integration.
- `docs/assets/js/preferences.js`: safe preference storage.
- `docs/assets/images/`: logo and future images.
- `docs/posts/`: space for future long-form content; no blog engine is included.

Fonts are bundled locally through Fontsource. The public site does not request a font CDN or any weather/location service.

## Controls

The top-right atmosphere control exposes Day/Night lighting, Clear/Cloudy/Rainstorm weather, Motion, and Replay entrance. The entrance lasts 2.7 seconds and plays once per session. Skip is immediately available. Reduced motion bypasses it by default.

Open the cabinet to select its objects directly, or use the thirteen-item collection index. Transitions last 1.5 seconds, with Skip and Cancel controls. Escape cancels a transition or closes a project. Closing restores focus to the corresponding index item. A URL such as `#project/sailbot` opens its project directly. Browser Back restores the previous view.

Storage denial does not prevent use. If WebGL is unavailable or its context is lost, the HTML index continues to work. JavaScript is required for project content; the introduction and GitHub contact remain available without it.

## Check and build

```sh
npm run check
npm test
npm run build
npm run preview
```

For actual browser rendering and interaction checks without opening your browser or VS Code:

```sh
npx playwright install chromium
npm run test:browser
```

This uses a separate headless Chromium instance with fresh browser contexts. Screenshots are saved under `artifacts/browser/screenshots/`; failure traces and an HTML report are saved under `artifacts/browser/`. The report is not opened automatically. The tests check real WebGL initialization, page errors, desktop/tablet/phone viewport layouts, all thirteen project dialogs, keyboard focus, and browser history. Browser installation and execution can require environment permission.

The deployable website is generated into `dist/`. Production preview usually runs at `http://127.0.0.1:4173/`. The 3D code loads separately from the HTML interaction layer, so the index is not dependent on renderer initialization.

## GitHub Pages

The Vite base is `/`, appropriate for `https://verybooter.github.io/`. Publish the **contents of `dist/`** with a build-based GitHub Pages workflow. Do not publish unbuilt `docs/` using a branch-folder configuration: its package imports require Vite.

No deployment workflow or repository setting is changed automatically. For a project-subdirectory host, update `base` in `vite.config.js`.

## Verification and diagnostics

Automated tests cover catalogue/model mapping, transition cancellation, preferences, and simulated HTML interaction without WebGL. DOM tests do not establish rendered browser behavior, GPU performance, or physical phone behavior.

For real-device review, inspect the entrance, cabinet, and dialogs on desktop, tablet, and phone screens. Open every exhibit, try rapid selection, use keyboard navigation, and change the atmosphere settings. Test a fresh browser session and a direct project URL.

In a browser console, `galleryDiagnostics()` reports navigation state, WebGL availability, object count, draw calls, triangles, and average frame rate over the last 180 visible frames. Performance targets are approximately 60 FPS on desktop and 30 FPS on a representative phone; these are targets, not measured claims. The renderer caps pixel ratio, disables shadows on narrow screens, and pauses in hidden tabs.
