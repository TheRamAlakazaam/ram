import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const astroPackagePath = require.resolve("astro/package.json");
const packageJson = JSON.parse(await readFile(astroPackagePath, "utf8"));

if (
  packageJson.exports?.["./assets/fonts/runtime.js"] &&
  !packageJson.exports?.["./assets/fonts/runtime"]
) {
  packageJson.exports["./assets/fonts/runtime"] =
    packageJson.exports["./assets/fonts/runtime.js"];

  await writeFile(
    astroPackagePath,
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );
}
