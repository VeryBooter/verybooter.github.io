import { readdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
function check(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) check(path);
    else if (/\.(m?js)$/.test(entry.name))
      execFileSync(process.execPath, ["--check", path], { stdio: "inherit" });
  }
}
for (const folder of ["docs/assets/js", "scripts", "test", "e2e"]) check(folder);
for (const config of ["vite.config.js", "playwright.config.js"])
  execFileSync(process.execPath, ["--check", config], { stdio: "inherit" });
console.log("JavaScript syntax checks passed.");
