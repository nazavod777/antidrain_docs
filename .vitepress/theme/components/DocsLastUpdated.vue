<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";

const { lang, page, theme } = useData();

const lastUpdatedValue = computed(() => {
  const rawValue = page.value.lastUpdated;

  if (typeof rawValue === "number") {
    return rawValue;
  }

  if (typeof rawValue === "string" && rawValue.trim()) {
    const parsedValue = Date.parse(rawValue);
    return Number.isNaN(parsedValue) ? null : parsedValue;
  }

  return null;
});

const datetime = computed(() => {
  if (lastUpdatedValue.value === null) {
    return "";
  }

  return new Date(lastUpdatedValue.value).toISOString();
});

const formatted = computed(() => {
  if (lastUpdatedValue.value === null) {
    return "";
  }

  return new Intl.DateTimeFormat(lang.value || "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC"
  }).format(new Date(lastUpdatedValue.value));
});

const label = computed(() => theme.value.lastUpdated?.text || "Updated at");
</script>

<template>
  <p v-if="lastUpdatedValue !== null" class="VPLastUpdated">
    {{ label }}:
    <time :datetime="datetime">{{ formatted }}</time>
  </p>
</template>
