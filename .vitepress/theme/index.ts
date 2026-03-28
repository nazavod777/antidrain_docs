import { h } from "vue";
import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";
import BrandMark from "./components/BrandMark.vue";
import "./custom.css";
import "./styles/home-shell.css";
import "./styles/docs-content.css";
import "./styles/nav-shell.css";
import "./styles/interaction.css";
import "./styles/local-nav.css";

export default {
  ...DefaultTheme,
  Layout: () =>
    h(Layout, null, {
      "nav-bar-title-before": () => h(BrandMark)
    }),
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp?.(ctx);
  }
};
