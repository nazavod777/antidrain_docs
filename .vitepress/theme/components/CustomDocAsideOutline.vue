<script setup lang="ts">
import CustomDocOutlineItem from "./CustomDocOutlineItem.vue";
import { useOutlineState } from "../support/outline";

const { outlineHeaders, outlineTitle, activeHash } = useOutlineState();
</script>

<template>
  <nav
    v-if="outlineHeaders.length > 0"
    aria-labelledby="doc-outline-aria-label-custom"
    class="VPDocAsideOutline VPDocAsideOutline--custom has-outline"
  >
    <div class="content">
      <div
        id="doc-outline-aria-label-custom"
        aria-level="2"
        class="outline-title"
        role="heading"
      >
        {{ outlineTitle }}
      </div>

      <CustomDocOutlineItem
        :headers="outlineHeaders"
        :active-hash="activeHash"
        :root="true"
      />
    </div>
  </nav>
</template>
