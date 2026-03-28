---
title: Donor Wallet
description: "How the AntiDrain donor wallet works, why backup export matters, and how to prepare it safely before route selection."
---

# Donor Wallet

The Donor Wallet screen is the start of the entire AntiDrain Recovery flow.

If this step is sloppy, everything after it is riskier.

## What the donor wallet is used for

The donor wallet is the separate wallet AntiDrain uses to:

- hold native coin for gas
- fund the staged operation
- send the final prepared transactions

It is deliberately separate from the compromised wallet.

## Your two valid ways to start

### Option 1: Generate a fresh donor wallet locally

Use this if you want a clean wallet created inside the current browser session.

### Option 2: Import your own donor wallet

Use this if you already have a wallet you intentionally want to use as donor.

You can import using:

- a donor private key
- or a donor mnemonic

## What each field on this screen means

### Wallet address

This is the public donor address.

Use it to:

- verify which donor wallet is currently active
- fund the donor wallet from elsewhere if needed
- compare it with your offline notes

The `Copy` button becomes useful only after a wallet exists.

### Private key

This is the donor wallet private key.

Important behavior:

- the field is locked by default
- you must intentionally switch it into edit mode before manual changes
- if you type into it, the donor wallet state is treated as changing until the input is valid again

### Mnemonic

This is the donor wallet recovery phrase.

Important behavior:

- it also stays locked by default
- you must intentionally click `Edit` before manual changes
- editing the mnemonic is a high-risk operation because it can replace the donor wallet context

### Generate Wallet

Creates a fresh donor wallet locally in the browser session.

### Download Wallet

Exports the donor wallet Backup JSON.

This is not cosmetic. It is the step that unlocks the next stage.

## What the Backup JSON contains

The exported donor wallet Backup JSON includes the donor wallet secrets.

In practical terms, it contains:

- donor address
- donor private key
- donor mnemonic
- a security notice

Store it like a real secret.

## Why the site asks you to confirm the backup

After download, the UI asks you to confirm that you actually handled the backup.

This is there because many users click download and then forget where the file went.

The app wants an explicit operator acknowledgment before unlocking later steps.

## What happens when you type manually

If you manually edit donor inputs:

- the current donor wallet state can become pending or invalid until the input becomes valid
- the address display may clear while the app waits for valid input
- copy and edit labels change depending on whether the field is empty or in edit mode

This is intentional. The app is trying to avoid pretending that a half-edited secret is already a valid wallet.

## Why locking the secret fields is good

The edit lock exists to reduce accidental changes.

It helps protect against mistakes like:

- pasting into the wrong field
- leaving a textarea editable when you did not mean to change it
- overwriting a valid donor secret with partial text

## Progress card and readiness states

The right-side readiness area is there to answer one question:

**Can I safely move to the next stage yet?**

It tracks things like:

- whether a donor wallet exists
- whether the backup step was handled
- whether Actions is allowed to unlock

## Session restore behavior

The site can restore the donor wallet from the current tab session after a normal refresh.

That is useful, but it is not your main backup system.

The exported Backup JSON remains the durable fallback.

## Good way to complete this page

1. generate or import the donor wallet
2. verify the donor address
3. click `Download Wallet`
4. store the Backup JSON safely
5. confirm to yourself that the file is readable
6. only then continue to Actions

## Common beginner mistakes

### Treating donor as temporary and therefore unimportant

The donor wallet is still a real wallet that can hold real funds.

### Skipping or half-completing the backup step

This is exactly why later steps remain locked.

### Mixing donor and compromised secrets

Never paste donor secrets into the later compromised-wallet fields.

### Editing a field and forgetting that you changed the wallet context

If you manually revise a secret, confirm that the resulting donor address is still the one you intended.

## Ready-to-leave checklist

Before you leave this screen, confirm:

- the donor address is the one you intended
- the donor private key or mnemonic is valid
- the Backup JSON is saved
- you know where the backup file is

Next page:

- [Actions and Routes](./actions-and-routes)
