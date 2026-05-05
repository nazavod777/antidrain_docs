# Service Fees

This page explains which fees AntiDrain can show and when they appear.

Important: network gas is not an AntiDrain service fee. Gas is paid to the network for running the transaction. A service fee, if present, is shown separately before sending.

AntiDrain has two main fee types.

## 1. Token Rescue Fee

This is a fee in the token being rescued.

It usually applies to a fee-bearing token rescue, where the site or contract takes a percentage of the amount actually rescued.

Standard split:

- user/recipient receives `80%`;
- total fee is `20%`;
- if no affiliate wallet is active, protocol receives the full `20%`;
- if an affiliate wallet is active, protocol receives `15%` and affiliate receives `5%`.

Examples:

- `100 USDT` is rescued: recipient receives `80 USDT`, total fee is `20 USDT`;
- with an active affiliate link, affiliate receives `5 USDT` and protocol receives `15 USDT`;
- `1,000 TOKEN` is rescued: recipient receives `800 TOKEN`, total token fee is `200 TOKEN`.

## When Token Rescue Fee Appears

Token rescue fee can appear in these cases:

- ERC-20 token rescue in Custom TX Builder when a fee-bearing transfer is selected;
- ERC-20 transfer-all, where the fee is calculated from the real balance at execution time;
- Permit Rescue when the selected mode uses balance-at-execution;
- DeBank/Bundler token transfer when that route uses fee split;
- DeBank native transfer-all when that route supports this split.

Token rescue fee usually does not apply when:

- Remove Delegation only clears EIP-7702 delegation;
- Permit Rescue sends an exact amount without a fee-bearing balance-at-execution mode;
- the action does not move tokens or native balance through a fee split.

## 2. Native Service Fee

This is a separate fee in the network's native coin: ETH, BNB, POL, AVAX, and so on.

The site calculates it in fee units. One fee unit is `$5`. Then the site converts that amount into the native coin using the current price.

Examples:

- `1` fee unit = `$5`;
- `2` fee units = `$10`;
- `3` fee units = `$15`.

If an affiliate link is active, native service fee is split this way:

- protocol receives `75%`;
- affiliate receives `25%`.

For example, if native service fee is `$10`, the affiliate reward is `$2.50` in the native coin.

## When Native Service Fee Appears

Native service fee can appear when the service prepares a more complex action instead of a normal token fee.

In Custom TX Builder:

- raw custom call without ERC-20/NFT transfer: `1` fee unit for each raw call;
- ERC-721 transfer: `1` fee unit for each NFT transfer;
- ERC-1155 transfer: `1` fee unit for each NFT transfer;
- ERC-20 transfer by itself usually uses token fee, not native service fee;
- if the batch is mixed and contains token/NFT transfer, raw custom calls in the same batch may not add a separate native service fee.

In DeBank Withdraw:

- selected pool action: `1` fee unit for each selected pool;
- raw call: `1` fee unit for each raw call;
- regular token transfers usually do not add native service fee.

## When Native Service Fee Is Zero

Native service fee should be `0` when the selected flow does not require it.

Usually this means:

- Remove Delegation;
- Permit Rescue without native service fee;
- normal fee-bearing token rescue where the fee is already taken in the token;
- DeBank/Bundler token transfer without raw/pool/native service-fee action.

## How the Site Calculates the Native Amount

First, the site counts fee units. Then it multiplies them by `$5`.

After that, the site tries to get the native coin price from price providers and convert USD into ETH/BNB/POL/another native coin.

If the price is unavailable, the network is custom, or the coin symbol is unsupported, the site may use a fallback estimate. In that case the amount can be based on estimated gas cost, not on the exact `$5` per unit price.

If the transaction plan already contains a locked service fee, Fund Donor and Send should use that locked amount.

## What to Check Before Sending

Before sending, check:

- selected network;
- gas reserve;
- native value, if the transaction sends native coin;
- token fee, if the rescue takes a percentage in the token;
- native service fee, if present;
- total amount that must be funded to the donor wallet;
- affiliate split, if an affiliate link is active.

If a fee looks unexpected, do not send immediately. Go back to Build or Simulation and check the selected action and route.
