<script lang="ts" setup>
import { useData } from "vitepress";
import { resolveDocsA11yLabel } from "../support/a11y-labels";
import {
  VPNavBarMenuGroup,
  VPNavBarMenuLink
} from "../support/vitepress-default-theme";

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
    <template
      v-for="(item, index) in theme.nav"
      :key="'link' in item ? item.link : 'text' in item ? item.text : String(index)"
    >
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
