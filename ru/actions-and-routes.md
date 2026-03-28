---
title: Действия и маршруты
description: "Как выбрать правильный маршрут AntiDrain: undelegation, TX Builder, token transfer или pool withdrawal, и что меняется после выбора."
---

# Действия и маршруты

Эта страница объясняет, как выбрать правильный **Route** на экране **Actions**.

Выбор **Route** важен, потому что после него меняется весь остальной **Recovery flow**.

## Почему Route действительно важен

AntiDrain поддерживает несколько **Route**.

Если выбрать не тот **Route**:

- prepared plan может не совпасть с вашим реальным кейсом
- builder может начать ждать не те input
- вы можете использовать слишком узкий shortcut для более широкой проблемы

## Route 1: Remove EIP-7702 Delegation

Это узкий standalone Route для снятия делегации.

Используйте его только если одновременно верны оба условия:

1. приватный ключ compromised wallet не утёк к атакующему
2. основная проблема — именно вредоносная EIP-7702-делегация

### Когда этот Route подходит хорошо

- вы подписали вредоносное действие в wallet UI
- теперь кошелёк делегирован не так, как вы хотели
- сейчас вы не собираетесь двигать токены, NFT, claims или custom calldata

### Когда этот Route выбирать не нужно

- если сам private key уже мог утечь
- если вам нужно двигать активы
- если нужен claim, unwrap, unstake или другой contract call
- если вы не до конца понимаете, что вообще произошло

Если хотя бы один пункт звучит правдоподобно, используйте **TX Builder**.

## Route 2: TX Builder

Это главный advanced Route и самый безопасный общий fallback.

Используйте его, когда вам нужны:

- claims
- airdrops
- custom contract calls
- ERC-20 transfers
- ERC-721 transfers
- ERC-1155 transfers
- несколько разных действий в одной последовательности

### Почему TX Builder — лучший safe fallback

TX Builder даёт максимум явного контроля.

Именно поэтому он лучше подходит, когда:

- ситуация не до конца понятна
- нужно больше одного действия
- вы не доверяете shortcut Route
- вы хотите вручную проверить каждый prepared action

Важно:

Для builder-based recovery send EIP-7702-aware handling уже встроен в финальный send-path. Во многих случаях отдельный standalone undelegation заранее не нужен.

## Route 3: Tokens Transfer [BETA]

Это упрощённый ERC-20 sweep Route.

Используйте его, когда одновременно верно следующее:

- вам нужен один общий recipient
- вы в основном хотите загрузить ERC-20 balances с одного или нескольких compromised wallets
- вам нужен более простой путь, чем ручная сборка transaction-by-transaction

### Хороший пример использования

"Мне нужно отправить выбранные ERC-20 balances с нескольких кошельков на один адрес и мне не нужен сложный mixed bundle."

### Когда этот Route не подходит

- если загруженные balances выглядят странно
- если кейс требует mixed operations
- если вам нужны custom contract calls
- если вы хотите полный field-by-field контроль

Если beta route перестал совпадать с задачей, пересоберите кейс через **TX Builder**.

## Route 4: Pool Withdrawal [BETA]

Это упрощённый Route для выбора pool positions.

Используйте его, когда:

- вам нужен один общий recipient
- вы хотите загрузить pool positions для одного или нескольких compromised wallets
- вы хотите быстрее выбрать prepared withdraw actions

### Хороший пример использования

"Мне нужен только pool-claim / pool-withdraw side этого recovery, и упрощённый Route совпадает с тем, что я вижу в протоколе."

### Когда этот route не подходит

- если список пулов выглядит неполным
- если simulation выглядит непоследовательно
- если shortcut не отражает фактическое protocol-action, которое вам нужно

В этом случае правильный fallback — **TX Builder**.

## Самое простое правило выбора Route

Если вы сомневаетесь, используйте такое правило:

> Если вы не можете уверенно сказать "private key не утёк, а проблема только в delegation", выбирайте **TX Builder**.

## Практический выбор

| Ситуация | Лучший Route |
| --- | --- |
| Вредоносная EIP-7702 signature, но private key не утёк | `Remove EIP-7702 Delegation` |
| Нужны mixed operations или ручной контроль | `TX Builder` |
| Нужен простой ERC-20 sweep на один recipient | `Tokens Transfer [BETA]` |
| Нужен простой pool-claim / pool-withdraw на один recipient | `Pool Withdrawal [BETA]` |

## Что меняется после выбора Route

Выбранный **Route** определяет, что именно TX Builder будет ожидать дальше.

### Remove EIP-7702 Delegation

TX Builder ждёт:

- network
- RPC
- compromised private keys для кошельков, с которых вы хотите снять delegation

### Основной route TX Builder

TX Builder ждёт:

- network
- RPC
- один или несколько compromised wallet entries
- один или несколько prepared operations

### Tokens Transfer [BETA]

TX Builder ждёт:

- network
- RPC
- один общий recipient
- compromised wallet entries
- загруженные ERC-20 balances для выбора

### Pool Withdrawal [BETA]

TX Builder ждёт:

- network
- RPC
- один общий recipient
- compromised wallet entries
- загруженные pool positions для выбора

## Что значит beta на практике

Это не значит "не использовать вообще".

Это значит:

- проверять результат внимательнее
- не пытаться "додавить" beta route, если он уже выглядит странно
- быть готовым уйти в `TX Builder`

## Частые ошибки при выборе Route

### Ошибка 1: выбирать undelegation только потому, что в истории фигурирует EIP-7702

Этот Route нужен только для узкого standalone cleanup case.

### Ошибка 2: выбирать shortcut, когда кейс реально mixed

Если вам нужен claim плюс transfer плюс, возможно, custom call, используйте TX Builder.

### Ошибка 3: продолжать Beta route, когда он уже перестал совпадать с кейсом

Правильное действие — остановиться и уйти в TX Builder.

## Перед уходом с экрана Actions

Убедитесь, что:

- выбранный **Route** совпадает с реальной проблемой
- вы понимаете, какие input будет ждать следующий экран
- вы не выбрали shortcut только потому, что он выглядит проще

Следующая страница:

- [TX Builder](./tx-builder)
