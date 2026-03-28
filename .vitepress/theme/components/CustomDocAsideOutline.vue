<script setup lang="ts">
import { getScrollOffset, onContentUpdated, useData, useRoute } from "vitepress";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import CustomDocOutlineItem from "./CustomDocOutlineItem.vue";
import { safeDecodeHashFragment } from "../support/safe-hash";

type OutlineItem = {
  title: string;
  link: string;
  children?: OutlineItem[];
  element?: HTMLElement;
};

const { page, theme } = useData();
const route = useRoute();

const container = ref<HTMLElement | null>(null);
const marker = ref<HTMLElement | null>(null);
const activeHash = ref<string | null>(null);
const outlineHeaders = computed(() => (page.value.headers ?? []) as OutlineItem[]);
const liveHeaders = ref<OutlineItem[]>([]);

let frameId = 0;

function resolveOutlineTitle() {
  const outline = theme.value.outline;

  if (typeof outline === "object" && outline && !Array.isArray(outline) && outline.label) {
    return outline.label;
  }

  return theme.value.outlineTitle || "On this page";
}

function flattenHeaders(items: OutlineItem[], bucket: OutlineItem[] = []) {
  for (const item of items) {
    if (item.element instanceof HTMLElement) {
      bucket.push(item);
    }

    if (item.children?.length) {
      flattenHeaders(item.children, bucket);
    }
  }

  return bucket;
}

function scheduleSync() {
  if (frameId) {
    cancelAnimationFrame(frameId);
  }

  frameId = requestAnimationFrame(async () => {
    frameId = 0;
    syncActiveHash();
    await nextTick();
    syncMarker();
  });
}

function syncMarkerNextTick() {
  nextTick(() => {
    syncMarker();
  });
}

function handleOutlineActivate(link: string) {
  activeHash.value = link;
  syncMarkerNextTick();
}

function resolveHeaderElements(items: OutlineItem[]): OutlineItem[] {
  return items.map((item) => {
    const fragment = safeDecodeHashFragment(item.link.replace(/^#/, ""));
    const element = fragment ? document.getElementById(fragment) : null;

    return {
      ...item,
      element: element instanceof HTMLElement ? element : undefined,
      children: item.children?.length ? resolveHeaderElements(item.children) : undefined
    };
  });
}

function syncActiveHash() {
  const flatHeaders = flattenHeaders(liveHeaders.value);

  if (!flatHeaders.length) {
    activeHash.value = null;
    return;
  }

  const scrollY = window.scrollY;
  const innerHeight = window.innerHeight;
  const offsetHeight = document.body.offsetHeight;
  const isBottom = Math.abs(scrollY + innerHeight - offsetHeight) < 1;

  if (scrollY < 1) {
    activeHash.value = null;
    return;
  }

  if (isBottom) {
    activeHash.value = flatHeaders[flatHeaders.length - 1]?.link ?? null;
    return;
  }

  let nextActiveHash: string | null = null;

  for (const item of flatHeaders) {
    const top = getAbsoluteTop(item.element);
    if (Number.isNaN(top)) {
      continue;
    }

    if (top > scrollY + getScrollOffset() + 4) {
      break;
    }

    nextActiveHash = item.link;
  }

  activeHash.value = nextActiveHash;
}

function syncMarker() {
  const containerEl = container.value;
  const markerEl = marker.value;
  const activeLink = containerEl?.querySelector<HTMLElement>(".outline-link.active");
  const contentEl = containerEl?.querySelector<HTMLElement>(".content");

  if (!markerEl || !contentEl || !activeLink) {
    if (markerEl) {
      markerEl.style.opacity = "0";
      markerEl.style.top = "33px";
    }
    return;
  }

  const contentRect = contentEl.getBoundingClientRect();
  const activeRect = activeLink.getBoundingClientRect();
  const contentStyle = getComputedStyle(contentEl);
  const borderTopWidth = Number.parseFloat(contentStyle.borderTopWidth) || 0;
  const markerHeight = markerEl.getBoundingClientRect().height || 18;
  const top =
    activeRect.top -
    contentRect.top -
    borderTopWidth +
    Math.max(0, (activeRect.height - markerHeight) / 2);

  markerEl.style.top = `${top}px`;
  markerEl.style.opacity = "1";
}

function getAbsoluteTop(element: HTMLElement) {
  let current: HTMLElement | null = element;
  let offsetTop = 0;

  while (current && current !== document.body) {
    offsetTop += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }

  return current ? offsetTop : Number.NaN;
}

onMounted(() => {
  window.addEventListener("scroll", scheduleSync, { passive: true });
  window.addEventListener("resize", scheduleSync);
  window.addEventListener("hashchange", scheduleSync);
  liveHeaders.value = resolveHeaderElements(outlineHeaders.value);
  requestAnimationFrame(scheduleSync);

  if (document.fonts?.ready) {
    document.fonts.ready.then(scheduleSync).catch(() => {});
  }
});

onContentUpdated(() => {
  liveHeaders.value = resolveHeaderElements(outlineHeaders.value);
  nextTick(scheduleSync);
});

watch(() => route.path, () => {
  liveHeaders.value = resolveHeaderElements(outlineHeaders.value);
  nextTick(scheduleSync);
});

watch(outlineHeaders, () => {
  liveHeaders.value = resolveHeaderElements(outlineHeaders.value);
  nextTick(scheduleSync);
});

watch(activeHash, () => {
  syncMarkerNextTick();
});

onUnmounted(() => {
  if (frameId) {
    cancelAnimationFrame(frameId);
  }

  window.removeEventListener("scroll", scheduleSync);
  window.removeEventListener("resize", scheduleSync);
  window.removeEventListener("hashchange", scheduleSync);
});
</script>

<template>
  <nav
    v-if="outlineHeaders.length > 0"
    ref="container"
    aria-labelledby="doc-outline-aria-label-custom"
    class="VPDocAsideOutline VPDocAsideOutline--custom has-outline"
  >
    <div class="content">
      <div ref="marker" class="outline-marker" />

      <div
        id="doc-outline-aria-label-custom"
        aria-level="2"
        class="outline-title"
        role="heading"
      >
        {{ resolveOutlineTitle() }}
      </div>

      <CustomDocOutlineItem
        :headers="outlineHeaders"
        :active-hash="activeHash"
        :on-activate="handleOutlineActivate"
        :root="true"
      />
    </div>
  </nav>
</template>
