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

The template makes no award, performance, or competition-result claims. Descriptive labels stand in for handwritten project names that need confirmation. The introductory biography is in `docs/index.html`. The sculptural portrait is an original placeholder created in `building.js`; replace it when you have a portrait to publish.

## Organization

- `docs/index.html`: page structure, introduction, atmosphere controls, and native project dialog.
- `docs/assets/css/`: colors, typography, entrance animation, and responsive layout.
- `docs/assets/js/catalogue.js`: editable project information.
- `docs/assets/js/building.js`: the courtyard, roof, hinged entrance, and enclosed gallery room.
- `docs/assets/js/models.js`: procedural cabinet, robotic arm, and twelve object models.
- `docs/assets/js/scene.js`: rendering, camera movement, raycasting, weather, and object animations.
- `docs/assets/js/controller.js`: navigation states and transition cancellation.
- `docs/assets/js/main.js`: HTML interaction, fragment navigation, and scene integration.
- `docs/assets/js/preferences.js`: safe preference storage.
- `docs/assets/images/`: logo and future images.
- `docs/posts/`: space for future long-form content; no blog engine is included.

Fonts are bundled locally through Fontsource. The public site does not request a font CDN or any weather/location service.

## Controls

Clear, Cloudy, and Rainstorm SVG icons select weather directly on the rectangular roof beam. A moon icon opens lighting and motion settings, and a replay icon restarts the entrance. The entrance starts after scene initialization, lasts 3.7 seconds, and plays on each ordinary page load. Skip is immediately available. Reduced motion bypasses it by default.

Open the cabinet to select its objects directly, or use the twelve-item collection index. Most transitions last 1.5 seconds, with Skip and Cancel controls. MIPS home design uses a nine-second sequence: the robot picks up a blueprint, laser-scans it, the blueprint dissolves, house components assemble, a chip emerges from the shelf and is installed by the robot, and the roof arrives last. The mug presentation lasts 2.6 seconds and includes rising steam. Photography and the lamp are effects only, and the original face drawing is displayed directly without a story dialog. The smart-house exhibit supports house/chip inspection; the game controller opens its story after a button press. Escape cancels a transition or closes a project. Closing restores focus to the corresponding index item. A URL such as `#project/sailbot` opens its project directly. Browser Back restores the previous view.

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

This starts a dedicated Vite test server on port 5174 and uses a separate headless Chromium instance with fresh browser contexts. Screenshots are saved under `artifacts/browser/screenshots/`; failure traces and an HTML report are saved under `artifacts/browser/`. The report is not opened automatically. The tests check real WebGL initialization, page errors, desktop/tablet/phone viewport layouts, the twelve exhibits and their distinct presentation modes, keyboard focus, and browser history. Browser installation and execution can require environment permission.

The deployable website is generated into `dist/`. Production preview usually runs at `http://127.0.0.1:4173/`. The 3D code loads separately from the HTML interaction layer, so the index is not dependent on renderer initialization.

## GitHub Pages

The Vite base is `/`, appropriate for `https://verybooter.github.io/`. Publish the **contents of `dist/`** with a build-based GitHub Pages workflow. Do not publish unbuilt `docs/` using a branch-folder configuration: its package imports require Vite.

The deployment workflow is `.github/workflows/deploy.yml`. It installs dependencies, checks JavaScript, builds the gallery, and publishes only `dist/` whenever changes are pushed to `main`. It can also be started manually from the Actions tab.

In the repository's **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**. This is a one-time repository setting; the workflow file alone does not switch a branch-based Jekyll site to Actions. After pushing, check **Actions → Deploy gallery to GitHub Pages** for a successful deployment, then open `https://verybooter.github.io/`.

For a project-subdirectory host, update `base` in `vite.config.js`.

## Verification and diagnostics

Automated tests cover catalogue/model mapping, transition cancellation, preferences, and simulated HTML interaction without WebGL. DOM tests do not establish rendered browser behavior, GPU performance, or physical phone behavior.

For real-device review, inspect the entrance, cabinet, and dialogs on desktop, tablet, and phone screens. Open every exhibit, try rapid selection, use keyboard navigation, and change the atmosphere settings. Test a fresh browser session and a direct project URL.

In a browser console, `galleryDiagnostics()` reports navigation state, WebGL availability, object count, draw calls, triangles, and average frame rate over the last 180 visible frames. Performance targets are approximately 60 FPS on desktop and 30 FPS on a representative phone; these are targets, not measured claims. The renderer caps pixel ratio, uses lower-resolution shadows on narrow screens, and pauses in hidden tabs.

### Walk-in building and revised effects

The courtyard roof has a triangular pediment above a rectangular beam. The mark appears on the triangle; About and Gallery replace the two Taichi eyes inside complementary halves that touch the rectangular beam’s top and bottom edges. Weather icons are on the left; Contact and the lighting/replay controls remain on the right. These are CSS3D elements attached to the rectangular beam. The doorway opens before the camera crosses the threshold and turns toward the cabinet inside. Use the return link to leave the room.

The entrance writes only KL with cursive SVG strokes inspired by the Mac handwriting animation. It then draws the inner circle, draws its diameter, slides the upper shell down and the lower shell up, holds the enlarged mark, and parts the clouds. Replay is available directly through the roof replay icon and through the lighting/motion panel. Reduced motion bypasses the entrance and object transitions.

`face-drawing.svg` preserves the 1,210 original filled vector segments from the supplied face PDF; SVGLoader tessellates those curves into scene geometry. There is no embedded raster image or manual trace. `scripts/extract-face.py` reproduces the extraction with PyMuPDF and records the source PDF SHA-256. `hackathon` remains the stable project URL identifier for Merry-Men. Rocket smoke starts at the transformed nozzle position. TNT uses two brief pure-white flashes followed by black block debris; Motion Off bypasses the effect. Popup close controls use red macOS-style circles with accessible labels.

`house-sequence.js` owns the MIPS construction timeline. House components and roof are separately modeled in `models.js`; `catalogue.js` sets the project transition duration. The `cooking` fragment remains stable but now presents a ceramic mug, drink surface, and animated steam.

The exhibit index is a small 01–12 plaque attached to the rear interior wall through CSS3DRenderer. Each number has a complete accessible project name, a native title, and a hover/focus label. On narrow screens the plaque sits above the cabinet. It remains an HTML grid when WebGL is unavailable.

`daylight.js` builds the outdoor atmospheric sky and directional sunlight, including a low-angle sun, blue sky fill, warm highlights, and shadow-map settings. Lighting blends back to the indoor profile while entering the building.
