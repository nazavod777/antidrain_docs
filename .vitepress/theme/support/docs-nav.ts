import { inBrowser, useRoute } from "vitepress";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const SIDEBAR_LAYOUT_MIN_WIDTH = 960;
const PERSISTENT_OUTLINE_MIN_WIDTH = 1280;

export function useDocsNav() {
  const isScreenOpen = ref(false);
  const viewportWidth = ref(0);
  const hasMeasuredViewport = ref(false);
  const route = useRoute();

  let isResizeListenerAttached = false;
  let isEscapeListenerAttached = false;

  function syncViewportWidth() {
    if (!inBrowser) {
      return;
    }

    viewportWidth.value = window.innerWidth;
    hasMeasuredViewport.value = true;
  }

  function removeResizeListener() {
    if (!inBrowser || !isResizeListenerAttached) {
      return;
    }

    window.removeEventListener("resize", handleResize);
    isResizeListenerAttached = false;
  }

  function removeEscapeListener() {
    if (!inBrowser || !isEscapeListenerAttached) {
      return;
    }

    window.removeEventListener("keydown", closeScreenOnEscape);
    isEscapeListenerAttached = false;
  }

  function syncResizeListener() {
    if (!inBrowser) {
      return;
    }

    if (!isResizeListenerAttached) {
      window.addEventListener("resize", handleResize, { passive: true });
      isResizeListenerAttached = true;
    }
  }

  function syncEscapeListener() {
    if (!inBrowser) {
      return;
    }

    if (isScreenOpen.value) {
      if (!isEscapeListenerAttached) {
        window.addEventListener("keydown", closeScreenOnEscape);
        isEscapeListenerAttached = true;
      }
      return;
    }

    removeEscapeListener();
  }

  function openScreen() {
    isScreenOpen.value = true;
    syncResizeListener();
    syncEscapeListener();
    closeScreenOnDesktopWidth();
  }

  function closeScreen() {
    isScreenOpen.value = false;
    syncResizeListener();
    syncEscapeListener();
  }

  function toggleScreen() {
    if (isScreenOpen.value) {
      closeScreen();
      return;
    }

    openScreen();
  }

  function closeScreenOnDesktopWidth() {
    if (!inBrowser || viewportWidth.value < SIDEBAR_LAYOUT_MIN_WIDTH) {
      return;
    }

    closeScreen();
  }

  function closeScreenOnEscape(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeScreen();
    }
  }

  function handleResize() {
    syncViewportWidth();
    closeScreenOnDesktopWidth();
  }

  const shouldRenderLocalNav = computed(() => {
    if (!hasMeasuredViewport.value) {
      return true;
    }

    return viewportWidth.value < PERSISTENT_OUTLINE_MIN_WIDTH;
  });

  const usesScreenMenu = computed(() => {
    if (!hasMeasuredViewport.value) {
      return true;
    }

    return viewportWidth.value < SIDEBAR_LAYOUT_MIN_WIDTH;
  });

  watch(
    () => route.path,
    () => {
      closeScreen();
    }
  );

  onMounted(() => {
    syncViewportWidth();
    closeScreen();
    closeScreenOnDesktopWidth();
    syncResizeListener();
  });

  onBeforeUnmount(() => {
    closeScreen();
    removeResizeListener();
    removeEscapeListener();
  });

  return {
    isScreenOpen,
    closeScreen,
    toggleScreen,
    shouldRenderLocalNav,
    usesScreenMenu
  };
}
