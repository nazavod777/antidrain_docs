---
title: Donor Wallet
description: How to create, import, and manage the donor wallet for paying gas and sending rescue transactions.
---

# Donor Wallet

The donor wallet sends transactions and pays gas.

It allows the rescue flow to be sent even when the original or compromised wallet should not pay gas directly.

## Why the Donor Is Needed

The donor:

- Pays gas
- Sends the prepared rescue flow
- Can execute EIP-7702 flows
- Can send permit rescue flows
- Can withdraw its own leftover assets through Donor Asset Withdrawal

## How to Create a Donor

1. Open `https://antidrain.me/workspace`.
2. On the first step, create a donor.
3. Save the backup.
4. Copy the donor address.
5. Fund it only when the site shows the required amount.

## How to Import a Donor

If you already have a donor:

1. Click import.
2. Paste the private key or another supported format.
3. Check the address.
4. Save a backup if this donor is new to you.

## Backup

Backup lets you restore the donor later.

::: warning Check Your Downloads Folder

The site can start the backup download, but the browser does not always prove that the file was actually saved. Check your Downloads folder or selected folder manually.

:::

## Show / Hide Private Key {#show--hide-private-key}

![The Donor Wallet panel with a created wallet: mnemonic, private key and address fields, each with an eye button to reveal the value and a copy button beside it. The values are blurred in this screenshot on purpose.](/screenshots/en/02-donor-created.webp)

The Show button reveals the private key. Use it only when there is no screen share, screen recording, or other person nearby.

After reload, the private key should be hidden again.

## When to Fund the Donor

::: tip Wait for Fund Donor Calculation

You do not need to fund the donor with a large amount in advance. Wait for the Fund Donor step. It shows the calculated required amount.

:::

## Next

- [Workspace Flow](/en/workspace-flow) — the steps the workspace is made of.
- [Donor Asset Manager](/en/asset-manager) — how to withdraw leftovers after a rescue.
- [Service Fees](/en/service-fees) — what makes up the final amount.
