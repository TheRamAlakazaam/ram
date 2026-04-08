const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export function safeHref(value: string, fallback = "#") {
  const href = value.trim();

  if (!href) {
    return fallback;
  }

  if (href.startsWith("/") && !href.startsWith("//")) {
    return href;
  }

  try {
    const url = new URL(href);
    return SAFE_PROTOCOLS.has(url.protocol) ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}
