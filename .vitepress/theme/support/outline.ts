import { getScrollOffset } from "vitepress";
import {
  computed,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  ref,
  watch,
  type ComputedRef,
  type InjectionKey,
  type Ref
} from "vue";
import { safeDecodeHashFragment } from "./safe-hash";

export type OutlineItem = {
  title: string;
  link: string;
  children?: OutlineItem[];
};

type LiveOutlineItem = OutlineItem & {
  element?: HTMLElement;
  children?: LiveOutlineItem[];
};

type DocsOutlineState = {
  outlineHeaders: ComputedRef<OutlineItem[]>;
  outlineTitle: ComputedRef<string>;
  activeHash: Ref<string | null>;
};

const DOCS_OUTLINE_STATE_KEY: InjectionKey<DocsOutlineState> = Symbol("docs-outline-state");

export function resolveOutlineTitle(themeValue: Record<string, any>) {
  const outline = themeValue.outline;

  if (typeof outline === "object" && outline && !Array.isArray(outline) && outline.label) {
    return outline.label;
  }

  return themeValue.outlineTitle || "On this page";
}

function flattenHeaders(items: LiveOutlineItem[], bucket: LiveOutlineItem[] = []) {
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

function resolveHeaderElements(items: OutlineItem[]): LiveOutlineItem[] {
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

export function useActiveOutline(
  outlineHeaders: ComputedRef<OutlineItem[]>,
  routePath: ComputedRef<string>
) {
  const activeHash = ref<string | null>(null);
  const liveHeaders = ref<LiveOutlineItem[]>([]);

  let frameId = 0;

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
    const threshold = getScrollOffset() + 4;

    for (const item of flatHeaders) {
      const element = item.element;

      if (!element) {
        continue;
      }

      const top = element.getBoundingClientRect().top;

      if (top > threshold) {
        break;
      }

      nextActiveHash = item.link;
    }

    activeHash.value = nextActiveHash;
  }

  function scheduleSync() {
    if (frameId) {
      cancelAnimationFrame(frameId);
    }

    frameId = requestAnimationFrame(() => {
      frameId = 0;
      syncActiveHash();
    });
  }

  async function refreshOutlineTargets() {
    await nextTick();
    liveHeaders.value = resolveHeaderElements(outlineHeaders.value);
    scheduleSync();
  }

  onMounted(() => {
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    window.addEventListener("hashchange", scheduleSync);
    requestAnimationFrame(() => {
      refreshOutlineTargets().catch(() => {});
    });
  });

  watch([routePath, outlineHeaders], () => {
    refreshOutlineTargets().catch(() => {});
  }, { flush: "post" });

  onUnmounted(() => {
    if (frameId) {
      cancelAnimationFrame(frameId);
    }

    window.removeEventListener("scroll", scheduleSync);
    window.removeEventListener("resize", scheduleSync);
    window.removeEventListener("hashchange", scheduleSync);
  });

  return {
    activeHash,
    liveHeaders
  };
}

export function provideOutlineState(
  outlineHeaders: ComputedRef<OutlineItem[]>,
  routePath: ComputedRef<string>,
  themeValue: ComputedRef<Record<string, any>>
) {
  const { activeHash } = useActiveOutline(outlineHeaders, routePath);
  const outlineTitle = computed(() => resolveOutlineTitle(themeValue.value));
  const state = {
    outlineHeaders,
    outlineTitle,
    activeHash
  };

  provide(DOCS_OUTLINE_STATE_KEY, state);
  return state;
}

export function useOutlineState() {
  const state = inject(DOCS_OUTLINE_STATE_KEY, null);

  if (!state) {
    throw new Error("Docs outline state is not available in the current theme tree.");
  }

  return state;
}
