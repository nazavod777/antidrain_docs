---
title: TX Builder
description: "How to use AntiDrain TX Builder: choose chain and RPC, define calls, review calldata, and prepare the final recovery plan."
---

# TX Builder

TX Builder is the screen where the recovery plan becomes concrete.

This is where you stop thinking in vague terms like "I need to rescue the wallet" and start defining:

- on which network
- through which RPC
- from which compromised wallet
- to which recipient
- using which exact action type

## What TX Builder controls

Depending on the selected route, TX Builder can control:

- network
- RPC
- compromised wallet private keys
- route-specific wallet lists
- recipients
- contract addresses
- token IDs
- token amounts
- raw calldata
- execution-time native sweeps

## The top of the page: network and RPC

These two controls matter more than most beginners expect.

### Network

Choose the target EIP-7702 chain first.

Why it matters:

- balances depend on the chain
- token contracts depend on the chain
- chain ID must match the intended network context
- fee estimation and simulation depend on it

### RPC URL

The RPC defines which node pool the app will use to read data, simulate, estimate, and send.

Use the default bundled/public path only if it is acceptable for your situation.

For watched or time-sensitive recoveries, a MEV-protected or private RPC is usually the better operational choice.

## Route-specific TX Builder behavior

TX Builder does not look exactly the same for every route.

## If you selected `Remove EIP-7702 Delegation`

The builder becomes a focused setup step for standalone undelegation.

You provide:

- network
- RPC
- one compromised private key per line

Good input rules:

- one wallet per line
- both `0x...` and raw 64-hex formats are accepted
- remove duplicates
- make sure every key belongs to the chain context you actually mean

This route is not for transfers. It is for standalone delegation cleanup.

## If you selected `TX Builder`

This is the manual-control mode.

You can add one or more transaction entries and choose their type.

### The supported transaction types

- `Custom TX Data`
- `Transfer Tokens (ERC-20)`
- `Transfer NFT (ERC-721)`
- `Transfer NFT (ERC-1155)`

Each entry gets its own tab, so you can review transactions one by one.

## Field-by-field guide for custom/manual entries

### Compromised Wallet Private Key

This is the secret for the wallet that will authorize or originate the action in the recovery flow.

Use the exact compromised wallet key for that entry.

Do not paste the donor secret here.

### Target Contract Address

This is the contract the transaction will call.

Examples:

- ERC-20 token contract
- NFT contract
- staking or pool contract
- another protocol contract for a custom action

### Recipient Address

This is where the asset should go.

It appears for transfer-style modes such as ERC-20, ERC-721, and ERC-1155.

Double-check this field every time.

### Value / Token Amount

The meaning depends on the transaction type:

- for custom transactions, `Value` usually means native coin sent with the call
- for ERC-20 transfers, it means the token amount

### Token Decimals

This matters for ERC-20 amounts.

The app can often resolve decimals automatically, but docs-wise the important thing is:

- token amount formatting depends on decimals
- if decimals are wrong, the effective transfer amount can also be wrong

### Token ID / IDs

Used for ERC-721 and ERC-1155 transfers.

Examples:

- single NFT ID
- comma-separated list of token IDs for ERC-1155 batch behavior

### Transfer Amount / Amounts

Used for ERC-1155 transfer quantities.

If you enter multiple token IDs, the quantities must match what the transfer is supposed to send.

### Raw Transaction Data

This is the calldata field for custom transaction mode.

Use it when you already know the contract call you want.

If you do not know how to encode it by hand, use the built-in ABI Encoder.

## ERC-20 Transfer All

In ERC-20 mode, TX Builder can arm **Transfer All** style behavior for that token entry.

This is useful when:

- you want the amount resolved at execution time
- balance can change between preparation and execution

This helps keep claim -> transfer-all style bundles valid.

## Transfer All Native

AntiDrain also has a separate **Transfer All Native** concept for unique authority wallets.

Important plain-language behavior:

- it appends one execution-time native sweep per unique compromised wallet
- it runs after that wallet's other prepared calls
- it applies a 20% fee-side split
- it routes the remaining 80% to the donor wallet

If the browser has a saved partner address, that 20% is split as 15% to the protocol and 5% to the saved partner address.

Why this is useful:

- native balance can change during the flow
- the sweep is calculated at execution time, not frozen too early

## If you selected `Tokens Transfer [BETA]`

TX Builder becomes a simpler ERC-20 sweep workspace.

The usual flow is:

1. choose the network
2. set the shared recipient
3. add one or more compromised wallet keys
4. fetch token balances
5. select the token balances you actually want to transfer

Use this route only while it still reflects what you want clearly.

If the fetched balances or validation look wrong, rebuild the same case in main TX Builder mode.

## If you selected `Pool Withdrawal [BETA]`

TX Builder becomes a simpler pool-position selection workspace.

The usual flow is:

1. choose the network
2. set the shared recipient
3. add one or more compromised wallet keys
4. fetch pool positions
5. select the positions or prepared withdraw actions you want

Because this route relies on fetched protocol-position data, it is especially important to compare what you see with the actual protocol reality.

If the result looks incomplete, move the case into main TX Builder.

## ABI Encoder and Wei Converter

These utilities exist for a reason.

### ABI Encoder

Use this when:

- you know the method you need
- you need custom calldata
- you want the site to encode function input more safely than doing it by hand

### Wei Converter

Use this when:

- you need to move between human-readable units and raw integer units
- you are checking whether an amount looks plausible

## Common TX Builder mistakes

### Mistake 1: choosing the wrong network first

If the network is wrong, everything downstream can look wrong too.

### Mistake 2: pasting the wrong key into an entry

Every entry should use the compromised wallet key that actually owns or controls the asset/action you mean.

### Mistake 3: using a beta route after it no longer matches the case

Switch to full TX Builder as soon as the shortcut becomes confusing.

### Mistake 4: forgetting that Transfer All Native runs later

It is an execution-time sweep, not a simple early static transfer line.

## Before leaving TX Builder

Do not continue until all of this is true:

- network is correct
- RPC choice is acceptable
- compromised wallet inputs are correct
- recipients are correct
- token IDs and amounts are correct
- custom calldata matches your intention
- enabled Transfer All Native sweeps are enabled only where you really want them

Next page:

- [Fund Donor and TX Sender](./fund-donor-and-tx-sender)
