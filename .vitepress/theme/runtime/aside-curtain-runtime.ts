function resolveAsideElements() {
  return {
    aside: document.querySelector<HTMLElement>(".VPDoc .aside-container"),
    asideContent: document.querySelector<HTMLElement>(".VPDoc .aside-content"),
    curtain: document.querySelector<HTMLElement>(".VPDoc .aside-curtain")
  };
}

export function installAsideCurtainRuntime() {
  if (typeof window === "undefined") {
    return {
      scheduleSync() {},
      dispose() {}
    };
  }

  let frameId = 0;
  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;
  let trackedAside: HTMLElement | null = null;
  let trackedAsideContent: HTMLElement | null = null;

  const detachObservers = () => {
    if (trackedAside) {
      trackedAside.removeEventListener("scroll", scheduleSync);
      trackedAside = null;
    }

    trackedAsideContent = null;
    resizeObserver?.disconnect();
    resizeObserver = null;
    mutationObserver?.disconnect();
    mutationObserver = null;
  };

  const syncCurtainState = () => {
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
  };

  const syncObservedTargets = () => {
    const { aside, asideContent } = resolveAsideElements();

    if (!aside) {
      detachObservers();
      return;
    }

    if (trackedAside === aside && trackedAsideContent === asideContent) {
      return;
    }

    detachObservers();
    trackedAside = aside;
    trackedAsideContent = asideContent;
    trackedAside.addEventListener("scroll", scheduleSync, { passive: true });

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(scheduleSync);
      resizeObserver.observe(aside);

      if (asideContent) {
        resizeObserver.observe(asideContent);
      }
    }

    if (typeof MutationObserver !== "undefined" && asideContent) {
      mutationObserver = new MutationObserver(scheduleSync);
      mutationObserver.observe(asideContent, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  };

  function scheduleSync() {
    if (frameId) {
      window.cancelAnimationFrame(frameId);
    }

    frameId = window.requestAnimationFrame(() => {
      frameId = 0;
      syncObservedTargets();
      syncCurtainState();
    });
  }

  const handleResize = () => {
    scheduleSync();
  };

  window.addEventListener("resize", handleResize);
  scheduleSync();
  document.fonts?.ready.then(scheduleSync).catch(() => {});

  return {
    scheduleSync,
    dispose() {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }

      window.removeEventListener("resize", handleResize);
      detachObservers();
    }
  };
}

