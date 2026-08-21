---
title: Комиссии сервиса
description: Подробное объяснение типов комиссий и условий их появления при rescue-операциях.
---

# Комиссии сервиса

Эта страница объясняет, какие комиссии может показать AntiDrain и в каких случаях они появляются.

::: info Газ ≠ комиссия сервиса
Комиссия сети за газ не является комиссией AntiDrain. Газ платится сети за выполнение транзакции. Комиссия сервиса, если она есть, показывается отдельно до отправки.
:::

В AntiDrain есть два основных типа комиссий.

## 1. Token rescue fee

Это комиссия в токене, который спасается.

Обычно она применяется к fee-bearing token rescue, когда сайт или контракт забирает процент от фактически спасенной суммы.

Доля получателя не зависит от того, активна ли affiliate-ссылка — меняется только
то, как делится комиссия внутри.

| Кому | Без affiliate | С активной affiliate-ссылкой |
| --- | --- | --- |
| Пользователь / получатель | 80% | 80% |
| Protocol | 20% | 15% |
| Affiliate | — | 5% |

**Примеры:**

- Спасается 100 USDT: получатель получает 80 USDT, комиссия 20 USDT.
- При активной affiliate-ссылке из этих 20 USDT affiliate получает 5 USDT, protocol получает 15 USDT.
- Спасается 1,000 TOKEN: получатель получает 800 TOKEN, общая token fee 200 TOKEN.

## Когда появляется token rescue fee

**Может появиться:**

- ERC-20 token rescue в Custom TX Builder, если выбран fee-bearing transfer.
- ERC-20 transfer-all, когда комиссия считается от фактического баланса на момент исполнения.
- Permit Rescue, если выбран режим, где сумма берется от баланса на момент исполнения.
- DeBank/Bundler token transfer, если конкретный route использует fee split.
- DeBank native transfer-all, если route поддерживает такой split.

**Не применяется:**

- Remove Delegation (только снимает EIP-7702 delegation).
- Permit Rescue отправляет exact amount без fee-bearing balance-at-execution режима.
- Действие не выводит токены или нативный баланс через fee split.

## 2. Native service fee

Это отдельная комиссия в нативной монете сети: ETH, BNB, POL, AVAX и так далее.

Сайт считает её в fee units. Один fee unit равен $5. Потом сайт переводит эту сумму в нативную монету по текущей цене.

**Примеры расчёта:**

- 1 fee unit = $5
- 2 fee units = $10
- 3 fee units = $15

**С активной affiliate-ссылкой:**

- Protocol получает 75%.
- Affiliate получает 25%.

Например, если native service fee равна $10, affiliate reward равен $2.50 в нативной монете.

## Когда появляется native service fee

Native service fee может появиться там, где сервис готовит более сложное действие, а не обычный token fee.

**В Custom TX Builder:**

- Raw custom call без ERC-20/NFT transfer: 1 fee unit за каждый raw call.
- ERC-721 transfer: 1 fee unit за каждый NFT transfer.
- ERC-1155 transfer: 1 fee unit за каждый NFT transfer.
- ERC-20 transfer обычно использует token fee, а не native service fee.
- Если batch смешанный и содержит token/NFT transfer, raw custom calls в этом же batch могут не добавлять отдельную native service fee.

**В DeBank Withdraw:**

- Selected pool action: 1 fee unit за каждый выбранный pool.
- Raw call: 1 fee unit за каждый raw call.
- Обычные token transfers обычно не добавляют native service fee.

## Когда native service fee равна нулю

Native service fee должна быть 0, если выбранный flow не требует её.

**Обычно это:**

- Remove Delegation.
- Permit Rescue без native service fee.
- Обычный fee-bearing token rescue, где комиссия уже берется токеном.
- DeBank/Bundler token transfer без raw/pool/native service-fee action.

## Как сайт считает сумму в нативной монете

Сначала сайт считает fee units. Потом умножает их на $5.

После этого сайт пытается получить цену нативной монеты через price providers и пересчитать USD в ETH/BNB/POL/другую монету.

Если цена недоступна, сеть кастомная или символ монеты не поддерживается, сайт может использовать fallback-оценку. В таком случае сумма может считаться от estimate gas cost, а не от точной цены $5 за unit.

Если transaction plan уже содержит зафиксированную service fee, Fund Donor и Send должны использовать именно эту зафиксированную сумму.

## Где смотреть перед отправкой

::: warning Проверьте все комиссии перед отправкой
Если комиссия выглядит неожиданно, не отправляйте транзакцию. Вернитесь к Build или Simulation, проверьте выбранный action и route.
:::

Перед отправкой проверьте:

- Выбранную сеть.
- Gas reserve.
- Native value, если транзакция отправляет нативную монету.
- Token fee, если rescue забирает процент в токене.
- Native service fee, если она есть.
- Итоговую сумму, которую нужно положить на donor wallet.
- Affiliate split, если активна affiliate-ссылка.

## Дальше

- [Партнёрская ссылка](/ru/affiliate) — как делится комиссия между protocol и партнёром.
- [Rescue-сценарии](/ru/rescue-actions) — к каким сценариям какая комиссия применяется.
- [Словарь](/ru/glossary#edinitsa-komissii-fee-unit) — что такое единица комиссии.
