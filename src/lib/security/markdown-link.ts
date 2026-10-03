/** Allows in-app seek anchors and http(s) links only (blocks javascript:, data:, etc.). */
export function sanitizeMarkdownHref(href: string | undefined): string | undefined {
  if (!href) return undefined;
  if (href.startsWith("#seek-")) return href;
  try {
    const url = new URL(href);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}
