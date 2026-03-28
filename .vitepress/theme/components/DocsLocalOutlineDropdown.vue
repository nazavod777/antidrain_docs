<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useData, useRoute } from "vitepress";
import CustomDocOutlineItem from "./CustomDocOutlineItem.vue";
import { type OutlineItem, useOutlineState } from "../support/outline";

const props = defineProps<{
  headers: OutlineItem[];
}>();

const { theme } = useData();
const route = useRoute();
const root = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const { activeHash, outlineTitle } = useOutlineState();

const dropdownLabel = outlineTitle;
const backToTopLabel = computed(() => theme.value.returnToTopLabel || "Back to top");
const panelId = "docs-local-outline-panel";

function closeDropdown() {
  isOpen.value = false;
}

function handleDocumentPointerDown(event: Event) {
  const target = event.target;

  if (!(target instanceof Node) || !root.value || root.value.contains(target)) {
    return;
  }

  closeDropdown();
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape") {
    return;
  }

  event.preventDefault();
  closeDropdown();
  root.value?.querySelector<HTMLElement>("button")?.focus();
}

function attachGlobalListeners() {
  document.addEventListener("pointerdown", handleDocumentPointerDown);
  document.addEventListener("keydown", handleDocumentKeydown);
}

function detachGlobalListeners() {
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
  document.removeEventListener("keydown", handleDocumentKeydown);
}

watch(isOpen, async (open) => {
  if (open) {
    attachGlobalListeners();
    await nextTick();
    root.value?.querySelector<HTMLElement>(".items a[href]")?.focus();
    return;
  }

  if (document.activeElement instanceof HTMLElement && root.value?.contains(document.activeElement)) {
    root.value.querySelector<HTMLElement>("button")?.focus();
  }

  detachGlobalListeners();
}, { flush: "post" });

watch(() => route.path, closeDropdown);
watch(() => props.headers, closeDropdown, { deep: true });

onBeforeUnmount(() => {
  detachGlobalListeners();
});

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function handlePanelClick(event: Event) {
  const target = event.target;

  if (target instanceof Element && target.closest("a[href]")) {
    closeDropdown();
  }
}
</script>

<template>
  <div ref="root" class="VPLocalNavOutlineDropdown" :class="{ open: isOpen }">
    <button
      type="button"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      :aria-label="dropdownLabel"
      @click="toggleDropdown"
    >
      <span class="menu-text">{{ dropdownLabel }}</span>
      <span class="vpi-chevron-right text-icon" :class="{ open: isOpen }" />
    </button>

    <div
      v-if="isOpen"
      :id="panelId"
      class="items"
      :aria-label="dropdownLabel"
      role="region"
      @click="handlePanelClick"
    >
      <div class="header">
        <a class="top-link" href="#top">{{ backToTopLabel }}</a>
      </div>

      <div class="outline">
        <CustomDocOutlineItem
          :headers="headers"
          :active-hash="activeHash"
          :root="true"
        />
      </div>
    </div>
  </div>
</template>
