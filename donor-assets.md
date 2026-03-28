---
title: Donor Assets
description: "How to review, withdraw, and clean up remaining donor wallet assets after the main AntiDrain Recovery flow."
---

# Donor Assets

Donor Assets is the cleanup screen for the donor wallet after the main Recovery flow.

Many users focus so hard on the compromised wallet that they forget the donor wallet may still hold funds afterward.

This screen exists to stop that mistake.

## What this screen can do

It can help you:

- choose a network for donor cleanup
- refresh the donor native balance
- refresh a donor ERC-20 balance
- withdraw native funds
- withdraw ERC-20 funds

## Why the donor wallet may still hold funds

After the main recovery, the donor wallet may still contain:

- leftover native balance
- residual gas buffer
- ERC-20 balances
- operational leftovers from the staged flow

Reviewing and cleaning these up is part of a tidy recovery process.

## Top controls: network and custom RPC

The donor cleanup screen still needs correct network context.

Why:

- native balances are network-specific
- ERC-20 balances are network-specific
- token withdrawals still need the correct chain and gas context

If needed, you can also use a custom RPC URL here.

## Native withdrawal

The normal order is:

1. choose the network
2. refresh native balance
3. enter the `Recipient Address`
4. withdraw native

### Important detail

The app does not blindly try to send the full native balance.

It estimates the gas first, reserves gas cost, and sends the transferable remainder.

If the balance is too small to cover gas, the app tells you instead of pretending the withdrawal is possible.

## ERC-20 withdrawal

The normal order is:

1. choose the network
2. enter the token contract address
3. refresh token balance
4. enter the `Recipient Address`
5. withdraw the token balance

### Important beginner reminder

Even when you are only moving ERC-20 tokens, the donor wallet still needs native coin for gas.

No native gas means no token withdrawal transaction.

## What each input means

### Token Contract Address

This is the ERC-20 contract address of the token you want to withdraw from the donor wallet.

It is not the recipient.

### Recipient Address

This is the address that should receive the donor cleanup withdrawal.

Double-check it before sending.

## Why buttons can stay disabled

Native or token withdrawal can stay blocked for normal reasons.

Typical examples:

- no donor wallet is available
- no network is selected
- custom RPC is missing or invalid in custom mode
- token contract is missing or invalid
- balance has not been refreshed yet
- `Recipient Address` is invalid
- another withdrawal is already running

## Why refresh matters

The page wants a fresh balance snapshot before enabling withdrawal.

That is good behavior because:

- balances may have changed since the last step
- gas reserves may differ from what you assume
- a token balance can be zero even if you expected something left

## Native withdrawal edge case: too small for gas

This is common with tiny leftovers.

If the remaining native balance is too small to pay for its own withdrawal gas, the page will block the action.

That is not a bug. It means the amount is below the practical send threshold.

## Token withdrawal edge case: zero token balance

If the refreshed token balance is zero, the app will stop there instead of pretending it can send something.

## Good cleanup habit

After the main Recovery flow succeeds:

1. open Donor Assets
2. review native balance
3. review any ERC-20 leftovers you care about
4. withdraw them if needed
5. only then consider the donor cleanup complete

## Common mistakes

### Mistake 1: forgetting that the donor wallet still needs gas

Token withdrawals still require native gas.

### Mistake 2: using the wrong token contract

If the token contract address is wrong, the refreshed balance will be wrong too.

### Mistake 3: skipping refresh

Always refresh before assuming the displayed balance is still current.

## Final checklist

Before clicking a donor cleanup withdrawal:

- network is correct
- token contract is correct, if relevant
- recipient is correct
- refreshed balance is current
- you understand whether the amount is large enough to be worth moving
