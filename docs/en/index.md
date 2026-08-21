---
title: What AntiDrain Is
description: Overview of AntiDrain's capabilities and core safety rules for preparing EVM wallet rescue flows.
---

# What AntiDrain Is

AntiDrain is a website for manually preparing EVM wallet rescue flows.

In simple words: the site helps you build a transaction, simulate it, calculate donor funding, and send the reviewed flow. It can help with asset rescue, EIP-7702 delegation removal, permit-based token transfers, custom transaction batches, and supported DeBank withdrawal flows.

If you are new to web3 rescue, start with [If You Are New and Your Wallet Is at Risk](/en/beginner-guide). It explains the workflow in plain language before the more detailed pages.

## What the Site Does

- Create or import a donor wallet
- Help you choose a rescue action
- Build the transaction payload
- Show a simulation result
- Calculate how much funding the donor needs
- Send the transaction through the selected network and RPC
- Show logs and the final result

## What the Site Does Not Do

::: warning Important Limitations

- Protect wallets automatically
- Block attacker transactions
- Monitor wallets in the background
- Guarantee fund recovery
- Replace your own checks

:::

## The Main Rule

::: danger Always Verify Before Sending

Always check everything before sending:

- Network
- Recipient address
- Donor address
- Wallet addresses you add
- Simulation result
- Gas and fee amount
- Final send screen

If you do not understand what the selected action does, do not send the transaction.

:::

## Minimal Rescue Shape

1. Prepare a new safe recipient address.
2. Open the workspace: `https://antidrain.me/workspace`.
3. Select the network where the assets are.
4. Create a separate donor wallet.
5. Choose an action.
6. Build the transaction.
7. Run simulation.
8. Fund the donor only with the amount shown by the site.
9. Send the transaction.
10. Check the tx hash and recipient balance.

Do not rush. In a rescue flow, the correct network, correct recipient, and clear simulation result matter more than clicking quickly.

## What It Costs

On top of network gas, the site takes a fee from the rescued amount: 20% on token and native withdrawals. Some actions are charged at $5 per unit instead of a percentage — an NFT transfer, for example.

The fee is visible before sending, on the Fund Donor step. Every case is covered on [Service Fees](/en/service-fees).

## Next

- [How Your Wallet Was Compromised](/en/wallet-compromised) — what happened, and why you must not top up the affected wallet.
- [Before You Start](/en/prepare) — what to gather first.
- [Glossary](/en/glossary) — if any term is unclear.
