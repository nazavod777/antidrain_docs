import { getScrollOffset, useRoute } from "vitepress";
import { nextTick, onMounted, onUnmounted, watch } from "vue";
import { legacySlugifyHeading } from "../../slug";
import { installAsideCurtainRuntime } from "./aside-curtain-runtime";
import { safeDecodeHashFragment } from "../support/safe-hash";

export function useDocsRuntimeEffects() {
  const route = useRoute();

  let routeSyncFrameId = 0;
  let legacyHashFrameId = 0;
  let asideCurtainRuntime: ReturnType<typeof installAsideCurtainRuntime> | null = null;

  function syncLegacyHash() {
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

  function whenFontsReady(callback: () => void) {
    document.fonts?.ready.then(callback).catch(() => {});
  }

  function scheduleLegacyHashSync() {
    if (legacyHashFrameId) {
      window.cancelAnimationFrame(legacyHashFrameId);
    }

    legacyHashFrameId = window.requestAnimationFrame(() => {
      legacyHashFrameId = 0;
      syncLegacyHash();
    });
  }

  function scheduleRouteSync() {
    if (routeSyncFrameId) {
      window.cancelAnimationFrame(routeSyncFrameId);
    }

    routeSyncFrameId = window.requestAnimationFrame(() => {
      routeSyncFrameId = 0;
      scheduleLegacyHashSync();
      asideCurtainRuntime?.scheduleSync();
    });
  }

  async function refreshRouteSideEffects() {
    await nextTick();
    scheduleRouteSync();
    whenFontsReady(scheduleRouteSync);
  }

  function handleHashChange() {
    scheduleLegacyHashSync();
  }

  watch(
    () => route.path,
    () => {
      refreshRouteSideEffects().catch(() => {});
    },
    { flush: "post" }
  );

  onMounted(() => {
    if (typeof window === "undefined") {
      return;
    }

    asideCurtainRuntime = installAsideCurtainRuntime();
    window.addEventListener("hashchange", handleHashChange);
    refreshRouteSideEffects().catch(() => {});
  });

  onUnmounted(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("hashchange", handleHashChange);
    }

    if (routeSyncFrameId) {
      window.cancelAnimationFrame(routeSyncFrameId);
      routeSyncFrameId = 0;
    }

    if (legacyHashFrameId) {
      window.cancelAnimationFrame(legacyHashFrameId);
      legacyHashFrameId = 0;
    }

    asideCurtainRuntime?.dispose();
    asideCurtainRuntime = null;
  });
}
