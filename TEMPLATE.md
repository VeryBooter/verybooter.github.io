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

The introductory biography is in `docs/index.html`. The supplied oil portrait is displayed in the gilt frame; its head-to-belly crop is controlled by the texture repeat and offset in `scene.js`, preserving the original image file.

## Organization

- `docs/index.html`: page structure, introduction, atmosphere controls, and native project dialog.
- `docs/assets/css/`: colors, typography, entrance animation, and responsive layout.
- `docs/assets/js/catalogue.js`: editable project information.
- `docs/assets/js/building.js`: the courtyard, roof, hinged entrance, and enclosed gallery room.
- `docs/assets/js/models.js`: procedural cabinet, robotic arm, and twelve object models.
- `docs/assets/js/scene.js`: rendering, camera movement, raycasting, weather, and object animations.
- `docs/assets/js/attendants.js`: articulated attendants, clothing, presentation props, running, crouching, two-bone reaching, and the toss gesture.
- `docs/assets/js/interior.js`: panoramic room mirror, projector, and folded mirror-array light path.
- `docs/assets/js/projector.js`: presentation slide assets and playback controls.
- `docs/assets/js/room-views.js`: cabinet, opposite-wall presentation, and bulletin-board viewpoints.
- `docs/assets/js/space-catalogue.js`: the fourteen map destinations and their labels.
- `docs/assets/js/spaces.js`: lazily constructed house, art, outdoor, and work spaces.
- `docs/assets/js/weather.js`: opaque cartoon clouds with continuous drift.
- `docs/assets/video/lens-dwellers.mp4`: the browser-ready film used by the cinema.
- `docs/assets/js/controller.js`: navigation states and transition cancellation.
- `docs/assets/js/main.js`: HTML interaction, fragment navigation, and scene integration.
- `docs/assets/js/preferences.js`: safe preference storage.
- `docs/assets/images/`: logo and future images.
- `docs/posts/`: space for future long-form content; no blog engine is included.

Fonts are bundled locally through Fontsource. The public site does not request a font CDN or any weather/location service.

## Controls

The courtyard is the initial view, with house navigation at the top. The marked weather controls, contact shortcut, and replay buttons are hidden. Lighting and motion settings remain available. The opening's code and artwork are preserved but disabled; no opening timer or font wait runs during startup.

Choose Cabinet or enter through the door to visit the gallery. Use its objects or the numbered index. All exhibit sequences last 750 ms, including the accelerated MIPS build, archer, and mug effects. The MIPS stages still preserve blueprint pickup, laser scan, wall assembly, chip insertion, and roof placement. Photography, the lamp, and mug are effects without a dialog; the drawing stays in the scene with a close button. Escape cancels a transition or closes an exhibit. Closing restores focus to the corresponding index item. Project links such as `#project/sailbot` bypass the opening and open the story directly.

Storage denial does not prevent use. If WebGL is unavailable or its context is lost, the HTML index continues to work. JavaScript is required for project content; the introduction and GitHub contact remain available without it.

Attendants run to the shelf, retrieve an item, and toss the scroll, tablet, or codex toward the viewer within the same 750 ms timeline. Jointed knees and elbows, shelf reaching, and crouching remain. The archer still draws and releases the arrow.

The top navigation switches between the cabinet, the presentation on the opposite wall, the portrait bulletin board, the house map, and the courtyard. Room changes use a short camera turn; the framed portrait remains on the bulletin board. The courtyard contact sign contains the supplied LinkedIn, GitHub, and email links. Kevin and Li flank the unchanged central pediment mark.

## House map and spaces

The main map contains exactly Gallery, Workshop, Museum, Light room, Benedum Hall, Bellefield/Pitt SCI, and SailBot. The separate `/personal-website/` collection contains Kitchen, Library, Garden, Little farmland, Cinema, Music studio, and Dressing room. Each collection has seven rooms; cross-collection room links redirect to the correct address. The personal collection opens in the Library. Rooms are built on first visit and hidden when inactive. Each room has a return route; the panel provides keyboard-accessible object selection and look-around controls. Fridge and wardrobe doors open, the music keys play a short synthesized note, museum paintings move along the wall, and the garden fountain and rotating studies animate when motion is enabled.

The campus buildings and museum artifacts are stylized interpretations, not measured architectural replicas or engineering specifications. The Benedum entry moves through its doorway before transferring to the SailBot workshop. SailBot links point to the existing PittSailbot repository and website; VoxelCraft links to the supplied local repository's GitHub remote. Direct room URLs such as `#room/library` work without the opening animation.

## Lens Dwellers cinema

The supplied master is `docs/assets/video/Lens Dwellers (Pitt 24 Hr Film Challenge).mov`: 4K HEVC with AAC audio, 155.99 seconds. It remains local and is ignored by Git because it exceeds GitHub's ordinary file limit. The cinema publishes the H.264/AAC 1920×1080 MP4 `docs/assets/video/lens-dwellers.mp4` (about 40.1 MiB). The current MP4 in the checkout is 113.844 seconds; it differs from the original master. A Three.js video texture displays it on the cinema screen. Play/Pause and native video controls are available, and leaving the cinema pauses playback. The film is loaded on visiting the cinema rather than during the gallery opening.

To regenerate the browser copy after replacing the master, remove or rename the old generated MP4, then run `bash scripts/prepare-film.sh` with ffmpeg installed. The script does not overwrite an existing output automatically.

## Projector presentation

The projector displays the two pages of `docs/assets/images/PPT.pdf` as faithful PNG renders, preserving the PDF's graphics and typography. Previous/next buttons change slides; Play/Pause advances them every five seconds. The mirror array and visible light path remain aligned with the screen on desktop and compact layouts.

To replace the deck, replace the PDF and regenerate the images. On macOS:

```sh
swift scripts/render-slides.swift
```

Then update the slide entries and accessible descriptions in `docs/assets/js/projector.js` if the page count or content changed. Other platforms can export PDF pages to `docs/assets/images/projector/slide-01.png`, `slide-02.png`, and so on. The website uses these rendered pages; it does not run a native PowerPoint player.

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

The opening combines the KL monogram and theta-style logo in one composition. Its container occupies 75% of viewport area, and the outer halves rotate in opposite directions over 400 ms. The stem ends at the upper arc. The complete opening ends at 450 ms; reduced motion bypasses it and still enters the room with the cabinet open. This opening is now archived: its HTML, CSS, and JavaScript remain, but `OPENING_ENABLED` is false, startup bypasses it, and both replay buttons are hidden and disabled. The courtyard is the initial page.

`face-drawing.svg` preserves the 1,210 original filled vector segments from the supplied face PDF; SVGLoader tessellates those curves into scene geometry. There is no embedded raster image or manual trace. `scripts/extract-face.py` reproduces the extraction with PyMuPDF and records the source PDF SHA-256. `hackathon` remains the stable project URL identifier for Merry-Men. Rocket smoke starts at the transformed nozzle position. TNT uses two brief pure-white flashes followed by black block debris; Motion Off bypasses the effect. Popup close controls use red macOS-style circles with accessible labels.

`house-sequence.js` owns the MIPS construction timeline. House components and roof are separately modeled in `models.js`; `catalogue.js` sets the project transition duration. The `cooking` fragment remains stable but now presents a ceramic mug, drink surface, and animated steam.

The exhibit index is a small 01–12 plaque attached to the rear interior wall through CSS3DRenderer. Each number has a complete accessible project name, a native title, and a hover/focus label. On narrow screens the plaque sits above the cabinet. It remains an HTML grid when WebGL is unavailable.

`daylight.js` builds the outdoor atmospheric sky and directional sunlight, including a low-angle sun, blue sky fill, warm highlights, and shadow-map settings. Lighting blends back to the indoor profile while entering the building.

### Mirror capture and performance

`mirror-capture.js` bakes the convex mirror after entry completes, rendering at most one cube face per animation frame. Two cube targets keep the displayed reflection complete while the next six faces render. Door movement, exhibit animations, atmosphere changes, asset loads, and resizing invalidate the reflection. An update that arrives during a capture schedules another complete capture so the final pose is retained. Idle rooms perform no reflection renders; retained inspections stop invalidating when their animation finishes.

`galleryDiagnostics().mirror` exposes `baked`, `dirty`, `pendingFace`, `facesRendered`, `captures`, and `lastFaceMs`. `galleryDiagnostics().frameTimes` contains recent frame intervals. The mirror browser test records six seconds of real animation-frame timing and the GPU renderer in `artifacts/browser/mirror-profile.json`; it also checks idle capture counts and door, daylight, and exhibit invalidation. To measure on installed Chrome with hardware acceleration:

```sh
PLAYWRIGHT_CHANNEL=chrome npm run test:browser -- e2e/mirror.spec.js --headed
```

Keep the browser foregrounded during measurement. Software rendering (such as SwiftShader), background tabs, and concurrent workloads are not representative GPU performance measurements. The test reports timing rather than imposing a machine-dependent FPS assertion. On the November 5, 2026 Apple M1 Pro Chrome run at 1440×900, the idle sample contained 720 frames: median 8.3 ms, p95 9.2 ms, maximum 9.4 ms, and zero additional mirror captures. This establishes the under-18-ms idle target on that configuration, not on every device.

A November 6 production-build comparison used three alternating trials per version on the same Apple M1 Pro, Chrome, and 1440×900 viewport. Across all samples, before → after average FPS was 119.9 → 118.7 idle, 119.5 → 119.9 while opening cabinet doors, and 100.4 → 110.6 while opening the drawing. These include isolated stalls; they do not demonstrate a general average-FPS improvement. The optimized idle sample had one 307.9 ms outlier, and first drawing activation stalled in both builds. A subsequent traced run of the optimized build measured 30 seconds idle, 3 seconds of door movement, and 5 seconds of drawing activation, with all sampled intervals below 18 ms (maxima 16.6, 9.4, and 9.4 ms respectively). Idle capture count stayed fixed at one completed cube. The recurring mirror workload is eliminated, but isolated browser/first-use stalls are not ruled out. Raw comparison samples and the Chrome trace are saved locally under `artifacts/browser/mirror-comparison.json` and `artifacts/browser/mirror-performance-trace.json`.

The front-page revision hides the marked weather/contact/replay roof controls, introductory achievement text and lower labels. House navigation is at the top; the introduction and contact sign use separate responsive positions.

## Single-viewport navigation and selectable text

The house no longer uses three stacked scrolling sections. Room buttons and the entrance change scene state inside one viewport; the mouse wheel cannot move between rooms. Text panels accept ordinary browser selection and copy. Canvas illustrations and video frames remain image content; presentation titles and descriptions are duplicated beneath each slide as selectable HTML, and room object names are also available as selectable HTML in the object list.

The exterior camera faces the facade straight on without pitch, yaw, or roll. The sky uses a radiant sun with rays in light mode and a crescent moon in dark mode.

`npm run build` produces the main entry and `dist/personal-website/index.html`, sharing the same hashed assets. The existing GitHub Pages workflow deploys both addresses in one artifact. The room split is defined in `space-catalogue.js`.
