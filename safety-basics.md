---
title: Safety Basics
description: "Core operational safety rules for AntiDrain: trusted devices, wallet separation, route review, backups, and send-step discipline."
---

# Safety Basics

This is the most important page in the docs.

If you only read one page carefully before using AntiDrain, read this one.

## Use a trusted machine only

AntiDrain is a browser-based workspace.

That means sensitive data can exist in the current tab while you work:

- donor wallet private key
- donor wallet mnemonic
- donor wallet Backup JSON
- compromised wallet private keys entered for recovery

Use a device you control.

Do not use:

- internet café machines
- shared family laptops
- work laptops managed by someone else
- machines with unknown browser extensions
- systems where clipboard, screenshots, or browser profiles may be monitored

## Treat the donor wallet like a real wallet

The donor wallet is not disposable just because it is temporary in the Recovery flow.

If someone gets the donor wallet:

- private key
- mnemonic
- Backup JSON

they can drain it.

That means you should protect it with the same seriousness you would use for any real wallet holding funds.

## Never confuse donor and compromised secrets

This is one of the easiest mistakes to make while stressed.

Never paste:

- donor secrets into compromised-wallet inputs
- compromised secrets into donor-wallet inputs

If you lose track of which secret belongs to which wallet, stop immediately and verify both addresses before continuing.

## Backup export is mandatory for a reason

The UI blocks later steps until you handle the donor wallet Backup JSON.

Why this matters:

- browser tabs can crash
- you can close the tab by mistake
- session storage can be lost
- without the backup, you can lose safe access to the donor wallet you just prepared

The Backup JSON is your durable fallback.

## Session storage warning

The current tab can keep wallet and Recovery flow context in session storage until the tab is closed or session data is cleared.

Practical meaning:

- a normal refresh may restore the current state
- closing the tab removes that active session context
- the Backup JSON is still the real recovery point

Do not rely on refresh behavior as your only safety plan.

## Double-check addresses before every real send

This sounds obvious, but beginners often check only the first and last characters once and move on.

Be stricter than that.

Before sending:

- confirm the rescue recipient
- confirm the donor cleanup recipient
- confirm token contract addresses
- confirm the selected network

Crypto transactions are usually irreversible.

Read more:

- [Ethereum security and scam prevention](https://ethereum.org/security/)
- [Common misconceptions about Ethereum](https://ethereum.org/en/community/support/misconceptions/)

## Public RPC vs MEV-protected or private RPC

Public RPC is convenient, but not always ideal for recovery work.

For the final send path, a custom MEV-protected or private RPC is usually safer when:

- the compromised wallet may already be watched
- the recovery is time-sensitive
- you suspect bots are monitoring the wallet

Public RPC can still work, but privacy and execution quality may be worse.

## Know when to stop immediately

Stop and re-check everything if:

- you are not sure which wallet is donor and which is compromised
- you are about to paste a donor secret into the wrong field
- you selected `Remove EIP-7702 Delegation`, but the private key may already be exposed
- route summaries do not match your actual intent
- balances or fee numbers look obviously impossible
- a beta route looks incomplete, inconsistent, or confusing

Stopping is cheaper than sending the wrong transaction.

## Beta route rule

Some parts of AntiDrain are explicitly labeled beta.

That does not mean they are useless.

It does mean:

- you should watch them more carefully
- you should not force them if the output looks wrong
- the default fallback is `TX Builder`

## Safe key-handling habits

For a beginner, these habits matter a lot:

- do not keep seed phrases in screenshots
- do not leave secrets in chat windows
- do not send secrets to "support"
- do not assume a website is safe just because it looks polished
- if a wallet was truly compromised, do not plan to keep using it long-term

Official reference:

- [Ethereum wallets](https://ethereum.org/wallets/)

## Why reading screen copy matters

AntiDrain is not just a form with buttons.

Many screens intentionally explain what the current state means:

- whether a number is staged or final
- whether the route is incomplete
- whether the sender is using a fallback path
- whether the donor still needs top-up

Skipping that copy and clicking quickly is how operators miss important warnings.

## Final safety checklist before you proceed

Confirm all of this:

- donor wallet is correct
- donor wallet Backup JSON is exported and readable
- route matches the actual compromise
- selected network is correct
- RPC is acceptable for your risk level
- rescue and donor cleanup recipients are correct
- compromised wallet keys are entered only where intended
- the staged plan matches what you actually want to do
