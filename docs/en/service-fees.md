---
title: Service Fees
description: Explanation of AntiDrain fee types, when they apply, and how they are calculated and split.
---

# Service Fees

This page explains which fees AntiDrain can show and when they appear.

::: info Gas Is Not a Service Fee

Network gas is not an AntiDrain service fee. Gas is paid to the network for running the transaction. A service fee, if present, is shown separately before sending.

:::

AntiDrain has two main fee types.

## 1. Token Rescue Fee

This is a fee in the token being rescued.

It usually applies to a fee-bearing token rescue, where the site or contract takes a percentage of the amount actually rescued.

| To Whom | Without Affiliate | With Active Affiliate |
| --- | --- | --- |
| User / Recipient | 80% | 80% |
| Protocol | 20% | 15% |
| Affiliate | — | 5% |

Examples:

- 100 USDT is rescued: recipient receives 80 USDT, total fee is 20 USDT
- With an active affiliate link, affiliate receives 5 USDT and protocol receives 15 USDT
- 1,000 TOKEN is rescued: recipient receives 800 TOKEN, total token fee is 200 TOKEN

## When Token Rescue Fee Appears

Token rescue fee can appear in these cases:

- ERC-20 token rescue in Custom TX Builder when a fee-bearing transfer is selected
- ERC-20 transfer-all, where the fee is calculated from the real balance at execution time
- Permit Rescue when the selected mode uses balance-at-execution
- DeBank/Bundler token transfer when that route uses fee split
- DeBank native transfer-all when that route supports this split

Token rescue fee usually does not apply when:

- Remove Delegation only clears EIP-7702 delegation
- Permit Rescue sends an exact amount without a fee-bearing balance-at-execution mode
- The action does not move tokens or native balance through a fee split

## 2. Native Service Fee

This is a separate fee in the network's native coin: ETH, BNB, POL, AVAX, and so on.

The site calculates it in fee units. One fee unit is $5. Then the site converts that amount into the native coin using the current price.

Examples:

- 1 fee unit = $5
- 2 fee units = $10
- 3 fee units = $15

If an affiliate link is active, native service fee is split this way:

- Protocol receives 75%
- Affiliate receives 25%

For example, if native service fee is $10, the affiliate reward is $2.50 in the native coin.

## When Native Service Fee Appears

Native service fee can appear when the service prepares a more complex action instead of a normal token fee.

In Custom TX Builder:

- Raw custom call without ERC-20/NFT transfer: 1 fee unit for each raw call
- ERC-721 transfer: 1 fee unit for each NFT transfer
- ERC-1155 transfer: 1 fee unit for each NFT transfer
- ERC-20 transfer by itself usually uses token fee, not native service fee
- If the batch is mixed and contains token/NFT transfer, raw custom calls in the same batch may not add a separate native service fee

In DeBank Withdraw:

- Selected pool action: 1 fee unit for each selected pool
- Raw call: 1 fee unit for each raw call
- Regular token transfers usually do not add native service fee

## When Native Service Fee Is Zero

Native service fee should be 0 when the selected flow does not require it.

Usually this means:

- Remove Delegation
- Permit Rescue without native service fee
- Normal fee-bearing token rescue where the fee is already taken in the token
- DeBank/Bundler token transfer without raw/pool/native service-fee action

## How the Site Calculates the Native Amount

First, the site counts fee units. Then it multiplies them by $5.

After that, the site tries to get the native coin price from price providers and convert USD into ETH/BNB/POL/another native coin.

If the price is unavailable, the network is custom, or the coin symbol is unsupported, the site may use a fallback estimate. In that case the amount can be based on estimated gas cost, not on the exact $5 per unit price.

If the transaction plan already contains a locked service fee, Fund Donor and Send should use that locked amount.

## What to Check Before Sending

::: warning Check All Fees Before Sending

If a fee looks unexpected, do not send immediately. Go back to Build or Simulation and check the selected action and route.

:::

Before sending, check:

- Selected network
- Gas reserve
- Native value, if the transaction sends native coin
- Token fee, if the rescue takes a percentage in the token
- Native service fee, if present
- Total amount that must be funded to the donor wallet
- Affiliate split, if an affiliate link is active

## Next

- [Affiliate Link](/en/affiliate) — how the fee is split between protocol and affiliate.
- [Rescue Actions](/en/rescue-actions) — which fee applies to which action.
- [Glossary](/en/glossary#fee-unit) — what a fee unit is.
