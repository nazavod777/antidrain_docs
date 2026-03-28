<script lang="ts" setup>
import { useData } from "vitepress";
import VPNavBarMenuGroup from "vitepress/dist/client/theme-default/components/VPNavBarMenuGroup.vue";
import VPNavBarMenuLink from "vitepress/dist/client/theme-default/components/VPNavBarMenuLink.vue";
import { resolveDocsA11yLabel } from "../support/a11y-labels";

const { theme } = useData();
</script>

<template>
  <nav
    v-if="theme.nav"
    aria-labelledby="main-nav-aria-label"
    class="VPNavBarMenu"
  >
    <span id="main-nav-aria-label" class="visually-hidden">
      {{ resolveDocsA11yLabel(theme, "mainNavigation") }}
    </span>
    <template v-for="item in theme.nav" :key="JSON.stringify(item)">
      <VPNavBarMenuLink v-if="'link' in item" :item="item" />
      <component
        v-else-if="'component' in item"
        :is="item.component"
        v-bind="item.props"
      />
      <VPNavBarMenuGroup v-else :item="item" />
    </template>
  </nav>
</template>

<style scoped>
.VPNavBarMenu {
  display: none;
}

@media (min-width: 1180px) {
  .VPNavBarMenu {
    display: flex;
  }
}
</style>
