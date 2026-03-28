/**
 * Centralized access to VitePress default theme internals.
 *
 * These imports are validated against VitePress 1.6.4 and intentionally kept
 * in one place so future upgrades touch one file instead of every override.
 * Keep docs-site/package.json pinned to the validated VitePress version.
 */

export { useEditLink } from "vitepress/dist/client/theme-default/composables/edit-link.js";
export { usePrevNext } from "vitepress/dist/client/theme-default/composables/prev-next.js";
export { useSidebar } from "vitepress/dist/client/theme-default/composables/sidebar.js";
export { default as VPBackdrop } from "vitepress/dist/client/theme-default/components/VPBackdrop.vue";
export { default as VPDocAside } from "vitepress/dist/client/theme-default/components/VPDocAside.vue";
export { default as VPFooter } from "vitepress/dist/client/theme-default/components/VPFooter.vue";
export { default as VPHome } from "vitepress/dist/client/theme-default/components/VPHome.vue";
export { default as VPLink } from "vitepress/dist/client/theme-default/components/VPLink.vue";
export { default as VPNavBarMenuGroup } from "vitepress/dist/client/theme-default/components/VPNavBarMenuGroup.vue";
export { default as VPNavBarMenuLink } from "vitepress/dist/client/theme-default/components/VPNavBarMenuLink.vue";
export { default as VPNavBarSearch } from "vitepress/dist/client/theme-default/components/VPNavBarSearch.vue";
export { default as VPNavBarTitle } from "vitepress/dist/client/theme-default/components/VPNavBarTitle.vue";
export { default as VPNavBarTranslations } from "vitepress/dist/client/theme-default/components/VPNavBarTranslations.vue";
export { default as VPNavScreen } from "vitepress/dist/client/theme-default/components/VPNavScreen.vue";
export { default as VPPage } from "vitepress/dist/client/theme-default/components/VPPage.vue";
export { default as VPSkipLink } from "vitepress/dist/client/theme-default/components/VPSkipLink.vue";
