---
title: FAQ и устранение проблем
description: "Короткие ответы по locked steps, mismatch в estimations, пропавшим балансам, RPC-проблемам и другим частым ошибкам AntiDrain."
---

# FAQ и устранение проблем

## Почему следующий шаг заблокирован?

Приложение использует gated progression специально.

Частые причины:

- donor backup ещё не обработан
- route не выбран в Actions
- TX Builder ещё не завершён
- сеть или RPC ещё не определены
- funding snapshot ещё не готов

## Можно ли использовать свой donor wallet?

Да.

В Donor Wallet можно импортировать свой:

- donor private key
- donor mnemonic

Создавать новый donor wallet необязательно.

## Что будет, если обновить страницу?

Текущая вкладка может восстановить wallet и контекст **Recovery flow** из session storage после обычного refresh.

Это может помочь, но это не основной safety-system.

**Backup JSON** donor wallet всё равно обязателен.

## Что будет, если закрыть вкладку?

На активный session context нельзя рассчитывать как на что-то вечное.

Именно поэтому **Backup JSON** donor wallet настолько важен.

## Где создаются и хранятся wallet credentials?

Donor wallet создаётся локально в браузере.

В текущей реализации активный wallet и контекст **Recovery flow** могут оставаться в session текущей вкладки, пока вкладка не закрыта или session data не очищены.

## Какой route выбирать, если я только что-то вредоносное подписал?

Используйте `Remove EIP-7702 Delegation` только если:

- сам private key не утёк
- главная проблема именно в malicious delegation

Если нужно ещё и двигать активы, используйте TX Builder.

## Какой route выбирать, если нужны claim, transfer или mixed actions?

Используйте `TX Builder`.

Это более широкий и более явный **Route**.

## Что делать, если `Tokens Transfer [BETA]` или `Pool Withdrawal [BETA]` выглядят неправильно?

Не нужно пытаться "додавить" shortcut.

Сделайте так:

1. остановитесь
2. удержите в голове intended route logic
3. пересоберите тот же кейс через full `TX Builder`

## Почему donor funding выглядит слишком маленьким или слишком большим?

Проверьте такие варианты:

- выбран не тот route
- выбрана не та сеть
- выбран не тот RPC
- экран всё ещё показывает staged estimate
- Transfer All Native меняет интерпретацию сумм
- поддержка **State override** оказалась недоступна и включился fallback path

## Почему Fund Donor говорит, что top-up не нужен?

Это может быть валидно.

Частые причины:

- на donor wallet уже достаточно нативной монеты
- текущая стадия **Recovery flow** не требует дополнительного donor funding
- service fee может быть покрыт из других источников текущего плана

## Почему TX Sender может вернуть меня обратно в Fund Donor?

Потому что sender может обнаружить, что реальная required amount уже выше, чем была более ранняя estimate.

Частые причины:

- gas limit вырос
- node вернула insufficient funds
- потребовался более безопасный fallback planning

Это защитное поведение.

## Что делать, если TX Sender пишет insufficient funds?

Обычно это означает, что donor wallet уже не покрывает реальную gas или execution requirement.

Правильный порядок действий:

1. вернуться в Fund Donor
2. дать funding snapshot пересчитаться
3. при необходимости пополнить donor wallet

## Что делать, если sender сообщает out of gas?

Это значит, что gas limit оказался слишком низким для фактического execution path.

AntiDrain может предложить более высокий gas limit и затем пересчитать funding requirement перед retry.

## Почему simulation могла пройти, а реальная отправка всё равно упала?

Simulation повышает безопасность, но не является идеальной.

Причины могут быть такими:

- node behavior отличается
- некоторые RPC неверно симулируют **Recovery flow**
- изменилась fee environment
- relevant state изменился между estimate и real send

Именно поэтому приложение использует fallback logic и execution log.

## Что делать, если сеть unsupported для pricing?

Приложение может пропустить USD-to-native fee quote, потому что не может безопасно оценить цену native token на этой сети.

Это не обязательно делает route невалидным.

Это означает, что pricing-layer там менее информативен.

## Почему donor cleanup withdrawal всё ещё заблокирован?

Частые причины:

- сеть не выбрана
- custom RPC невалиден в custom-mode
- баланс ещё не обновлён
- recipient невалиден
- token contract невалиден
- balance слишком мал даже для газа

## Почему для token withdrawal всё равно нужен native balance?

Потому что ERC-20 withdrawal — это всё равно blockchain transaction.

А транзакции требуют gas, который платится нативной монетой сети.

## Нужно ли сохранять TX Sender log?

Да, часто это хорошая идея.

Он пригодится, если потом понадобится:

- восстановить, что именно произошло
- сравнить retry-attempts
- показать failure более техническому человеку

## Может ли AntiDrain откатить уже отправленную не туда транзакцию?

Обычно нет.

AntiDrain помогает подготовить и провести **Recovery flow**, но не меняет сами правила блокчейна.

Подтверждённые on-chain ошибки обычно не обратимы.

## Главный совет для новичка

Если есть сомнения, выбирайте путь с большим контролем:

- замедлитесь
- ещё раз прочитайте route notes
- перепроверьте адреса
- при необходимости уйдите в TX Builder

Лучше двигаться медленнее, чем быстро отправить неправильный **Recovery flow**.
