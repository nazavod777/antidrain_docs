---
title: Workspace Flow
description: Overview of the six steps in the workspace to prepare and send a wallet rescue transaction.
---

# Workspace Flow

Workspace has several steps. It is best to go through them in order.

## 1. Donor Wallet

Create or import the donor wallet.

Until the donor is ready, other steps may be unavailable.

## 2. Select Action {#2-action-builder}

Choose what you want to do:

- Remove Delegation, to clear an EIP-7702 delegation
- Custom TX Builder, to build the transfers by hand
- Permit Rescue
- DeBank Withdraw

## 3. TX Builder {#3-build}

The site builds the transaction payload.

If required data is missing, the build button will be disabled. Usually the UI explains what needs to be added.

Keep two similar names apart. **TX Builder** is this step, the third one: it hosts whichever panel the action you picked at step 2 needs, whichever action that is. **Custom TX Builder** is one of the four actions you pick at step 2, and this step can host its panel too. The names are close, but a step and an action are different things.

## 4. TX Simulator {#4-simulation}

Simulation checks the transaction before sending.

If simulation succeeds, you can move to donor funding.

If simulation fails, understand the error first.

## 5. Fund Donor

The site shows how much funding the donor needs.

Fund the donor and refresh the balance.

## 6. TX Sender {#6-send}

This is the final step. The site sends the transaction.

Before sending, check all details. After sending, watch the logs and tx hash.

## Can You Go Back?

Yes, but after changing important data, old simulation/funding/send results may become outdated.

If you changed network, recipient, keys, or action type, rebuild and simulate again.

## Next

- [Rescue Actions](/en/rescue-actions) — which action to choose.
- [Simulation, Funding, and Sending](/en/simulation-funding-sending) — the last three steps.
- [Glossary](/en/glossary) — what the terms mean.
