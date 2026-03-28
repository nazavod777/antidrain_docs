<script lang="ts" setup>
import { useScrollLock } from "@vueuse/core";
import { inBrowser, useData } from "vitepress";
import { nextTick, ref, watch } from "vue";
import { resolveDocsA11yLabel } from "../support/a11y-labels";
import { useSidebar } from "../support/vitepress-default-theme";
import DocsSidebarItems from "../components/DocsSidebarItems.vue";

const { sidebarGroups, hasSidebar } = useSidebar();
const { theme } = useData();

const props = defineProps<{
  open: boolean;
}>();

const navEl = ref<HTMLElement | null>(null);
const isLocked = useScrollLock(inBrowser ? document.body : null);

function focusSidebarNav() {
  const nav = navEl.value;

  if (!(nav instanceof HTMLElement)) {
    return;
  }

  const firstInteractiveElement = nav.querySelector<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  (firstInteractiveElement ?? nav).focus();
}

watch(
  [props, navEl],
  async () => {
    if (props.open) {
      isLocked.value = true;
      await nextTick();
      focusSidebarNav();
    } else {
      isLocked.value = false;

      if (
        typeof document !== "undefined" &&
        document.activeElement instanceof HTMLElement &&
        navEl.value?.contains(document.activeElement)
      ) {
        document.querySelector<HTMLElement>('.VPLocalNav .menu[aria-controls="VPSidebarNav"]')?.focus();
      }
    }
  },
  { immediate: true, flush: "post" }
);

</script>

<template>
  <aside
    v-if="hasSidebar"
    class="VPSidebar"
    :class="{ open }"
    @click.stop
  >
    <div class="curtain" />

    <nav
      ref="navEl"
      class="nav"
      id="VPSidebarNav"
      aria-labelledby="sidebar-aria-label"
      tabindex="-1"
    >
      <span class="visually-hidden" id="sidebar-aria-label">
        {{ resolveDocsA11yLabel(theme, "sidebarNavigation") }}
      </span>

      <slot name="sidebar-nav-before" />
      <DocsSidebarItems :items="sidebarGroups" />
      <slot name="sidebar-nav-after" />
    </nav>
  </aside>
</template>

<style scoped>
.VPSidebar {
  position: fixed;
  top: var(--vp-layout-top-height, 0px);
  bottom: 0;
  left: 0;
  z-index: var(--vp-z-index-sidebar);
  padding: 32px 32px 96px;
  width: calc(100vw - 64px);
  max-width: 320px;
  background-color: var(--vp-sidebar-bg-color);
  opacity: 0;
  visibility: hidden;
  box-shadow: var(--vp-c-shadow-3);
  overflow-x: hidden;
  overflow-y: auto;
  transform: translateX(-100%);
  transition: opacity 0.5s, transform 0.25s ease;
  overscroll-behavior: contain;
}

.VPSidebar.open {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
  transition:
    opacity 0.25s,
    transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

@media (min-width: 960px) {
  .VPSidebar {
    padding-top: var(--vp-nav-height);
    width: var(--vp-sidebar-width);
    max-width: 100%;
    background-color: var(--vp-sidebar-bg-color);
    opacity: 1;
    visibility: visible;
    box-shadow: none;
    transform: translateX(0);
  }
}

@media (min-width: 1440px) {
  .VPSidebar {
    padding-left: max(32px, calc((100% - (var(--vp-layout-max-width) - 64px)) / 2));
    width: calc((100% - (var(--vp-layout-max-width) - 64px)) / 2 + var(--vp-sidebar-width) - 32px);
  }
}

@media (min-width: 960px) {
  .curtain {
    position: sticky;
    top: -64px;
    left: 0;
    z-index: 1;
    margin-top: calc(var(--vp-nav-height) * -1);
    margin-right: -32px;
    margin-left: -32px;
    height: var(--vp-nav-height);
    background-color: var(--vp-sidebar-bg-color);
  }
}

.nav {
  outline: 0;
}

@media (min-width: 960px) {
  .nav {
    padding-top: 14px;
  }
}
</style>
