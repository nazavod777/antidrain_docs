<script setup>
import { withBase } from "vitepress";

const logoSrc = withBase("/antidrain-mark.png");
</script>

<template>
  <span class="docs-brand-mark" aria-hidden="true">
    <img
      class="docs-brand-mark-image"
      :src="logoSrc"
      alt=""
      width="18"
      height="20"
      draggable="false"
      decoding="async"
    />
  </span>
</template>
