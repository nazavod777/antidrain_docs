---
title: Fees and Execution Behavior
description: "How AntiDrain calculates fees, donor funding, simulations, and why execution numbers can change across routes and steps."
---

# Fees and Execution Behavior

This page explains how AntiDrain applies fees and why some execution numbers change while the Recovery flow progresses.

## The short version

AntiDrain does not use one single fee model for every route.

Different action types are charged differently.

## Fee model summary

| Action type | Fee behavior |
| --- | --- |
| ERC-20 transfer entry | 20% fee-side split per ERC-20 transfer transaction |
| Transfer All Native | 20% of the swept native balance becomes the fee side, 80% goes to donor wallet |
| ERC-721 / ERC-1155 NFT flow | 5 USD in network native token per NFT fee unit |
| Pure custom TX bundle with no token or NFT transfer | 5 USD per TX |

## ERC-20 fee behavior

For ERC-20 transfer transactions, AntiDrain applies:

- a 20% fee-side split per transfer transaction

This is important:

- it is not one single 20% fee on the whole bundle
- it is applied to each ERC-20 transfer transaction separately

### What this means in practice

Each ERC-20 transfer entry is split into two calls:

- 20% of that token amount goes to the fee side
- 80% goes to the recipient you entered

If the browser has a saved partner address, that 20% is split as:

- 15% to the protocol
- 5% to the saved partner address

If there is no saved partner address, the full 20% still goes to the protocol.

## Transfer All Native behavior

Transfer All Native is different from a simple static transfer.

For each enabled authority wallet:

- the native sweep happens at execution time
- 20% is kept as the fee side
- 80% is routed to the donor wallet

If the browser has a saved partner address, that 20% is split as:

- 15% to the protocol
- 5% to the saved partner address

This matters because the wallet's native balance can change during the rescue flow.

## NFT fee behavior

NFT fee logic is separate from the 20% split model.

The site applies:

- 5 USD in the network native token per NFT fee unit

Plain-language meaning:

- ERC-721 transfers are counted per NFT
- ERC-1155 batch transfers are counted per token ID in the batch

## Pure custom TX fee behavior

Pure custom TXs are charged:

- 5 USD per TX

but only when the bundle contains no token or NFT transfer at all.

## Partner link split

Partner links do not change the total fee.

They only change who receives part of that fee when the browser already has a saved partner address.

Current split:

- ERC-20 fee side and Transfer All Native fee side still total 20%
- when a saved partner address exists, that 20% is split as 15% to the protocol and 5% to the saved partner address
- NFT and pure custom TX service fees still quote as 5 USD total
- when a saved partner address exists, that 5 USD equivalent is split as 3.75 USD to the protocol and 1.25 USD to the saved partner address

For the dedicated flow and link details, see [Affiliate Program](./affiliate-program).

## Where the native-denominated service fee can be sourced from

The app first checks whether the donor wallet already covers the required native fee.

If not, AntiDrain can sometimes allocate the service fee from unique compromised wallets in the current builder set when their combined native balances are sufficient.

This is one reason the required donor top-up is not always equal to the full service fee plus full gas reserve.

## Important Transfer All Native special case

Transfer All Native does not add donor top-up for its own 20% fee-side sweep.

Why:

- that fee is taken directly from the swept compromised-wallet balance during execution

So you should not interpret it like a normal donor-funded line item.

## Why unsupported or custom networks are different

If the selected chain is custom or unsupported for price lookup, the site may skip the USD-to-native fee quote.

That does not automatically mean the route is unusable.

It means the app cannot safely price the native token the same way it does on supported networks.

## Why numbers may change between screens

Beginners often expect one fixed number from start to finish.

That is not always how this Recovery flow works.

Numbers can change between TX Builder, Fund Donor, and TX Sender because:

- network fee conditions move
- gas limits need adjustment
- the RPC simulates differently than expected
- later execution stages become clearer only after earlier ones are resolved
- staged execution fallback is in use

## Why Fund Donor and TX Sender can disagree a little

This is often normal.

The sender may learn:

- a safer gas limit is needed
- a fallback gas plan should be used
- the node returned a different cost reality than the earlier estimate

When that happens, the app may recalculate or even redirect you back to Fund Donor.

## How to read fee-related numbers safely

Do not rely on memory alone.

Instead:

- read the current screen state
- read the status copy
- read the execution log
- use the latest visible estimate, not the earlier number you remember

## A beginner-safe mindset

If a fee number changes, do not assume fraud or a bug first.

Check these questions in order:

1. Did the selected route change?
2. Did the network or RPC change?
3. Is the flow using staged estimation?
4. Did TX Sender discover a different gas requirement for the Recovery flow?

If the answers still do not make sense, stop and review the route before sending.
