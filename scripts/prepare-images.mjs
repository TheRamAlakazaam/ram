#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const imageExtensions = new Set([
  ".avif",
  ".jpeg",
  ".jpg",
  ".png",
  ".tif",
  ".tiff",
  ".webp",
]);

const booleanFlags = new Set(["dry-run", "force", "help", "preserve-folders"]);

const usage = `Usage:
  npm run images:prep -- <input-dir> [options]

Options:
  --album <slug>          Put output in src/assets/images/photos/<slug>
  --output <dir>          Output directory (default: src/assets/images/photos)
  --max <pixels>          Long-edge resize limit (default: 1800)
  --quality <number>      WebP quality, 1-100 (default: 82)
  --preserve-folders      Mirror input subfolders inside the output directory
  --force                 Overwrite matching output filenames
  --dry-run               Process and report without writing files

Example:
  npm run images:prep -- ~/Pictures/exports --album new-york-city --max 1600 --quality 72
`;

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(usage);
  process.exit(0);
}

const [inputArg] = args._;

if (!inputArg) {
  console.error(usage);
  process.exit(1);
}

const cwd = process.cwd();
const inputRoot = path.resolve(cwd, inputArg);
const outputBase = path.resolve(
  cwd,
  String(args.output || "src/assets/images/photos"),
);
const album = args.album ? slugifyPathSegment(String(args.album)) : "";
const outputRoot = album ? path.join(outputBase, album) : outputBase;
const maxSize = parsePositiveInteger(args.max || 1800, "--max");
const quality = parseQuality(args.quality || 82);
const dryRun = Boolean(args["dry-run"]);
const force = Boolean(args.force);
const preserveFolders = Boolean(args["preserve-folders"]);

if (!(await pathExists(inputRoot))) {
  console.error(`Input directory does not exist: ${inputRoot}`);
  process.exit(1);
}

const inputFiles = (await findImages(inputRoot)).sort((a, b) =>
  a.localeCompare(b),
);

if (inputFiles.length === 0) {
  console.log(`No supported images found in ${inputRoot}`);
  process.exit(0);
}

const existingOutputHashes = await collectExistingOutputHashes(outputBase);
const seenInputHashes = new Map();
const seenOutputHashes = new Map();
const usedOutputPaths = new Set();
const writtenPaths = [];
const stats = {
  found: inputFiles.length,
  failed: 0,
  originalBytes: 0,
  outputBytes: 0,
  skippedDuplicateInput: 0,
  skippedDuplicateOutput: 0,
  written: 0,
};

console.log(
  `${dryRun ? "Checking" : "Preparing"} ${inputFiles.length} image(s) -> ${relativeToCwd(outputRoot)}`,
);
console.log(`Resize: ${maxSize}px long edge, WebP quality ${quality}`);

for (const inputPath of inputFiles) {
  try {
    const inputHash = await hashFile(inputPath);

    if (seenInputHashes.has(inputHash)) {
      stats.skippedDuplicateInput += 1;
      console.log(
        `skip duplicate source: ${relativeToCwd(inputPath)} matches ${relativeToCwd(
          seenInputHashes.get(inputHash),
        )}`,
      );
      continue;
    }

    seenInputHashes.set(inputHash, inputPath);

    const source = sharp(inputPath, { limitInputPixels: false });
    const metadata = await source.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("could not read image dimensions");
    }

    const outputBuffer = await sharp(inputPath, { limitInputPixels: false })
      .rotate()
      .resize({
        fit: "inside",
        height: maxSize,
        width: maxSize,
        withoutEnlargement: true,
      })
      .webp({ effort: 4, quality })
      .toBuffer();

    const outputHash = hashBuffer(outputBuffer);
    const existingDuplicate =
      existingOutputHashes.get(outputHash) || seenOutputHashes.get(outputHash);

    if (existingDuplicate) {
      stats.skippedDuplicateOutput += 1;
      console.log(
        `skip duplicate output: ${relativeToCwd(inputPath)} matches ${relativeToCwd(
          existingDuplicate,
        )}`,
      );
      continue;
    }

    const outputDirectory = getOutputDirectory(inputPath);
    const outputPath = await getAvailableOutputPath(
      outputDirectory,
      `${slugifyPathSegment(path.basename(inputPath, path.extname(inputPath)))}.webp`,
    );
    const inputStat = await fs.stat(inputPath);
    stats.originalBytes += inputStat.size;
    stats.outputBytes += outputBuffer.length;
    stats.written += 1;
    seenOutputHashes.set(outputHash, outputPath);
    writtenPaths.push(outputPath);

    const message = `${relativeToCwd(inputPath)} ${metadata.width}x${metadata.height} ${formatBytes(
      inputStat.size,
    )} -> ${relativeToCwd(outputPath)} ${formatBytes(outputBuffer.length)}`;

    if (dryRun) {
      console.log(`would write: ${message}`);
      continue;
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, outputBuffer);
    console.log(`wrote: ${message}`);
  } catch (error) {
    stats.failed += 1;
    console.error(
      `failed: ${relativeToCwd(inputPath)} - ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

console.log("");
console.log(`Found: ${stats.found}`);
console.log(`${dryRun ? "Would write" : "Wrote"}: ${stats.written}`);
console.log(`Skipped duplicate sources: ${stats.skippedDuplicateInput}`);
console.log(`Skipped duplicate outputs: ${stats.skippedDuplicateOutput}`);
console.log(
  `Size: ${formatBytes(stats.originalBytes)} -> ${formatBytes(stats.outputBytes)}`,
);

const cmsPaths = writtenPaths.map(toCmsPath).filter(Boolean);

if (cmsPaths.length > 0) {
  console.log("");
  console.log("Gallery paths:");
  for (const cmsPath of cmsPaths) {
    console.log(`  - ${cmsPath}`);
  }
}

if (stats.failed > 0) {
  process.exitCode = 1;
}

function parseArgs(argv) {
  const parsed = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "-h" || arg === "--help") {
      parsed.help = true;
      continue;
    }

    if (!arg.startsWith("--")) {
      parsed._.push(arg);
      continue;
    }

    const equalsIndex = arg.indexOf("=");
    const key =
      equalsIndex === -1 ? arg.slice(2) : arg.slice(2, equalsIndex).trim();
    const inlineValue =
      equalsIndex === -1 ? undefined : arg.slice(equalsIndex + 1);

    if (booleanFlags.has(key)) {
      parsed[key] = true;
      continue;
    }

    const nextValue = inlineValue ?? argv[index + 1];

    if (!nextValue || nextValue.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    parsed[key] = nextValue;

    if (inlineValue === undefined) {
      index += 1;
    }
  }

  return parsed;
}

function parsePositiveInteger(value, flag) {
  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }

  return parsed;
}

function parseQuality(value) {
  const parsed = parsePositiveInteger(value, "--quality");

  if (parsed > 100) {
    throw new Error("--quality must be between 1 and 100");
  }

  return parsed;
}

async function findImages(directory) {
  const images = [];

  for await (const filePath of walk(directory)) {
    if (imageExtensions.has(path.extname(filePath).toLowerCase())) {
      images.push(filePath);
    }
  }

  return images;
}

async function* walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      yield* walk(entryPath);
      continue;
    }

    if (entry.isFile()) {
      yield entryPath;
    }
  }
}

async function collectExistingOutputHashes(directory) {
  const hashes = new Map();

  if (!(await pathExists(directory))) {
    return hashes;
  }

  for await (const filePath of walk(directory)) {
    if (path.extname(filePath).toLowerCase() !== ".webp") {
      continue;
    }

    hashes.set(await hashFile(filePath), filePath);
  }

  return hashes;
}

function getOutputDirectory(inputPath) {
  if (!preserveFolders) {
    return outputRoot;
  }

  const relativeDirectory = path.dirname(path.relative(inputRoot, inputPath));

  if (relativeDirectory === ".") {
    return outputRoot;
  }

  return path.join(outputRoot, relativeDirectory);
}

async function getAvailableOutputPath(directory, filename) {
  const parsed = path.parse(filename);
  let counter = 1;
  let outputPath = path.join(directory, filename);

  while (
    !force &&
    (usedOutputPaths.has(outputPath) || (await pathExists(outputPath)))
  ) {
    counter += 1;
    outputPath = path.join(directory, `${parsed.name}-${counter}${parsed.ext}`);
  }

  usedOutputPaths.add(outputPath);
  return outputPath;
}

async function hashFile(filePath) {
  const hash = createHash("sha256");

  await new Promise((resolve, reject) => {
    createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", resolve);
  });

  return hash.digest("hex");
}

function hashBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function slugifyPathSegment(value) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "image";
}

function relativeToCwd(filePath) {
  const relativePath = path.relative(cwd, filePath) || ".";
  return relativePath.startsWith("..") ? filePath : relativePath;
}

function toCmsPath(filePath) {
  const relativePath = path.relative(cwd, filePath).split(path.sep).join("/");

  if (relativePath.startsWith("src/assets/images/")) {
    return `/${relativePath}`;
  }

  return "";
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}
