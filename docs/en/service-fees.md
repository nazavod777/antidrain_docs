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

**The percentage is a maximum rate for one transfer, never a bill for the whole rescue.** It is the most AntiDrain takes out of that one transfer, and it is counted on the amount that transfer moves — for a transfer-all, on whatever balance sits on the wallet at the moment the rescue runs, which can be more than is there now. Every transfer is counted on its own, and there is no separate ceiling on the rescue as a whole.

At the fee in the table below, the recipient's share does not depend on whether an affiliate link is active: only the way the fee is split inside changes. The **Fund Donor** step shows the rate that applies to this rescue and the calculation made from it, so read it there rather than counting on a figure from this page. What is finally collected is settled while the transaction runs.

The table and the examples below are the ordinary case, where the whole fee is collected.

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

**Less than the full percentage can be taken.** If the token's own rules refuse part of the fee, AntiDrain does not retry it and never asks you to pay it separately: the part that could not be collected goes out to your recipient with the rest. It does not always work out that way — when one of the addresses the fee is split between cannot accept its share, that share can go to another one instead, and the full fee is collected after all — so read these figures as the most that can be taken, not as a promise of less.

::: warning These Figures Are a Calculation, Not a Promise of What Arrives

Every amount here and at the **Fund Donor** step is worked out from the percentage. It does not include what the token itself charges for a transfer.

Some tokens keep a cut of every transfer, written into the token's own rules. Nothing in your browser can ask a token whether it does that — the ERC-20 standard these tokens follow has no such question in it — so the site cannot warn you about a particular token, and no figure it shows accounts for one. Rescue 1,000 of a token that keeps 10% of every transfer: the calculation says 800 for the recipient, and 720 arrives.

The same blind spot runs the other way. A token that does not follow the ERC-20 standard — one that reports a transfer as failed while moving the funds anyway — can make more leave the wallet than these percentages account for, and the site cannot tell such a token apart in advance for the same reason: the standard gives it nothing to ask.

Network gas and [Native Service Fee](#2-native-service-fee) are separate charges. They are not part of this percentage and are never taken out of it.

:::

Despite the name, this fee can arrive in the native coin. What identifies it is that it is a percentage of the rescued amount. A flat charge counted in $5 units is a different fee — see [Native Service Fee](#2-native-service-fee).

## When Token Service Fee Appears {#when-token-rescue-fee-appears}

Token service fee can appear in these cases:

- ERC-20 token rescue in Custom TX Builder when a fee-bearing transfer is selected
- A raw call you paste into Custom Transaction yourself that turns out to be an ordinary ERC-20 transfer: it is charged like any other token transfer, but the site cannot tell from the data alone that it really moves a token balance, so the row says it may not apply — see [When a Fee Row Says It May Not Apply](#when-a-fee-row-says-it-may-not-apply)
- ERC-20 transfer-all, where the fee is calculated from the real balance at execution time
- The native coin left on the compromised wallet at the end of a Custom TX Builder rescue: the last step of every such rescue sends it to your donor wallet, so change a called contract refunds to the compromised wallet is not left for the attacker. It goes through the same fee split at the same percentage, including when the change is native coin the donor itself sent into the batch, and the amount is only known at execution. If you added a transfer-all of the native coin yourself, that call sends the balance to the address you entered instead, with the same fee
- Permit Rescue, in both of its modes: the fee applies whether the signature covers an exact amount or the balance at execution time
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
- The action does not move tokens or native balance through a fee split

## When a Fee Row Says It May Not Apply

The Fund Donor step lists this fee row by row, and it does not stand behind every row equally: the ones it cannot promise are marked. If there are several rows the list scrolls inside its own box, so run your eye down all of them.

Most of the time the site builds the transfer itself, so it knows the fee applies and states the split as a plain fact. Two kinds of call are different. In DeBank Withdraw part of the work is done by calls DeBank prepared for the service the wallet is withdrawing from, and those go to the network exactly as they came. In [Custom Transaction](/en/rescue-actions#custom-transaction) the site sends the [calldata](/en/glossary#calldata) you pasted in, exactly as you typed it. In both cases the site can see that something leaves the wallet, but not whether what leaves is a token balance: the very same call is also how an NFT is moved. Telling the two apart means asking the token's own contract, and that question is answered on the network rather than in your browser.

So the site neither hides that fee nor promises it. The row appears, and it carries one more line:

*May not apply: the rescue contract decides when the transaction runs whether this call moves a token balance. If it does, the token service fee is at most the rate shown and can be less. If it does not, no token service fee is taken for this call — the token may still charge its own transfer fee, and any native service fee is quoted separately above.*

What that means for you:

- **The percentage is counted on the amount written into that one call**, not on everything the wallet holds. So the token service fee on that call is at most that percentage of that one amount, and it can come to less. It is the same percentage as every other row in that list — nothing is discounted for the uncertainty — and the row states it as a percentage rather than as a figure.
- **The decision is made on the network, while the transaction runs.** It is made by the rescue contract — AntiDrain's own program on the blockchain — and not by the page in front of you. There is no setting that changes it and nothing here for you to answer.
- **It does not change how much you have to fund.** Like the rest of this fee, it comes out of the rescued assets at execution and never out of the donor top-up — so a row that turns out not to apply leaves you with more of the rescued asset, not with leftover gas. It does not make that call free of every charge: the token can still keep its own cut of the transfer, and [Native Service Fee](#2-native-service-fee) is counted separately and shown above the list.

Rows without that line are the ordinary case: the site built those calls itself, and it knows the fee applies to them. What such a row shows is still the most that will be taken, and still a calculation — [Token Service Fee](#1-token-rescue-fee) above explains why less can be collected, and why what reaches your recipient is not a promise.

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

If the transaction plan already contains a locked native service fee, Fund Donor and TX Sender should use that locked amount. That rule is about the native amount written into the plan. It says nothing about the token service fee, which is a percentage rather than a locked figure and can still be collected in part.

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
