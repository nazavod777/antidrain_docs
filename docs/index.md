---
layout: page
title: AntiDrain Docs
description: Documentation for AntiDrain EVM wallet rescue workflows — in Russian and English.
sidebar: false
aside: false
---

<script setup>
import { onMounted, onUnmounted } from 'vue'

/**
 * Suppress the search shortcuts on this page only.
 *
 * VitePress builds one search index per locale and only loads the current
 * one. This page is the sole member of the root locale, so a search launched
 * here matches nothing but itself and reports "No results" for any real
 * query — it reads as broken search rather than as an empty scope.
 *
 * The button is hidden by CSS (`:has(.docs-landing)` in prose.css); Ctrl/Cmd+K
 * and `/` need this listener, because VitePress binds them at the document
 * level regardless of whether the button is visible. Capture phase plus
 * stopImmediatePropagation is what gets in front of that handler.
 *
 * Search is available on every real docs page, one click away through the
 * language cards below.
 */
const swallowSearchShortcuts = (event) => {
  const isSearchKey =
    (event.key === 'k' && (event.ctrlKey || event.metaKey)) || event.key === '/'
  if (!isSearchKey) return
  event.stopImmediatePropagation()
}

onMounted(() => document.addEventListener('keydown', swallowSearchShortcuts, true))
onUnmounted(() => document.removeEventListener('keydown', swallowSearchShortcuts, true))
</script>

<div class="docs-landing">

# AntiDrain Docs

<p class="docs-landing__lead">
AntiDrain is a browser-based EVM rescue workspace: prepare a donor wallet, choose a rescue action,
simulate the transaction, fund execution, and send the flow you reviewed.
<br>
AntiDrain — рабочая среда для ручного спасения EVM-кошельков: подготовьте кошелёк-донор,
выберите сценарий, проверьте транзакцию симуляцией и отправьте только то, что проверили.
</p>

<ul class="docs-cards docs-cards--lang">
<li><a class="docs-card" href="/ru/" hreflang="ru" lang="ru">
  <span class="docs-card__title">Русская документация</span>
  <span class="docs-card__text">Быстрый старт, правила безопасности, rescue-сценарии, комиссии, ошибки и решения.</span>
</a></li>
<li><a class="docs-card" href="/en/" hreflang="en" lang="en">
  <span class="docs-card__title">English documentation</span>
  <span class="docs-card__text">Quick start, safety rules, rescue actions, service fees, troubleshooting.</span>
</a></li>
</ul>

<p class="docs-landing__urgent">
  <strong>Wallet at risk right now?</strong>
  <a href="/en/beginner-guide">Start here (EN)</a> ·
  <a href="/ru/beginner-guide">Начните отсюда (RU)</a>
</p>

::: danger AntiDrain does not protect your wallet by itself / AntiDrain не защищает кошелёк сам
It does not monitor wallets in the background and does not block attacker transactions. You choose
every action, review it, and send it yourself. Use small test amounts first, and always check the
network, the recipient address, the simulation result and the fee before sending.

Он не следит за кошельком в фоне и не блокирует транзакции атакующего. Каждое действие выбираете,
проверяете и отправляете вы. Сначала пробуйте на маленьких суммах и всегда проверяйте сеть, адрес
получателя, результат симуляции и размер комиссии перед отправкой.
:::

</div>
