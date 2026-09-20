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

## 1. Token Service Fee {#1-token-rescue-fee}

This is a fee in the asset being rescued: in the token itself, or in the network's native coin when the rescue moves a native balance.

It applies where the site or the contract takes a percentage of the amount actually rescued, and the percentage is the same for both — a native rescue is charged exactly like a token rescue.

At the fee in the table below, the recipient's share does not depend on whether an affiliate link is active: only the way the fee is split inside changes. What this rescue will actually be charged is shown at the **Fund Donor** step, so read it there rather than counting on a figure from this page.

| To Whom | Without Affiliate | With Active Affiliate |
| --- | --- | --- |
| User / Recipient | 80% | 80% |
| Protocol | 20% | 15% |
| Affiliate | — | 5% |

Examples:

- 100 USDT is rescued: recipient receives 80 USDT, total fee is 20 USDT
- With an active affiliate link, affiliate receives 5 USDT and protocol receives 15 USDT
- 1,000 TOKEN is rescued: recipient receives 800 TOKEN, total fee is 200 TOKEN
- 0.5 ETH is rescued as a native balance: recipient receives 0.4 ETH, total fee is 0.1 ETH

Despite the name, this fee can arrive in the native coin. What identifies it is that it is a percentage of the rescued amount. A flat charge counted in $5 units is a different fee — see [Native Service Fee](#2-native-service-fee).

## When Token Service Fee Appears {#when-token-rescue-fee-appears}

Token service fee can appear in these cases:

- ERC-20 token rescue in Custom TX Builder when a fee-bearing transfer is selected
- ERC-20 transfer-all, where the fee is calculated from the real balance at execution time
- Permit Rescue when the selected mode uses balance-at-execution
- DeBank/Bundler token transfer when that route uses fee split
- DeBank native transfer-all: this is the native side of the pool exit below rather than a route you pick, and it is added whenever a selected pool pays out the native coin. There is no mode to choose — the whole native balance is then swept through the fee split, at the same percentage as for a token, and the fee is that percentage of whatever balance is there at execution
- A call inside DeBank Withdraw that the site passes on exactly as DeBank prepared it: whether this fee is taken at all is decided on the network while the transaction runs, and the fee row says so — see [When a Fee Row Says It May Not Apply](#when-a-fee-row-says-it-may-not-apply)
- DeBank [pool exit](/en/glossary#pool-exit): exiting a selected pool sweeps the wallet's whole balance of every asset the exit pays out — an ERC-20 token or the native coin — and the fee is calculated from that whole balance at execution time, exactly as for a transfer-all

A pool exit can therefore cost both fees at once: this percentage on the whole swept balance, and one fee unit ($5) for the pool itself. They are counted separately — see [Native Service Fee](#2-native-service-fee).

::: warning A Pool Exit Is Charged on More Than the Pool Paid Out

The percentage is not taken on the pool payout alone. Exiting a pool sweeps everything the wallet holds in the paid-out asset, and the fee is a percentage of that whole amount — including funds that were already in the wallet and that the pool never touched.

A wallet holding 9 ETH of its own that exits a pool paying out 1 ETH is swept for 10 ETH, and the fee is a percentage of 10 ETH, not of 1 ETH.

:::

Token service fee usually does not apply when:

- Remove Delegation only clears EIP-7702 delegation
- Permit Rescue sends an exact amount without a fee-bearing balance-at-execution mode
- The action does not move tokens or native balance through a fee split

## When a Fee Row Says It May Not Apply

The Fund Donor step lists this fee row by row, and it does not stand behind every row equally: the ones it cannot promise are marked. If there are several rows the list scrolls inside its own box, so run your eye down all of them.

Most of the time the site builds the transfer itself, so it knows the fee will be taken and states the split as a plain fact. In DeBank Withdraw part of the work is done by calls DeBank prepared for the service the wallet is withdrawing from, and those go to the network exactly as they came. For such a call the site can see that something leaves the wallet, but not whether what leaves is a token balance: the very same call is also how an NFT is moved. Telling the two apart means asking the token's own contract, and that question is answered on the network rather than in your browser.

So the site neither hides that fee nor promises it. The row appears, and it carries one more line:

*May not apply: the rescue contract decides when the transaction runs whether this call moves a token balance. If it does, the fee is exactly the rate shown; if it does not, there is no fee for this call.*

What that means for you:

- **The percentage is taken from the amount written into that one call**, not from everything the wallet holds. So the most it can cost you is that percentage of that one amount. It is the same percentage as every other row in that list — nothing is discounted for the uncertainty — and the row states it as a percentage rather than as a figure.
- **The decision is made on the network, while the transaction runs.** It is made by the rescue contract — AntiDrain's own program on the blockchain — and not by the page in front of you. There is no setting that changes it and nothing here for you to answer.
- **It does not change how much you have to fund.** Like the rest of this fee, it comes out of the rescued assets at execution and never out of the donor top-up — so a row that turns out not to apply leaves you with more of the rescued asset, not with leftover gas.

Rows without that line are the ordinary case: the site built those calls itself, and their fee is certain.

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

If the transaction plan already contains a locked service fee, Fund Donor and TX Sender should use that locked amount.

## What to Check Before Sending

::: warning Check All Fees Before Sending

If a fee looks unexpected, do not send immediately. Go back to TX Builder or TX Simulator and check the selected action and route.

:::

Before sending, check:

- Selected network
- Gas reserve
- Native value, if the transaction sends native coin
- Token service fee, if the rescue takes a percentage of the rescued asset
- Native service fee, if present
- Total amount that must be funded to the donor wallet
- Affiliate split, if an affiliate link is active

## Next

- [Affiliate Link](/en/affiliate) — how the fee is split between protocol and affiliate.
- [Rescue Actions](/en/rescue-actions) — which fee applies to which action.
- [Glossary](/en/glossary#fee-unit) — what a fee unit is.
