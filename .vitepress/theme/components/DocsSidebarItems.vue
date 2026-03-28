<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vitepress";

type SidebarItem = {
  text?: string;
  link?: string;
  items?: SidebarItem[];
};

const props = defineProps<{
  items: SidebarItem[];
  level?: number;
}>();

const route = useRoute();
const level = computed(() => props.level ?? 0);

function isActiveLink(link?: string) {
  if (!link) {
    return false;
  }

  const normalizedLink = link.replace(/\/+$/u, "") || "/";
  const normalizedRoute = route.path.replace(/[?#].*$/u, "").replace(/\/+$/u, "") || "/";
  return normalizedLink === normalizedRoute;
}

function buildSectionClass(currentLevel: number) {
  return `VPSidebarItem level-${currentLevel}`;
}

function buildLinkClass(currentLevel: number, active: boolean) {
  return [
    "VPSidebarItem",
    "is-link",
    `level-${currentLevel}`,
    active ? "is-active has-active" : ""
  ]
    .filter(Boolean)
    .join(" ");
}
</script>

<template>
  <div class="group">
    <template v-for="(item, index) in items" :key="item.link || `${item.text || 'group'}-${index}`">
      <section
        v-if="item.items?.length"
        :class="buildSectionClass(level)"
      >
        <div class="item">
          <div class="indicator" />
          <component :is="level === 0 ? 'h2' : 'p'" class="text">{{ item.text }}</component>
        </div>

        <div class="items">
          <DocsSidebarItems :items="item.items" :level="level + 1" />
        </div>
      </section>

      <div
        v-else
        :class="buildLinkClass(level, isActiveLink(item.link))"
      >
        <div class="item">
          <div class="indicator" />
          <a class="VPLink link link" :href="item.link || '#'">
            <p class="text">{{ item.text }}</p>
          </a>
        </div>
      </div>
    </template>
  </div>
</template>
