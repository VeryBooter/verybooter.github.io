import { mkdir, copyFile } from "node:fs/promises";
// A second address for the same single-page application; assets stay shared at /assets/.
await mkdir(new URL("../dist/personal-website/", import.meta.url), {
  recursive: true,
});
await copyFile(
  new URL("../dist/index.html", import.meta.url),
  new URL("../dist/personal-website/index.html", import.meta.url),
);
