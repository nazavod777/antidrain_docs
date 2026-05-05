# Donor Wallet

The donor wallet sends transactions and pays gas.

It allows the rescue flow to be sent even when the original or compromised wallet should not pay gas directly.

## Why the Donor Is Needed

The donor:

- pays gas;
- sends the prepared rescue flow;
- can execute EIP-7702 flows;
- can send permit rescue flows;
- can withdraw its own leftover assets through Asset Manager.

## How to Create a Donor

1. Open `/workspace`.
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

Important: the site can start the backup download, but the browser does not always prove that the file was actually saved. Check your Downloads folder or selected folder manually.

## Show / Hide Private Key

The Show button reveals the private key. Use it only when there is no screen share, screen recording, or other person nearby.

After reload, the private key should be hidden again.

## When to Fund the Donor

You do not need to fund the donor with a large amount in advance.

Wait for the Fund Donor step. It shows the calculated required amount.
