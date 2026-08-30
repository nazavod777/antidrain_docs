---
title: Simulation, Funding, and Sending
description: Final three steps to validate, fund, and broadcast your prepared rescue transaction.
---

# Simulation, Funding, and Sending

These steps happen after the transaction is built.

## TX Simulator {#simulation}

Simulation checks whether the transaction can execute. The button that starts it reads **Run Simulation**.

It can help detect:

- Wrong address
- Wrong network
- Missing balance
- Contract revert
- Gas issue
- Unsupported flow

## If Simulation Succeeds

If simulation succeeds:

1. Check the summary.
2. Make sure the action looks expected.
3. Press **Proceed to Fund Donor**.

## If Simulation Fails

::: danger Do Not Send

Do not send blindly.

Check:

- Selected network
- RPC
- Donor address
- Recipient address
- Balances
- Private keys entered
- Whether the selected action is supported

Sometimes a manual override may be used, but only if you understand the error.

:::

## Fund Donor

The Fund Donor step shows how much funding is required.

The donor usually needs funds for:

- **Estimated Gas Cost**
- **Native Value to Send**, if the flow sends native currency
- **Native Service Fee**, if there is one
- A buffer for gas price changes

The panel adds these up as **Total to Fund**.

## TX Sender {#send}

The TX Sender step broadcasts the transaction.

Before pressing **Send Transaction**, check:

- Network
- Transaction type
- Donor address
- Recipient address
- Expected action
- Gas/funding summary
- Simulation result

After sending, wait for the tx hash and final status.

Once the transaction is confirmed, the send controls also offer **Erase donor wallet**, which retires the donor and reloads the page — see [How to Erase the Donor Wallet](/en/donor-wallet#how-to-erase-the-donor-wallet).

## If Sending Fails

Save the error and tx hash if there is one.

Check whether the transaction was actually broadcast. Sometimes a UI error does not mean nothing happened on-chain.

## Next

- [Donor Asset Manager](/en/asset-manager) — what to do with leftovers after sending.
- [Troubleshooting](/en/troubleshooting) — if simulation or sending failed.
- [Service Fees](/en/service-fees) — what goes into the Fund Donor amount.
