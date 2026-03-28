---
title: Actions and Routes
description: "How to choose the correct AntiDrain route: undelegation, TX Builder, token transfer, or pool withdrawal, and what changes after each choice."
---

# Actions and Routes

This page explains how to choose the right route in the **Actions** screen.

Route choice matters because the rest of the Recovery flow changes after you pick it.

## Why the route choice matters

AntiDrain supports more than one route.

If you choose the wrong route:

- the prepared plan may not match your real case
- the builder may ask for the wrong inputs
- you may end up using an overly narrow shortcut for a broader problem

## Route 1: Remove EIP-7702 Delegation

This is the narrow, standalone cleanup route.

Use it only when both of these are true:

1. the compromised wallet private key was not exposed to the attacker
2. the main problem is the malicious EIP-7702 delegation itself

### Good examples for this route

- you signed something malicious in the wallet UI
- the wallet is now delegated in a way you did not intend
- you are not trying to move tokens, NFTs, claims, or custom calldata right now

### Do not use this route when

- the private key itself may be leaked
- you need to transfer assets
- you need a claim, unwrap, unstake, or other contract call
- you are not fully sure what happened

If any of those sounds true, use **TX Builder** instead.

## Route 2: TX Builder

This is the main advanced route and the safest general fallback.

Use it when you need:

- claims
- airdrops
- custom contract calls
- ERC-20 transfers
- ERC-721 transfers
- ERC-1155 transfers
- several operations in one planned sequence

### Why TX Builder is the default safe fallback

TX Builder gives you the most explicit control.

That makes it the better choice when:

- the situation is unclear
- you need more than one action
- you do not trust a shortcut route
- you want manual review of each planned action

Important:

For builder-based recovery sends, EIP-7702-aware handling is part of the final send path. In many cases, you do not need a separate standalone undelegation first.

## Route 3: Tokens Transfer [BETA]

This is a simplified ERC-20 sweep route.

Use it when all of this sounds true:

- you want one shared recipient
- you mainly want to load ERC-20 balances from one or more compromised wallets
- you want a simpler selection flow than manual transaction-by-transaction building

### Good use case

"I want to pull selected ERC-20 balances from several wallets to one recipient, and I do not need a more custom bundle."

### Do not use it when

- the selected balances look wrong
- you need mixed operations
- you need custom contract calls
- you want full field-by-field manual control

If the shortcut stops matching your case, rebuild it in **TX Builder**.

## Route 4: Pool Withdrawal [BETA]

This is a simplified pool selection route.

Use it when:

- you want one shared recipient
- you want to load pool positions for one or more compromised wallets
- you want to select and send prepared pool-withdraw actions more quickly

### Good use case

"I only need the pool withdrawal/claim side of the rescue, and the simplified flow matches what I see."

### Do not use it when

- the fetched pool list looks incomplete
- the simulation looks inconsistent
- the route does not reflect the actual protocol action you need

Again, the safe fallback is **TX Builder**.

## The simplest safe route rule

Use this rule if you are unsure:

> If you cannot confidently say "the private key was not leaked and the only problem is the delegation", choose **TX Builder**.

## Practical route chooser

| Situation | Best route |
| --- | --- |
| Malicious EIP-7702 signature only, private key not leaked | `Remove EIP-7702 Delegation` |
| Mixed operations or manual control needed | `TX Builder` |
| Simple ERC-20 sweep to one recipient | `Tokens Transfer [BETA]` |
| Simple pool claim / pool withdrawal to one recipient | `Pool Withdrawal [BETA]` |

## What changes after you choose a route

Your route choice changes what TX Builder expects next.

### Remove EIP-7702 Delegation

TX Builder expects:

- network
- RPC
- compromised private keys for the wallets you want to undelegate

### TX Builder main route

TX Builder expects:

- network
- RPC
- one or more compromised wallet entries
- one or more prepared operations

### Tokens Transfer [BETA]

TX Builder expects:

- network
- RPC
- one shared recipient
- compromised wallet entries
- fetched ERC-20 balances to select from

### Pool Withdrawal [BETA]

TX Builder expects:

- network
- RPC
- one shared recipient
- compromised wallet entries
- fetched pool positions to select from

## What "beta" means here in practice

It does not mean "never use it".

It means:

- verify the output more carefully
- do not force the route if it looks wrong
- be ready to rebuild the same intent in TX Builder

## Common route mistakes

### Mistake 1: choosing undelegation because EIP-7702 is involved somehow

That route is only for the narrow standalone cleanup case.

### Mistake 2: choosing a shortcut when the flow is actually mixed

If your rescue needs claims plus transfers plus maybe a custom call, use TX Builder.

### Mistake 3: staying in a beta route after it stops matching your case

The correct move is to stop and switch to TX Builder.

## Before you leave the Actions screen

Make sure:

- the selected route matches the real problem
- you understand what inputs the next screen will ask for
- you are not choosing a shortcut just because it looks simpler

Next page:

- [TX Builder](./tx-builder)
