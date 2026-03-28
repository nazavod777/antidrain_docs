<script setup lang="ts">
import { useData } from "vitepress";
import { computed, nextTick, watch } from "vue";
import VPNavBar from "./VPNavBar.vue";
import { VPNavScreen } from "../support/vitepress-default-theme";

const props = defineProps<{
  isScreenOpen: boolean;
  usesScreenMenu: boolean;
}>();

defineEmits<{
  (e: "toggle-screen"): void;
}>();

const { frontmatter } = useData();

const hasNavbar = computed(() => {
  return frontmatter.value.navbar !== false;
});

watch(
  () => props.isScreenOpen,
  async (isOpen) => {
    if (!hasNavbar.value || typeof document === "undefined") {
      return;
    }

    await nextTick();

    if (isOpen) {
      const navScreen = document.getElementById("VPNavScreen");
      const firstInteractiveElement = navScreen?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      firstInteractiveElement?.focus();
      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      const navScreen = document.getElementById("VPNavScreen");

      if (navScreen?.contains(document.activeElement)) {
        document.querySelector<HTMLElement>(".VPNavBarHamburger")?.focus();
      }
    }
  },
  { flush: "post" }
);
</script>

<template>
  <header v-if="hasNavbar" class="VPNav">
    <VPNavBar :is-screen-open="props.isScreenOpen" @toggle-screen="$emit('toggle-screen')">
      <template #nav-bar-title-before><slot name="nav-bar-title-before" /></template>
      <template #nav-bar-title-after><slot name="nav-bar-title-after" /></template>
      <template #nav-bar-content-before><slot name="nav-bar-content-before" /></template>
      <template #nav-bar-content-after><slot name="nav-bar-content-after" /></template>
    </VPNavBar>
    <VPNavScreen v-if="props.usesScreenMenu || props.isScreenOpen" :open="props.isScreenOpen">
      <template #nav-screen-content-before><slot name="nav-screen-content-before" /></template>
      <template #nav-screen-content-after><slot name="nav-screen-content-after" /></template>
    </VPNavScreen>
  </header>
</template>

<style scoped>
.VPNav {
  position: relative;
  top: var(--vp-layout-top-height, 0px);
  left: 0;
  z-index: var(--vp-z-index-nav);
  width: 100%;
  transition: background-color 0.5s;
}

@media (min-width: 960px) {
  .VPNav {
    position: fixed;
  }
}
</style>
