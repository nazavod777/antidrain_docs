---
title: Overview
description: "AntiDrain overview for beginners: what the site does, who it is for, what each screen means, and how the full recovery flow is staged."
---

# Overview

AntiDrain is a browser-based **EVM recovery workspace** for situations where:

- a wallet signed a malicious or unwanted **EIP-7702** delegation
- assets must be moved out of a compromised wallet in a controlled sequence
- the operator wants one connected **Recovery flow** for setup, estimation, sending, and donor cleanup

This documentation is written for non-experts first.

The goal is not to impress you with protocol jargon. The goal is to help you avoid expensive operator mistakes.

## What AntiDrain is

AntiDrain is a structured recovery workspace with staged screens.

It helps you:

- create or import a **donor wallet**
- export the donor wallet Backup JSON before proceeding
- choose the right recovery route
- prepare transactions or use simplified beta routes
- estimate donor funding
- simulate and send the final on-chain execution
- clean up leftover donor wallet assets at the end

## What AntiDrain is not

AntiDrain is not:

- a centralized recovery service
- a guarantee that a compromised private key becomes safe again
- a replacement for careful review of addresses and routes
- a tool that can undo a transaction already confirmed on-chain

If a wrong transaction is already final on-chain, there is usually no central party that can reverse it.

## Who this docs set is for

This docs site is for:

- users who are seeing terms like RPC, calldata, gas, nonce, ERC-20, or EIP-7702 for the first time
- operators who understand crypto a little, but want a strict screen-by-screen explanation
- people under stress who need to slow down and avoid mixing donor and compromised wallets

## The two wallets you must never confuse

### Compromised wallet

This is the wallet in danger.

It is the wallet:

- that signed the malicious delegation
- or that still holds the assets you want to rescue

### Donor wallet

This is a separate wallet used by AntiDrain for execution.

It is used to:

- hold the native balance needed for gas
- fund the staged Recovery flow
- send the final prepared transactions

If you mix these two roles, the whole Recovery flow becomes unsafe very quickly.

## The full screen map

AntiDrain is designed as one connected path:

1. **Donor Wallet**  
   Generate or import the donor wallet locally and export its Backup JSON.

2. **Actions**  
   Choose the route that matches your real situation.

3. **TX Builder**  
   Select network and RPC, enter compromised wallet inputs, and prepare the actual transaction plan.

4. **Fund Donor**  
   Review the donor wallet funding snapshot before sending.

5. **TX Sender**  
   Simulate, sign, broadcast, and monitor the recovery execution.

6. **Donor Assets**  
   Review and withdraw any remaining donor wallet assets after the main recovery finishes.

7. **Utilities**  
   ABI Encoder and Wei Converter are available when you need them.

## Why the flow is intentionally gated

Some steps stay locked until earlier work is complete.

That is intentional.

Examples:

- Actions stays locked until the donor backup step is handled
- TX Sender stays locked until TX Builder and network context are valid
- some withdraw buttons stay disabled until balances are refreshed

The purpose is simple: stop you from running an incomplete or unsafe Recovery flow.

## Quick route chooser

| Situation | Recommended route |
| --- | --- |
| You only signed a malicious EIP-7702 delegation and the private key itself was not leaked | **Remove EIP-7702 Delegation** |
| You need claims, transfers, NFT moves, custom calls, unwraps, or a mixed bundle | **TX Builder** |
| You want a simpler ERC-20 sweep to one shared recipient | **Tokens Transfer [BETA]** |
| You want a simpler pool-claim / pool-withdraw flow to one shared recipient | **Pool Withdrawal [BETA]** |

If you are unsure, the safest general fallback is **TX Builder**.

## What makes AntiDrain different

AntiDrain is designed around several practical ideas:

- donor-funded execution instead of relying on the compromised wallet to pay gas first
- staged estimation before the send step
- EIP-7702-aware execution logic
- one workspace that can cover standalone undelegation, manual custom calls, token transfers, NFT transfers, token sweep shortcuts, and pool-withdraw shortcuts

## What you should prepare before you start

Have these things clear before you touch any screen:

- which wallet is compromised
- which chain the operation belongs to
- whether the issue is only malicious delegation or full key compromise
- where rescued assets should go
- whether you already have a donor wallet or want to generate one now

## How to use these docs efficiently

If you are new, read in this order:

1. [Getting Started](./getting-started)
2. [Crypto Basics](./crypto-basics)
3. [Safety Basics](./safety-basics)
4. [Actions and Routes](./actions-and-routes)

Then move into the screen-by-screen pages for the actual Recovery flow.

## Important operational warning

The active wallet context can remain in the current tab session until the tab is closed or session storage is cleared.

That means:

- do not use a shared machine
- do not leave the tab open unattended
- do not rely on refresh as your only recovery mechanism
- always export the donor wallet Backup JSON before trusting the next step
