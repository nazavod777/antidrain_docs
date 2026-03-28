<script setup lang="ts">
import { safeDecodeHashFragment } from "../support/safe-hash";

type OutlineItem = {
  title: string;
  link: string;
  children?: OutlineItem[];
};

const props = defineProps<{
  headers: OutlineItem[];
  activeHash: string | null;
  root?: boolean;
}>();

function onClick(event: MouseEvent, link: string) {
  const element = event.currentTarget as HTMLAnchorElement | null;
  if (!element?.href) {
    return;
  }

  const rawFragment = element.hash.startsWith("#") ? element.hash.slice(1) : "";
  const heading = document.getElementById(safeDecodeHashFragment(rawFragment));
  heading?.focus({ preventScroll: true });
}
</script>

<template>
  <ul class="VPDocOutlineItem" :class="root ? 'root' : 'nested'">
    <li v-for="{ children, link, title } in headers" :key="link">
      <a
        class="outline-link"
        :class="{ active: activeHash === link }"
        :href="link"
        :title="title"
        :aria-current="activeHash === link ? 'location' : undefined"
        @click="onClick($event, link)"
      >
        {{ title }}
      </a>
      <template v-if="children?.length">
        <CustomDocOutlineItem
          :headers="children"
          :active-hash="activeHash"
        />
      </template>
    </li>
  </ul>
</template>
