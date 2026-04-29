// @ts-check
import path from "node:path";
import { fileURLToPath, URL } from "node:url";

import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import robotsTxt from "astro-robots-txt";
import { loadEnv } from "vite";

const { SITE_URL, APP_ENV } = loadEnv(
  process.env.NODE_ENV || "development",
  process.cwd(),
  "",
);
const srcAssetsDir = fileURLToPath(new URL("./src/assets/", import.meta.url));

/**
 * @typedef {{
 *   path?: string;
 *   history?: string[];
 * }} VFileLike
 *
 * @typedef {{
 *   type?: string;
 *   url?: string;
 *   children?: unknown[];
 *   data?: {
 *     hProperties?: Record<string, unknown>;
 *   };
 * }} MarkdownNode
 */

/** @param {VFileLike | undefined} file */
function getVFilePath(file) {
  const filePath = file?.path || file?.history?.[0];

  if (typeof filePath !== "string") {
    return "";
  }

  return filePath.startsWith("file:") ? fileURLToPath(filePath) : filePath;
}

/**
 * @param {unknown} node
 * @param {(node: MarkdownNode & { url: string }) => void} callback
 */
function visitImageNodes(node, callback) {
  if (!node || typeof node !== "object") {
    return;
  }

  const markdownNode = /** @type {MarkdownNode} */ (node);

  if (markdownNode.type === "image" && typeof markdownNode.url === "string") {
    callback(/** @type {MarkdownNode & { url: string }} */ (markdownNode));
  }

  if (!Array.isArray(markdownNode.children)) {
    return;
  }

  for (const child of markdownNode.children) {
    visitImageNodes(child, callback);
  }
}

function remarkLocalAssetImages() {
  /**
   * @param {MarkdownNode} tree
   * @param {VFileLike} file
   */
  return (tree, file) => {
    const markdownFilePath = getVFilePath(file);

    if (!markdownFilePath) {
      return;
    }

    visitImageNodes(tree, (node) => {
      const decodedUrl = decodeURI(node.url);
      const suffixMatch = decodedUrl.match(/([?#].*)$/);
      const suffix = suffixMatch?.[0] || "";
      const pathname = suffix
        ? decodedUrl.slice(0, -suffix.length)
        : decodedUrl;
      const assetMatch = pathname.match(/^\/(?:src\/)?assets\/(.+)$/);

      if (!assetMatch) {
        return;
      }

      const assetPath = assetMatch[1];

      if (!assetPath) {
        return;
      }

      const absoluteAssetPath = path.join(srcAssetsDir, assetPath);
      const relativeAssetPath = path
        .relative(path.dirname(markdownFilePath), absoluteAssetPath)
        .split(path.sep)
        .join("/");
      const relativeAssetUrl = relativeAssetPath.startsWith(".")
        ? relativeAssetPath
        : `./${relativeAssetPath}`;

      node.url = `${relativeAssetUrl}${suffix}`;
      const data = (node.data ??= {});
      const hProperties = (data.hProperties ??= {});

      hProperties.loading ??= "lazy";
      hProperties.decoding ??= "async";
      hProperties.sizes ??= "(min-width: 900px) 68ch, calc(100vw - 2rem)";
      hProperties.widths ??= [360, 540, 720, 960, 1200];
    });
  };
}

// https://astro.build/config
export default defineConfig({
  site: SITE_URL || "https://theramalakazaam.com",
  markdown: {
    remarkPlugins: [remarkLocalAssetImages],
  },
  integrations: [
    sitemap({
      changefreq: "monthly",
      priority: 0.7,
      lastmod: new Date(),
    }),
    robotsTxt({
      policy:
        APP_ENV === "production"
          ? [{ userAgent: "*", allow: "/" }]
          : [{ userAgent: "*", disallow: "/" }],
    }),
  ],
  vite: {
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
