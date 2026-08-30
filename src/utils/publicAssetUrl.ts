const storybookIframeSuffix = "/iframe.html";

export function publicAssetUrl(
  assetPath: string,
  pathname = typeof window === "undefined" ? "" : window.location.pathname,
) {
  const absoluteAssetPath = assetPath.startsWith("/")
    ? assetPath
    : `/${assetPath}`;

  if (!pathname.endsWith(storybookIframeSuffix)) {
    return absoluteAssetPath;
  }

  const storybookBasePath = pathname.slice(0, -storybookIframeSuffix.length);

  return `${storybookBasePath}${absoluteAssetPath}`;
}
