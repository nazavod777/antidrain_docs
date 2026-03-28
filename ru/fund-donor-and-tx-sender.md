---
title: Fund Donor и TX Sender
description: "Как экраны Fund Donor и TX Sender превращают подготовленный AntiDrain plan в профинансированный, симулированный и отправленный Recovery flow."
---

# Fund Donor и TX Sender

Эти два экрана превращают подготовленный план в исполнимый **Recovery flow**.

Для новичка главное запомнить одно:

- **Fund Donor** объясняет, сколько ещё нужно donor wallet
- **TX Sender** — это единственный экран, где происходит реальная отправка

## Fund Donor: что этот экран делает на самом деле

Fund Donor ничего не отправляет.

Он считает текущий donor funding snapshot для плана, который был собран в TX Builder.

Этот snapshot может включать:

- service fee
- dispatcher deploy reserve
- rescue execution reserve
- итоговый sender funding target

## Что означают основные карточки

### Donor Balance

Текущий нативный баланс donor wallet для выбранного network context.

### Service Fee

Текущий native-denominated service fee quote, если эта комиссия вообще применяется к выбранному route и network context.

### Staged Gas Reserve

Gas reserve, который donor wallet сейчас должен покрывать по расчёту AntiDrain.

В зависимости от route и возможностей RPC туда может входить:

- deploy gas
- execute gas
- или только та стадия, которую сейчас можно посчитать безопасно

### Total Sender Funding Target

Текущий суммарный native target, зарезервированный под TX Sender.

Это самое важное число на шаге donor funding.

## Почему estimate может быть staged

Некоторые расчёты внутри **Recovery flow** нельзя посчитать полностью в один момент.

Примеры:

- stage 1 может покрывать dispatcher deployment
- stage 2 может покрывать rescue execution после того, как deployment context станет понятнее

Поэтому важно читать status copy, а не только смотреть на одно число и считать, что оно уже обязано быть финальным.

## State override и fallback простыми словами

Если RPC поддерживает state overrides, AntiDrain может заранее точнее оценить более поздние execution-requirements.

Если RPC этого не умеет или делает это ненадёжно, приложение уходит в staged path:

- сначала считает то, что можно понять безопасно
- потом дооценивает более поздний execution step уже в TX Sender

Это нормальное поведение, а не автоматический признак ошибки.

## Почему required top-up может быть нулевым

Fund Donor может показать, что donor top-up не нужен.

И это может быть валидно.

Частые причины:

- donor wallet уже имеет достаточно нативного баланса
- текущий route на этой стадии не требует дополнительного donor funding
- service fee может быть покрыт за счёт unique compromised wallets в текущем плане

Не надо автоматически считать ноль багом.

## Transfer All Native и donor funding

Transfer All Native ведёт себя особым образом:

- native sweep происходит во время исполнения
- 20% уходит в fee side
- 80% идёт на donor wallet
- сама эта комиссия берётся из swept compromised-wallet balance

Если в браузере сохранён партнёрский адрес, эти 20% делятся как 15% протоколу и 5% сохранённому партнёрскому адресу.

Поэтому Transfer All Native нельзя трактовать как обычную donor-funded строку пополнения.

## Что делать на экране Fund Donor

1. убедиться, что отображается правильный donor wallet
2. посмотреть donor balance
3. посмотреть required top-up
4. прочитать funding status copy
5. при необходимости пополнить donor wallet до перехода в TX Sender

## TX Sender: финальный экран исполнения

TX Sender — это место, где prepared flow реально:

- симулируется
- проходит gas-check
- подписывается
- отправляется
- мониторится до финализации

Это последний шаг перед on-chain execution.

## Для чего нужен execution log

Execution log — один из самых полезных блоков во всём приложении.

Он показывает:

- какой stage сейчас выполняется
- прошла ли simulation
- пришлось ли использовать fallback или retry
- менялся ли gas
- ушёл ли transaction hash в сеть и был ли он финализирован
- почему произошёл failure

Игнорировать лог нельзя.

Сайт также позволяет:

- скопировать лог
- сохранить лог
- очистить лог

Сохранять лог полезно, если потом понадобится разбирать, что именно произошло.

## Что TX Sender может делать простыми словами

В зависимости от route, TX Sender может:

- запускать pre-send undelegation simulation
- deploy'ить dispatcher
- делать rescue simulation
- подбирать gas limits с fallback logic
- подписывать EIP-7702 authorizations
- broadcast'ить transactions
- ждать receipts по transaction hash

Для новичка ключевая мысль такая:

TX Sender не "делает что-то лишнее". Он выполняет тот staged plan, который действительно нужен выбранному route.

## Почему TX Sender может вернуть вас в Fund Donor

Это важно.

Если во время отправки выясняется, что donor funding уже недостаточен, приложение может вернуть вас обратно в Fund Donor.

Частые причины:

- изменилась оценка gas
- нода вернула insufficient funds
- для безопасности понадобился более высокий gas limit

Это защитное поведение, а не случайный откат назад.

## Обработка out-of-gas

Если sender видит вероятный out-of-gas scenario, AntiDrain может:

- объяснить, что транзакция упала из-за недостаточного gas
- предложить более высокий gas limit
- пересчитать donor funding requirement
- повторить flow уже с обновлённым gas limit

Поэтому sender — это больше, чем простая кнопка "Send".

## Simulation fallback и ограничения RPC

Иногда текущий RPC pool не поддерживает идеальное simulation behavior.

В таких случаях приложение может:

- использовать **State override**, если он доступен
- переключиться на direct simulation
- продолжить с heuristic gas planning, если некоторые RPC неверно симулируют **Recovery flow**

Это не означает "дальше всё наугад". Это означает, что приложение старается оставаться устойчивым при разном поведении нод.

## Что проверить перед нажатием Send

Убедитесь, что:

- donor wallet профинансирован достаточно
- выбранная сеть верна
- выбранный RPC подходит вашему risk level
- route по-прежнему соответствует кейсу
- адреса получателей правильные
- token / NFT / pool selections правильные
- beta-shortcut всё ещё выглядит адекватно

## Что делать после success

После успешного **Recovery flow**:

- прочитайте финальный sender status
- при необходимости сохраните execution log
- перейдите в Donor Assets и проверьте остатки donor wallet

## Что делать после failure

Не нужно сразу панически жать retry.

Лучше сделать так:

1. прочитать execution log
2. понять, проблема в funds, gas, simulation или route data
3. если приложение вернуло вас назад, пересмотреть Fund Donor
4. если сам route выглядит неверно, вернуться в TX Builder

Следующая страница:

- [Donor Assets](./donor-assets)
