import DefaultTheme from 'vitepress/theme'
import { useRoute, type Theme } from 'vitepress'
import LangToggle from './LangToggle.vue'
import { bindTableScrollHints } from './tableScrollHints'
import { h, nextTick, onMounted, watch } from 'vue'

// Order matters: tokens define the dark palette, light overrides it, the
// bridge maps both onto VitePress, then prose/base add what variables cannot
// express. The only !important in the theme is the reduced-motion blanket in
// base.css, where an accessibility override has to win.
import './tokens.css'
import './light.css'
import './vp-bridge.css'
import './base.css'
import './prose.css'

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      // the site puts the EN/RU switch in the header next to the other controls,
      // so docs does too — rather than VitePress's "Languages" dropdown.
      'nav-bar-content-after': () => h(LangToggle),
    }),
  setup() {
    const route = useRoute()
    // Hooks run only in the browser, so the prerender never reaches the DOM.
    onMounted(() => bindTableScrollHints())
    watch(
      () => route.path,
      () => nextTick(() => bindTableScrollHints()),
    )
  },
} satisfies Theme
