# Комиссии сервиса

Эта страница объясняет, какие комиссии может показать AntiDrain и в каких случаях они появляются.

Важно: комиссия сети за газ не является комиссией AntiDrain. Газ платится сети за выполнение транзакции. Комиссия сервиса, если она есть, показывается отдельно до отправки.

В AntiDrain есть два основных типа комиссий.

## 1. Token rescue fee

Это комиссия в токене, который спасается.

Обычно она применяется к fee-bearing token rescue, когда сайт или контракт забирает процент от фактически спасенной суммы.

Стандартный split:

- пользователь/получатель получает `80%`;
- всего комиссия составляет `20%`;
- если affiliate wallet не активен, protocol получает все `20%`;
- если affiliate wallet активен, protocol получает `15%`, affiliate получает `5%`.

Примеры:

- спасается `100 USDT`: получатель получает `80 USDT`, комиссия `20 USDT`;
- при активной affiliate-ссылке из этих `20 USDT` affiliate получает `5 USDT`, protocol получает `15 USDT`;
- спасается `1,000 TOKEN`: получатель получает `800 TOKEN`, общая token fee `200 TOKEN`.

## Когда появляется token rescue fee

Token rescue fee может появиться в таких случаях:

- ERC-20 token rescue в Custom TX Builder, если выбран fee-bearing transfer;
- ERC-20 transfer-all, когда комиссия считается от фактического баланса на момент исполнения;
- Permit Rescue, если выбран режим, где сумма берется от баланса на момент исполнения;
- DeBank/Bundler token transfer, если конкретный route использует fee split;
- DeBank native transfer-all, если route поддерживает такой split.

Token rescue fee обычно не применяется, если:

- Remove Delegation только снимает EIP-7702 delegation;
- Permit Rescue отправляет exact amount без fee-bearing balance-at-execution режима;
- действие не выводит токены или нативный баланс через fee split.

## 2. Native service fee

Это отдельная комиссия в нативной монете сети: ETH, BNB, POL, AVAX и так далее.

Сайт считает её в fee units. Один fee unit равен `$5`. Потом сайт переводит эту сумму в нативную монету по текущей цене.

Примеры:

- `1` fee unit = `$5`;
- `2` fee units = `$10`;
- `3` fee units = `$15`.

Если активна affiliate-ссылка, native service fee делится так:

- protocol получает `75%`;
- affiliate получает `25%`.

Например, если native service fee равна `$10`, affiliate reward равен `$2.50` в нативной монете.

## Когда появляется native service fee

Native service fee может появиться там, где сервис готовит более сложное действие, а не обычный token fee.

В Custom TX Builder:

- raw custom call без ERC-20/NFT transfer: `1` fee unit за каждый raw call;
- ERC-721 transfer: `1` fee unit за каждый NFT transfer;
- ERC-1155 transfer: `1` fee unit за каждый NFT transfer;
- ERC-20 transfer сам по себе обычно использует token fee, а не native service fee;
- если batch смешанный и содержит token/NFT transfer, raw custom calls в этом же batch могут не добавлять отдельную native service fee.

В DeBank Withdraw:

- selected pool action: `1` fee unit за каждый выбранный pool;
- raw call: `1` fee unit за каждый raw call;
- обычные token transfers обычно не добавляют native service fee.

## Когда native service fee равна нулю

Native service fee должна быть `0`, если выбранный flow не требует её.

Обычно это:

- Remove Delegation;
- Permit Rescue без native service fee;
- обычный fee-bearing token rescue, где комиссия уже берется токеном;
- DeBank/Bundler token transfer без raw/pool/native service-fee action.

## Как сайт считает сумму в нативной монете

Сначала сайт считает fee units. Потом умножает их на `$5`.

После этого сайт пытается получить цену нативной монеты через price providers и пересчитать USD в ETH/BNB/POL/другую монету.

Если цена недоступна, сеть кастомная или символ монеты не поддерживается, сайт может использовать fallback-оценку. В таком случае сумма может считаться от estimate gas cost, а не от точной цены `$5` за unit.

Если transaction plan уже содержит зафиксированную service fee, Fund Donor и Send должны использовать именно эту зафиксированную сумму.

## Где смотреть перед отправкой

Перед отправкой проверьте:

- выбранную сеть;
- gas reserve;
- native value, если транзакция отправляет нативную монету;
- token fee, если rescue забирает процент в токене;
- native service fee, если она есть;
- итоговую сумму, которую нужно положить на donor wallet;
- affiliate split, если активна affiliate-ссылка.

Если комиссия выглядит неожиданно, не отправляйте транзакцию сразу. Вернитесь к Build или Simulation, проверьте выбранный action и route.
