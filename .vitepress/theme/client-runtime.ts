import type { Router } from "vitepress";
import { getScrollOffset, onContentUpdated } from "vitepress";
import { legacySlugifyHeading } from "../slug";
import { getCleanDocsPath } from "../support/clean-url";
import { getRedirectTargetPathname } from "../support/root-redirect";
import { initGlossaryLinkTooltip } from "./support/glossary-tooltip";
import { safeDecodeHashFragment } from "./support/safe-hash";

let isInstalled = false;
let routeSyncFrameId = 0;
let legacyHashFrameId = 0;
let curtainFrameId = 0;
let resizeObserver: ResizeObserver | null = null;
let mutationObserver: MutationObserver | null = null;
let trackedAside: HTMLElement | null = null;
let trackedAsideContent: HTMLElement | null = null;
let disposeGlossaryLinkTooltip: (() => void) | null = null;

function redirectCurrentRouteIfNeeded() {
  if (typeof window === "undefined") {
    return false;
  }

  const redirectTarget = getRedirectTargetPathname(window.location.pathname);

  if (redirectTarget) {
    window.location.replace(
      `${redirectTarget}${window.location.search}${window.location.hash}`
    );
    return true;
  }

  const cleanPath = getCleanDocsPath(window.location.pathname);

  if (!cleanPath || cleanPath === window.location.pathname) {
    return false;
  }

  window.location.replace(`${cleanPath}${window.location.search}${window.location.hash}`);
  return true;
}

function syncLegacyHash() {
  if (typeof window === "undefined") {
    return;
  }

  const currentHash = safeDecodeHashFragment(window.location.hash.slice(1));

  if (!currentHash || document.getElementById(currentHash)) {
    return;
  }

  const headings = document.querySelectorAll<HTMLElement>(".VPDoc :where(h1,h2,h3,h4,h5,h6)[id]");
  const headingIdsByLegacyHash = new Map<string, string>();
  const collisionIndexByLegacyHash = new Map<string, number>();

  for (const heading of headings) {
    const title = heading.textContent?.trim();

    if (!title) {
      continue;
    }

    const baseLegacyHash = legacySlugifyHeading(title);
    const collisionIndex = collisionIndexByLegacyHash.get(baseLegacyHash) ?? 0;
    const fullLegacyHash = collisionIndex === 0 ? baseLegacyHash : `${baseLegacyHash}-${collisionIndex}`;

    collisionIndexByLegacyHash.set(baseLegacyHash, collisionIndex + 1);

    if (!headingIdsByLegacyHash.has(fullLegacyHash)) {
      headingIdsByLegacyHash.set(fullLegacyHash, heading.id);
    }
  }

  const headingId = headingIdsByLegacyHash.get(currentHash);

  if (!headingId) {
    return;
  }

  const heading = document.getElementById(headingId);

  if (!heading) {
    return;
  }

  const nextHash = `#${heading.id}`;
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}${nextHash}`
  );

  const nextTop = heading.getBoundingClientRect().top + window.scrollY - getScrollOffset() + 1;
  window.scrollTo({ top: Math.max(0, nextTop) });
}

function resolveAsideElements() {
  return {
    aside: document.querySelector<HTMLElement>(".VPDoc .aside-container"),
    asideContent: document.querySelector<HTMLElement>(".VPDoc .aside-content"),
    curtain: document.querySelector<HTMLElement>(".VPDoc .aside-curtain"),
  };
}

function detachCurtainObservers() {
  if (trackedAside) {
    trackedAside.removeEventListener("scroll", scheduleCurtainSync);
    trackedAside = null;
  }

  trackedAsideContent = null;
  resizeObserver?.disconnect();
  resizeObserver = null;
  mutationObserver?.disconnect();
  mutationObserver = null;
}

function syncCurtainState() {
  const { aside, curtain } = resolveAsideElements();

  if (!curtain) {
    return;
  }

  if (!aside) {
    curtain.dataset.visible = "false";
    return;
  }

  const hasOverflow = aside.scrollHeight - aside.clientHeight > 1;
  const hasMoreBelow = aside.scrollTop + aside.clientHeight < aside.scrollHeight - 1;
  curtain.dataset.visible = hasOverflow && hasMoreBelow ? "true" : "false";
}

function syncCurtainObservedTargets() {
  const { aside, asideContent } = resolveAsideElements();

  if (!aside) {
    detachCurtainObservers();
    return;
  }

  if (trackedAside === aside && trackedAsideContent === asideContent) {
    return;
  }

  detachCurtainObservers();
  trackedAside = aside;
  trackedAsideContent = asideContent;
  trackedAside.addEventListener("scroll", scheduleCurtainSync, { passive: true });

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(scheduleCurtainSync);
    resizeObserver.observe(aside);

    if (asideContent) {
      resizeObserver.observe(asideContent);
    }
  }

  if (typeof MutationObserver !== "undefined" && asideContent) {
    mutationObserver = new MutationObserver(scheduleCurtainSync);
    mutationObserver.observe(asideContent, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
}

function scheduleLegacyHashSync() {
  if (typeof window === "undefined") {
    return;
  }

  if (legacyHashFrameId) {
    window.cancelAnimationFrame(legacyHashFrameId);
  }

  legacyHashFrameId = window.requestAnimationFrame(() => {
    legacyHashFrameId = 0;
    syncLegacyHash();
  });
}

function scheduleCurtainSync() {
  if (typeof window === "undefined") {
    return;
  }

  if (curtainFrameId) {
    window.cancelAnimationFrame(curtainFrameId);
  }

  curtainFrameId = window.requestAnimationFrame(() => {
    curtainFrameId = 0;
    syncCurtainObservedTargets();
    syncCurtainState();
  });
}

function scheduleRouteSync() {
  if (typeof window === "undefined") {
    return;
  }

  if (routeSyncFrameId) {
    window.cancelAnimationFrame(routeSyncFrameId);
  }

  routeSyncFrameId = window.requestAnimationFrame(() => {
    routeSyncFrameId = 0;
    scheduleLegacyHashSync();
    scheduleCurtainSync();
  });
}

export function installDocsClientRuntime(router: Router) {
  if (typeof window === "undefined" || isInstalled) {
    return;
  }

  if (redirectCurrentRouteIfNeeded()) {
    return;
  }

  isInstalled = true;
  disposeGlossaryLinkTooltip = initGlossaryLinkTooltip(document);

  const previousAfterRouteChange = router.onAfterRouteChange ?? router.onAfterRouteChanged;

  router.onAfterRouteChange = async (to) => {
    await previousAfterRouteChange?.(to);

    if (redirectCurrentRouteIfNeeded()) {
      return;
    }

    scheduleRouteSync();
  };

  onContentUpdated(() => {
    scheduleRouteSync();
    document.fonts?.ready.then(() => {
      scheduleRouteSync();
    }).catch(() => {});
  });

  window.addEventListener("hashchange", scheduleLegacyHashSync);
  window.addEventListener("resize", scheduleCurtainSync);
}
