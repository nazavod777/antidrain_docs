---
title: TX Builder
description: "Как пользоваться AntiDrain TX Builder: выбрать chain и RPC, задать calls, проверить Calldata и собрать финальный план Recovery flow."
---

# TX Builder

TX Builder — это экран, на котором план **Recovery flow** становится конкретным.

Именно здесь вы перестаёте думать абстрактно в духе "мне нужно спасти кошелёк" и начинаете задавать:

- на какой сети
- через какой RPC
- из какого compromised wallet
- на какой recipient
- каким именно action type

## Чем управляет TX Builder

В зависимости от выбранного route, TX Builder может управлять:

- сетью
- RPC
- private keys compromised wallet
- списками кошельков для route
- Recipient Address
- contract addresses
- token IDs
- token amounts
- raw calldata
- execution-time native sweeps

## Верхняя часть страницы: network и RPC

Эти два блока важнее, чем обычно кажется новичкам.

### Network

Сначала выберите целевую EIP-7702 сеть.

Почему это важно:

- балансы зависят от chain
- token contracts зависят от chain
- chain ID должен совпадать с intended network context
- от этого зависят fee estimation и simulation

### RPC URL

RPC определяет, через какой node pool приложение будет читать данные, симулировать, оценивать gas и отправлять транзакции.

Используйте default bundled/public path только если он подходит вашему кейсу.

Для отслеживаемых или чувствительных recovery **MEV-protected или private RPC** обычно лучше.

## Route-specific поведение TX Builder

TX Builder выглядит не одинаково для всех маршрутов.

## Если выбран `Remove EIP-7702 Delegation`

Builder превращается в focused setup step для standalone undelegation.

Вы вводите:

- network
- RPC
- по одному compromised private key на строку

Правила хорошего ввода:

- один кошелёк на одну строку
- допустимы и `0x...`, и raw 64-hex formats
- убирайте дубликаты
- убедитесь, что каждый ключ относится к той сети и тому кошельку, с которым вы реально работаете

Этот route не предназначен для transfer-операций. Он нужен для standalone delegation cleanup.

## Если выбран `TX Builder`

Это режим ручного контроля.

Вы можете добавить одну или несколько transaction entries и выбрать их тип.

### Поддерживаемые типы транзакций

- `Custom TX Data`
- `Transfer Tokens (ERC-20)`
- `Transfer NFT (ERC-721)`
- `Transfer NFT (ERC-1155)`

Каждая entry получает свою вкладку, чтобы вы могли просматривать транзакции по одной.

## Разбор полей manual-entry по смыслу

### Compromised Wallet Private Key

Это секрет того кошелька, который будет авторизовывать или инициировать нужное действие.

Используйте именно private key нужного compromised wallet для этой entry.

Никогда не вставляйте сюда donor secret.

### Target Contract Address

Это адрес контракта, который будет вызван этой транзакцией.

Примеры:

- ERC-20 token contract
- NFT contract
- staking или pool contract
- другой protocol contract для custom-action

### Recipient Address

Это адрес, который должен получить актив.

Он появляется для transfer-style режимов вроде ERC-20, ERC-721 и ERC-1155.

Перед send-step его нужно перепроверять особенно внимательно.

### Value / Token Amount

Смысл зависит от типа транзакции:

- для custom transactions `Value` обычно означает нативную монету, отправляемую вместе с call
- для ERC-20 transfers это amount токена

### Token Decimals

Это важно для ERC-20 amount formatting.

Приложение часто умеет определить decimals автоматически, но с точки зрения docs важнее следующее:

- формат суммы зависит от decimals
- если decimals неверны, итоговый transfer amount тоже может оказаться неверным

### Token ID / IDs

Используется для ERC-721 и ERC-1155 transfer.

Примеры:

- один NFT ID
- список token IDs через запятую для ERC-1155 batch behavior

### Transfer Amount / Amounts

Используется для ERC-1155 quantities.

Если вы вводите несколько token IDs, количества должны соответствовать тому, что реально должно быть отправлено.

### Raw Transaction Data

Это поле calldata для режима custom transaction.

Используйте его, когда уже знаете точный contract call.

Если кодировать calldata вручную неудобно, используйте встроенный ABI Encoder.

## ERC-20 Transfer All

В ERC-20 режиме TX Builder умеет arm'ить **Transfer All** style behavior для этой token entry.

Это полезно, когда:

- amount должен определяться уже во время исполнения
- баланс может измениться между preparation и execution

Такой подход помогает оставлять claim -> transfer-all bundles рабочими.

## Transfer All Native

В AntiDrain есть отдельная логика **Transfer All Native** для уникальных authority wallets.

Главное поведение простыми словами:

- на каждый уникальный compromised wallet добавляется один execution-time native sweep
- sweep запускается после остальных prepared calls этого кошелька
- он удерживает 20% fee-side split
- оставшиеся 80% отправляет на donor wallet

Если в браузере сохранён партнёрский адрес, эти 20% делятся как 15% протоколу и 5% сохранённому партнёрскому адресу.

Почему это удобно:

- native balance может меняться во время **Recovery flow**
- итоговый sweep считается в момент исполнения, а не фиксируется слишком рано

## Если выбран `Tokens Transfer [BETA]`

TX Builder превращается в более простой ERC-20 sweep workspace.

Обычный порядок такой:

1. выбрать network
2. указать shared recipient
3. добавить один или несколько compromised wallet keys
4. загрузить token balances
5. выбрать те токены, которые реально нужно перевести

Используйте этот route только пока он явно соответствует задаче.

Если balances или validation выглядят странно, пересоберите кейс через основной TX Builder.

## Если выбран `Pool Withdrawal [BETA]`

TX Builder превращается в упрощённый workspace для выбора pool positions.

Обычный порядок такой:

1. выбрать network
2. указать shared recipient
3. добавить один или несколько compromised wallet keys
4. загрузить pool positions
5. выбрать те позиции или withdraw-actions, которые реально нужны

Поскольку этот route зависит от загруженных protocol-position данных, особенно важно сверять то, что вы видите, с реальной ситуацией в протоколе.

Если результат выглядит неполным, переносите кейс в основной TX Builder.

## ABI Encoder и Wei Converter

Эти утилиты встроены не просто так.

### ABI Encoder

Используйте его, когда:

- вы знаете нужный method
- вам нужен custom calldata
- вы хотите, чтобы сайт закодировал function input безопаснее, чем вручную

### Wei Converter

Используйте его, когда:

- нужно переводить human-readable units в raw integer units и обратно
- вы хотите проверить, выглядит ли amount правдоподобно

## Частые ошибки в TX Builder

### Ошибка 1: выбрать не ту сеть в самом начале

Если сеть неверна, дальше тоже всё начнёт выглядеть неверно.

### Ошибка 2: вставить не тот ключ в entry

Каждая entry должна использовать private key именно того compromised wallet, который реально владеет нужным активом или правом на action.

### Ошибка 3: продолжать beta-route, когда он уже не соответствует кейсу

Как только shortcut стал путать вас, нужно уходить в full TX Builder.

### Ошибка 4: забывать, что Transfer All Native работает позже

Это execution-time sweep, а не обычная ранняя статическая transfer-line.

## Что проверить перед выходом из TX Builder

Не нажимайте continue, пока всё это не верно:

- сеть выбрана правильно
- RPC выбран приемлемо
- compromised wallet input верный
- адреса получателей правильные
- token IDs и amounts правильные
- custom calldata совпадает с вашим намерением
- Transfer All Native включён только там, где вы действительно этого хотите

Следующая страница:

- [Fund Donor и TX Sender](./fund-donor-and-tx-sender)
