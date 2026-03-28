import { h } from "vue";
import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";
import BrandMark from "./components/BrandMark.vue";
import { installDocsClientRuntime } from "./client-runtime";
import "./custom.css";

export default {
  ...DefaultTheme,
  Layout: () =>
    h(Layout, null, {
      "nav-bar-title-before": () => h(BrandMark)
    }),
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp?.(ctx);
    installDocsClientRuntime(ctx.router);
  }
};
