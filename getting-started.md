---
title: Getting Started
description: "The safest first path through AntiDrain for new users: what to prepare, what order to follow, and what mistakes to avoid."
---

# Getting Started

This page is the safest entry point if you are new, stressed, or afraid of making the wrong first click.

## The 30-second version

If you remember only one sequence, remember this one:

1. open AntiDrain on a trusted device
2. create or import the **donor wallet**
3. export the donor wallet **Backup JSON**
4. choose the right route in **Actions**
5. finish **TX Builder**
6. review **Fund Donor**
7. send only from **TX Sender**
8. clean up leftovers in **Donor Assets**

Do not skip straight to the send step.

## Before touching any field

Use the site only if all of the following are true:

- you are on a machine you trust
- you know which wallet is compromised
- you know which wallet is donor
- you know which network the recovery belongs to
- you are ready to store the donor backup offline

If any of these points is unclear, stop and sort that out first.

## First important distinction

### Compromised wallet

This is the wallet in danger.

It may be:

- the wallet that signed the malicious EIP-7702 delegation
- the wallet that still holds the assets you want to rescue

### Donor wallet

This is the separate wallet AntiDrain uses for execution.

It is used to:

- hold native coin for gas
- fund the staged **Recovery flow**
- send the final prepared transactions

The donor wallet is the first thing you create or import on the site.

## Pick the right route first

Wrong route choice is one of the easiest beginner mistakes.

### Use `Remove EIP-7702 Delegation` when

Both of these are true:

- the private key itself was not leaked
- the main problem is the malicious delegation signature

### Use `TX Builder` when

You need any real asset movement or contract interaction, such as:

- token transfers
- NFT transfers
- claims
- pool exits
- unwraps
- custom contract calls
- mixed bundles

In most of these cases, you do not need a separate undelegation step first.

### Use `Tokens Transfer [BETA]` when

All of this sounds true:

- you want one shared recipient
- you mainly want a simplified ERC-20 sweep
- you are comfortable falling back to TX Builder if the shortcut looks wrong

### Use `Pool Withdrawal [BETA]` when

All of this sounds true:

- you want one shared recipient
- you mainly want a simplified pool-claim or pool-withdraw route
- you are comfortable switching to TX Builder if the shortcut does not match your case

## If you are not fully sure what happened

Treat uncertainty as higher risk.

Use this rule:

- if you cannot confidently prove that the problem was only a malicious delegation signature
- and you are not fully sure the private key stayed private

then do not start with standalone delegation removal.

Use **TX Builder** and prioritize safe asset movement first.

## Your safest first run through the site

### Step 1: Donor Wallet

- generate a fresh donor wallet locally or import your own donor wallet
- review the address
- keep the donor private key and mnemonic secret

### Step 2: Backup export

- click `Download Wallet`
- save the **Backup JSON** somewhere safe
- confirm to yourself that the file is readable and stored offline

The site intentionally keeps later steps locked until this is done.

### Step 3: Actions

- choose the route that matches the real compromise
- if you are unsure, prefer **TX Builder**

### Step 4: TX Builder

- choose the correct network
- review or replace the RPC if needed
- enter the required compromised wallet inputs
- build the actual recovery plan

### Step 5: Fund Donor

- read the funding snapshot
- do not assume a higher or lower number is a bug without reading the status copy
- remember that some Recovery flow estimates resolve in stages

### Step 6: TX Sender

- read the execution log
- send only when the network, route, recipients, and counts match your intention

### Step 7: Donor Assets

- after recovery, check whether the donor wallet still holds native or ERC-20 leftovers
- withdraw them if needed

## Why the app locks steps on purpose

The app deliberately blocks incomplete states.

Typical examples:

- Actions stays locked until donor backup export is handled
- Fund Donor stays locked until TX Builder is valid
- TX Sender stays locked until the funding snapshot and route context are ready

This is not a bug. It is defensive Recovery flow design.

## Common beginner mistakes at the start

### Mistake 1: mixing donor and compromised secrets

Never paste:

- donor secrets into compromised-wallet inputs
- compromised secrets into donor-wallet inputs

### Mistake 2: using the narrow undelegation route when the case is broader

If the rescue requires transfers, claims, or any mixed operations, use TX Builder.

### Mistake 3: skipping the donor backup

If the tab is interrupted and you never saved the donor backup, you created unnecessary risk for yourself.

### Mistake 4: treating refresh as a backup system

Session restore can help, but it is not a substitute for the **Backup JSON**.

## What to do after a successful rescue

Do not stop the moment assets move.

Also do this:

- review the donor wallet
- withdraw leftover donor assets if needed
- move rescued assets into your intended long-term wallet setup
- stop using the compromised wallet if the key itself was exposed

## Read next

- [Crypto Basics](./crypto-basics)
- [Safety Basics](./safety-basics)
- [Actions and Routes](./actions-and-routes)
