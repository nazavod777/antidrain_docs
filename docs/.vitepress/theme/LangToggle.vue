<script setup lang="ts">
/**
 * EN / RU switch, ported from site2's LanguageToggle.
 *
 * Like site2's, the WHOLE control is one target: clicking anywhere on it
 * switches to the other language. It shows both codes with the current one
 * highlighted, which is the standard reading of a two-state segmented control.
 *
 * Unlike site2 — which stores a preference and re-renders in place — the docs
 * are two separate page trees, so this is a real link to the counterpart page.
 * That keeps middle-click, open-in-new-tab and "copy link" working, which a
 * button could not do. The RU and EN trees are kept 1:1 by `npm run
 * check:parity`, so the counterpart always exists.
 */
import { computed } from 'vue'
import { useRoute, withBase } from 'vitepress'

const route = useRoute()

const LOCALE_IN_PATH = /^\/(ru|en)\//

/** The locale being read. The root landing page is English-first. */
const current = computed<'ru' | 'en'>(() =>
  LOCALE_IN_PATH.exec(route.path)?.[1] === 'ru' ? 'ru' : 'en',
)

/** The locale this control switches to. */
const target = computed<'ru' | 'en'>(() => (current.value === 'ru' ? 'en' : 'ru'))

/** Same page in the other locale, falling back to that locale's index. */
const href = computed(() =>
  withBase(
    LOCALE_IN_PATH.test(route.path)
      ? route.path.replace(LOCALE_IN_PATH, `/${target.value}/`)
      : `/${target.value}/`,
  ),
)

/** Announce the action, not the current state — this is a control, not a label. */
const label = computed(() =>
  target.value === 'ru' ? 'Переключить на русский' : 'Switch to English',
)
</script>

<template>
  <!--
    The wrapper exists so the divider can be a ::before on it rather than on
    the link. A ::before on the link itself would become a flex child inside
    the link and sit inside its hover background.
  -->
  <div class="lang-toggle-wrap">
    <a
      class="lang-toggle"
      :href="href"
      :hreflang="target"
      :aria-label="label"
      :title="label"
    >
      <span
        class="lang-toggle__opt"
        :class="{ 'lang-toggle__opt--active': current === 'en' }"
        lang="en"
        >EN</span
      >
      <span class="lang-toggle__sep" aria-hidden="true" />
      <span
        class="lang-toggle__opt"
        :class="{ 'lang-toggle__opt--active': current === 'ru' }"
        lang="ru"
        >RU</span
      >
    </a>
  </div>
</template>

<style scoped>
/*
 * Sits among VitePress's borderless nav controls (theme switch, social icons),
 * so an always-on bordered box read as heavy and bolted on. The chrome appears
 * on hover instead, the way the neighbouring icon buttons behave. Type and
 * colour semantics stay site2's: mono, 600, accent marks the current choice.
 */
.lang-toggle-wrap {
  display: flex;
  align-items: center;
}

/*
 * Divider matching the one VitePress draws between the theme switch and the
 * social icons — same 1px x 24px in --vp-c-divider. Without it the toggle's
 * hover background crowded the X icon.
 *
 * Values copied from VPNavBar's `.appearance + .social-links::before`.
 * `.social-links { margin-right: -8px }` is deliberately NOT cancelled: it is
 * optical compensation for the trailing padding inside the last icon, so
 * cancelling it pushed the line 8px further out than the existing dividers.
 *
 * Only shown from 1280px, because that is where VitePress reveals
 * .VPNavBarAppearance and .VPNavBarSocialLinks — below it there would be
 * nothing to the left of the line.
 */
@media (min-width: 1280px) {
  .lang-toggle-wrap::before {
    width: 1px;
    height: 24px;
    margin-right: 8px;
    margin-left: 16px;
    background-color: var(--vp-c-divider);
    content: '';
  }
}

.lang-toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast);
}

.lang-toggle:hover {
  background: var(--color-bg-card-hover);
  border-color: var(--color-border);
}

.lang-toggle:focus-visible {
  outline: var(--focus-ring);
  outline-offset: 2px;
}

.lang-toggle__opt {
  color: var(--color-text-muted);
  transition: color var(--transition-fast);
}

.lang-toggle__opt--active {
  color: var(--color-accent-text);
}

/* On hover the inactive code lifts to full-strength text, so the control
   previews where the click will take you. */
.lang-toggle:hover .lang-toggle__opt:not(.lang-toggle__opt--active) {
  color: var(--color-text-primary);
}

/* A hairline rule reads quieter than a slash glyph at this size. */
.lang-toggle__sep {
  width: 1px;
  height: 10px;
  background: var(--color-border-hover);
}

@media (max-width: 959px) {
  .lang-toggle {
    height: 44px;
    padding: 0 12px;
  }
}
</style>
