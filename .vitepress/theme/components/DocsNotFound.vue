<script setup lang="ts">
import { computed } from "vue";
import { useRoute, withBase } from "vitepress";
import { mainSiteOrigin } from "../../config/deployment";
import BrandMark from "./BrandMark.vue";

const route = useRoute();

const isRussian = computed(() => route.path.startsWith("/ru/"));

const copy = computed(() =>
  isRussian.value
    ? {
        brandTitle: "Документация AntiDrain",
        badge: "404 · Страница не найдена",
        title: "Этот раздел не найден. Документация всё ещё под рукой.",
        lead:
          "Маршрут не существует, был переименован или ссылка обрезалась. Ниже есть безопасные точки возврата в документацию и на основной сайт.",
        primary: "С чего начать",
        overview: "Обзор",
        glossary: "Словарь",
        mainSite: "Основной сайт",
        quickLabel: "Быстрый возврат",
        quickTitle: "Откройте базовый маршрут восстановления",
        quickText:
          "Если ссылка устарела, начните с обзорной или стартовой страницы, а затем вернитесь к нужному шагу.",
        routesLabel: "Полезные точки входа",
        helper:
          "Проверьте базовые шаги, словарь терминов или вернитесь в рабочее пространство AntiDrain."
      }
    : {
        brandTitle: "AntiDrain Docs",
        badge: "404 · Page not found",
        title: "This docs route is missing. The recovery map is not.",
        lead:
          "The page does not exist, was renamed, or the link was cut short. Safe return points to the docs and the main site are still available below.",
        primary: "Getting Started",
        overview: "Overview",
        glossary: "Glossary",
        mainSite: "Main Site",
        quickLabel: "Fast return",
        quickTitle: "Open the recovery basics first",
        quickText:
          "If you landed on an outdated deep link, start from the overview or getting-started route and then return to the exact step you need.",
        routesLabel: "Useful routes",
        helper:
          "Check the basics, open the glossary, or go back to the main AntiDrain workspace."
      }
);

function localizedPath(pathname: string) {
  return withBase(`${isRussian.value ? "/ru" : ""}${pathname}`);
}

const actions = computed(() => ({
  primary: localizedPath("/getting-started"),
  overview: localizedPath("/overview"),
  glossary: localizedPath("/glossary"),
  mainSite: mainSiteOrigin
}));
</script>

<template>
  <section class="docs-not-found">
    <div class="docs-not-found__panel">
      <div class="docs-not-found__hero">
        <div class="docs-not-found__brand">
          <span class="docs-not-found__brand-mark">
            <BrandMark />
          </span>
          <div>
            <p class="docs-not-found__brand-title">{{ copy.brandTitle }}</p>
            <p class="docs-not-found__brand-subtitle">{{ copy.helper }}</p>
          </div>
        </div>

        <p class="docs-not-found__badge">{{ copy.badge }}</p>
        <h1>{{ copy.title }}</h1>
        <p class="docs-not-found__lead">{{ copy.lead }}</p>

        <div class="docs-not-found__actions">
          <a class="docs-not-found__button docs-not-found__button--primary" :href="actions.primary">
            {{ copy.primary }}
          </a>
          <a class="docs-not-found__button" :href="actions.overview">{{ copy.overview }}</a>
          <a class="docs-not-found__button" :href="actions.glossary">{{ copy.glossary }}</a>
          <a class="docs-not-found__button" :href="actions.mainSite">{{ copy.mainSite }}</a>
        </div>
      </div>

      <div class="docs-not-found__grid">
        <article class="docs-not-found__card">
          <p class="docs-not-found__card-label">{{ copy.quickLabel }}</p>
          <h2>{{ copy.quickTitle }}</h2>
          <p>{{ copy.quickText }}</p>
        </article>

        <article class="docs-not-found__card">
          <p class="docs-not-found__card-label">{{ copy.routesLabel }}</p>
          <ul class="docs-not-found__list">
            <li><a :href="actions.primary">{{ copy.primary }}</a></li>
            <li><a :href="actions.overview">{{ copy.overview }}</a></li>
            <li><a :href="actions.glossary">{{ copy.glossary }}</a></li>
            <li><a :href="actions.mainSite">{{ copy.mainSite }}</a></li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.docs-not-found {
  margin: 0 auto;
  width: 100%;
  max-width: 1220px;
  padding: 28px 20px 78px;
}

.docs-not-found__panel {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--docs-panel-border);
  border-radius: 32px;
  background: var(--docs-panel-bg);
  box-shadow: var(--docs-panel-shadow);
  padding: 34px;
}

.docs-not-found__panel::before {
  content: "";
  position: absolute;
  inset: 0 auto auto 0;
  width: min(48%, 420px);
  height: 240px;
  background: radial-gradient(circle at top left, rgba(123, 195, 255, 0.18), transparent 72%);
  pointer-events: none;
}

.docs-not-found__hero,
.docs-not-found__grid {
  position: relative;
  z-index: 1;
}

.docs-not-found__brand {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 22px;
}

.docs-not-found__brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 82px;
  height: 82px;
  padding: 12px;
  border: 1px solid rgba(40, 66, 102, 0.76);
  border-radius: 24px;
  background:
    radial-gradient(circle at 28% 22%, rgba(123, 195, 255, 0.16), transparent 46%),
    linear-gradient(180deg, rgba(16, 27, 44, 0.98) 0%, rgba(10, 18, 31, 0.98) 100%);
  box-shadow: 0 22px 54px rgba(0, 0, 0, 0.22);
}

.docs-not-found__brand-title,
.docs-not-found__brand-subtitle,
.docs-not-found__badge,
.docs-not-found__lead,
.docs-not-found__card-label,
.docs-not-found__card p,
.docs-not-found__list {
  margin: 0;
}

.docs-not-found__brand-title {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.docs-not-found__brand-subtitle {
  margin-top: 6px;
  max-width: 56ch;
  color: var(--vp-c-text-3);
  line-height: 1.6;
}

.docs-not-found__badge {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid rgba(90, 173, 255, 0.34);
  border-radius: 999px;
  background: rgba(90, 173, 255, 0.12);
  color: #9ed1ff;
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.docs-not-found h1 {
  margin: 18px 0 0;
  max-width: 12ch;
  font-size: clamp(2.45rem, 5vw, 4.4rem);
  line-height: 0.98;
  letter-spacing: -0.06em;
  text-wrap: balance;
}

.docs-not-found__lead {
  margin-top: 18px;
  max-width: 64ch;
  color: var(--vp-c-text-2);
  font-size: 1.05rem;
  line-height: 1.78;
}

.docs-not-found__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 28px;
}

.docs-not-found__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  padding: 0 18px;
  border: 1px solid var(--docs-header-control-border);
  border-radius: 15px;
  background: var(--docs-header-control-bg);
  color: var(--vp-c-text-1);
  font-weight: 700;
  text-decoration: none;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.docs-not-found__button:hover,
.docs-not-found__button:focus-visible {
  border-color: var(--docs-header-control-hover-border);
  background: var(--docs-header-control-hover-bg);
  transform: translateY(-1px);
}

.docs-not-found__button:focus-visible {
  outline: 2px solid rgba(132, 194, 255, 0.72);
  outline-offset: 3px;
}

.docs-not-found__button--primary {
  border-color: transparent;
  background: linear-gradient(
    135deg,
    var(--docs-button-brand-start) 0%,
    var(--docs-button-brand-end) 100%
  );
  color: var(--docs-button-brand-text);
  box-shadow: 0 18px 38px rgba(18, 82, 173, 0.28);
}

.docs-not-found__button--primary:hover,
.docs-not-found__button--primary:focus-visible {
  background: linear-gradient(
    135deg,
    var(--docs-button-brand-hover-start) 0%,
    var(--docs-button-brand-hover-end) 100%
  );
}

.docs-not-found__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 32px;
}

.docs-not-found__card {
  padding: 22px;
  border: 1px solid rgba(36, 60, 92, 0.9);
  border-radius: 22px;
  background: rgba(12, 20, 35, 0.86);
}

.docs-not-found__card-label {
  display: block;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid rgba(38, 61, 96, 0.88);
  color: #94ccff;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.docs-not-found__card h2 {
  margin: 0 0 12px;
  font-size: 1.2rem;
  line-height: 1.24;
  letter-spacing: -0.03em;
}

.docs-not-found__card p {
  color: var(--vp-c-text-2);
  line-height: 1.72;
}

.docs-not-found__list {
  list-style: none;
  padding: 0;
  color: var(--vp-c-text-2);
}

.docs-not-found__list li + li {
  margin-top: 10px;
}

.docs-not-found__list a {
  color: #99ccff;
  text-decoration: none;
}

.docs-not-found__list a:hover,
.docs-not-found__list a:focus-visible {
  color: #eef7ff;
  text-decoration: underline;
}

@media (max-width: 960px) {
  .docs-not-found {
    padding: 22px 18px 72px;
  }

  .docs-not-found__panel {
    padding: 28px 24px;
    border-radius: 28px;
  }

  .docs-not-found__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 639px) {
  .docs-not-found {
    padding: 16px 12px 64px;
  }

  .docs-not-found__panel {
    padding: 22px 16px;
    border-radius: 22px;
  }

  .docs-not-found__brand {
    align-items: flex-start;
    gap: 14px;
  }

  .docs-not-found__brand-mark {
    width: 68px;
    height: 68px;
    border-radius: 20px;
  }

  .docs-not-found__brand-title {
    font-size: 1.32rem;
  }

  .docs-not-found__actions {
    flex-direction: column;
  }

  .docs-not-found__button {
    width: 100%;
  }
}
</style>
