# Personal website template

A responsive personal website built with HTML, CSS, and a small amount of JavaScript. There are no dependencies or build steps.

## Preview locally

Open `index.html` in your browser, or run this command from the repository root:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000>. Stop the server with `Ctrl+C`.

## Make it your own

1. In `index.html`, update the page title, description, introduction, and About section.
2. Replace both sample projects with your own titles, descriptions, and links. Remove their `Sample project` labels when the content is real.
3. Update the GitHub links if needed. To use email for contact, change the contact button's `href` to `mailto:your-address@example.com` and update its visible text.
4. In `styles.css`, edit the variables in `:root` to change the colors. The layout includes mobile styles and respects reduced-motion preferences.
5. Replace `favicon.svg` with your own icon if desired.

## File guide

- `index.html`: page content and semantic structure.
- `styles.css`: colors, typography, artwork, and responsive layout.
- `script.js`: automatic copyright year. The page also works with JavaScript disabled.
- `favicon.svg`: browser tab icon.

## GitHub Pages

The files are ready for a static host such as GitHub Pages. To deploy this repository, commit and push your changes, then configure GitHub Pages to deploy from the branch and root directory containing `index.html`. This template does not modify repository settings or publish itself.
