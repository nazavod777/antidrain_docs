import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VITEPRESS_ROOT = fileURLToPath(new URL("../", import.meta.url));
const DIST_ROOT = path.join(VITEPRESS_ROOT, "dist");
const EMPTY_VP_ICONS_PATH = path.join(DIST_ROOT, "vp-icons.css");

const MAC_PLATFORM_TEST_PATTERN = /\/Mac\|iPhone\|iPod\|iPad\/i\.test\(navigator\.platform\)/gu;
const MAC_PLATFORM_TEST_REPLACEMENT =
  `/Mac|iPhone|iPod|iPad/i.test(` +
  `(navigator.userAgentData&&typeof navigator.userAgentData.platform==="string"` +
  `?navigator.userAgentData.platform:navigator.platform||navigator.userAgent||""))`;

export function stripVpIconsPreload(html: string) {
  return html.replace(
    /\s*<link rel="preload stylesheet" href="\/vp-icons\.css" as="style">\s*/gu,
    "\n"
  );
}

export function rewriteMacPlatformProbe(html: string) {
  return html.replace(MAC_PLATFORM_TEST_PATTERN, MAC_PLATFORM_TEST_REPLACEMENT);
}

export function runDocsBuildPostprocess() {
  if (!fs.existsSync(DIST_ROOT)) {
    return;
  }

  if (fs.existsSync(EMPTY_VP_ICONS_PATH) && fs.statSync(EMPTY_VP_ICONS_PATH).size === 0) {
    fs.rmSync(EMPTY_VP_ICONS_PATH);
  }
}

