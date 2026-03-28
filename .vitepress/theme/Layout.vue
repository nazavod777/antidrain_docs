<script setup lang="ts">
import { useData, useRoute } from "vitepress";
import { computed, provide, useSlots, watch } from "vue";
import CustomDocAsideOutline from "./components/CustomDocAsideOutline.vue";
import VPContent from "./components/VPContent.vue";
import VPNav from "./components/VPNav.vue";
import { useDocsRuntimeEffects } from "./runtime/use-docs-runtime-effects";
import { useDocsNav } from "./support/docs-nav";
import { provideOutlineState } from "./support/outline";
import VPLocalNav from "./vitepress-overrides/VPLocalNav.vue";
import VPSidebar from "./vitepress-overrides/VPSidebar.vue";
import {
  VPBackdrop,
  VPFooter,
  VPSkipLink,
  useSidebar
} from "./support/vitepress-default-theme";
import { onBeforeUnmount, onMounted } from "vue";

const {
  isOpen: isSidebarOpen,
  open: openSidebar,
  close: closeSidebar
} = useSidebar();

const route = useRoute();
watch(() => route.path, closeSidebar);

const { frontmatter, page, theme } = useData();
const { isScreenOpen, closeScreen, toggleScreen, shouldRenderLocalNav, usesScreenMenu } = useDocsNav();

const slots = useSlots();
const heroImageSlotExists = computed(() => Boolean(slots["home-hero-image"]));
const outlineHeaders = computed(() => page.value.headers ?? []);
const routePath = computed(() => route.path);
const themeValue = computed(() => theme.value as Record<string, any>);

provide("hero-image-slot-exists", heroImageSlotExists);
provide("close-screen", closeScreen);
provideOutlineState(outlineHeaders, routePath, themeValue);

useDocsRuntimeEffects();

function handleEscape(event: KeyboardEvent) {
  if (event.key === "Escape" && isSidebarOpen.value) {
    closeSidebar();
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleEscape);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleEscape);
});
</script>

<template>
  <div v-if="frontmatter.layout !== false" class="Layout" :class="frontmatter.pageClass">
    <slot name="layout-top" />
    <VPSkipLink />
    <VPBackdrop class="backdrop" :show="isSidebarOpen" @click="closeSidebar" />
    <VPNav
      :is-screen-open="isScreenOpen"
      :uses-screen-menu="usesScreenMenu"
      @toggle-screen="toggleScreen"
    >
      <template #nav-bar-title-before><slot name="nav-bar-title-before" /></template>
      <template #nav-bar-title-after><slot name="nav-bar-title-after" /></template>
      <template #nav-bar-content-before><slot name="nav-bar-content-before" /></template>
      <template #nav-bar-content-after><slot name="nav-bar-content-after" /></template>
      <template #nav-screen-content-before><slot name="nav-screen-content-before" /></template>
      <template #nav-screen-content-after><slot name="nav-screen-content-after" /></template>
    </VPNav>

    <VPLocalNav
      v-if="shouldRenderLocalNav"
      :open="isSidebarOpen"
      :screen-open="isScreenOpen"
      @open-menu="openSidebar"
    />

    <VPSidebar :open="isSidebarOpen">
      <template #sidebar-nav-before><slot name="sidebar-nav-before" /></template>
      <template #sidebar-nav-after><slot name="sidebar-nav-after" /></template>
    </VPSidebar>

    <VPContent>
      <template #page-top><slot name="page-top" /></template>
      <template #page-bottom><slot name="page-bottom" /></template>

      <template #not-found><slot name="not-found" /></template>
      <template #home-hero-before><slot name="home-hero-before" /></template>
      <template #home-hero-info-before><slot name="home-hero-info-before" /></template>
      <template #home-hero-info><slot name="home-hero-info" /></template>
      <template #home-hero-info-after><slot name="home-hero-info-after" /></template>
      <template #home-hero-actions-after><slot name="home-hero-actions-after" /></template>
      <template #home-hero-image><slot name="home-hero-image" /></template>
      <template #home-hero-after><slot name="home-hero-after" /></template>
      <template #home-features-before><slot name="home-features-before" /></template>
      <template #home-features-after><slot name="home-features-after" /></template>

      <template #doc-footer-before><slot name="doc-footer-before" /></template>
      <template #doc-before><slot name="doc-before" /></template>
      <template #doc-after><slot name="doc-after" /></template>
      <template #doc-top><slot name="doc-top" /></template>
      <template #doc-bottom><slot name="doc-bottom" /></template>

      <template #aside-top><slot name="aside-top" /></template>
      <template #aside-bottom><slot name="aside-bottom" /></template>
      <template #aside-outline-before>
        <slot name="aside-outline-before" />
        <CustomDocAsideOutline />
      </template>
      <template #aside-outline-after><slot name="aside-outline-after" /></template>
      <template #aside-ads-before><slot name="aside-ads-before" /></template>
      <template #aside-ads-after><slot name="aside-ads-after" /></template>
    </VPContent>

    <VPFooter />
    <slot name="layout-bottom" />
  </div>
  <Content v-else />
</template>

<style scoped>
.Layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
