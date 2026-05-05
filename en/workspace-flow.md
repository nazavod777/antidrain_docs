# Workspace Flow

Workspace has several steps. It is best to go through them in order.

## 1. Donor Wallet

Create or import the donor wallet.

Until the donor is ready, other steps may be unavailable.

## 2. Action Builder

Choose what you want to do:

- remove EIP-7702 delegation;
- build a custom batch;
- use Permit Rescue;
- prepare DeBank Withdraw.

## 3. Build

The site builds the transaction payload.

If required data is missing, the build button will be disabled. Usually the UI explains what needs to be added.

## 4. Simulation

Simulation checks the transaction before sending.

If simulation succeeds, you can move to donor funding.

If simulation fails, understand the error first.

## 5. Fund Donor

The site shows how much funding the donor needs.

Fund the donor and refresh the balance.

## 6. Send

This is the final step. The site sends the transaction.

Before sending, check all details. After sending, watch the logs and transaction hash.

## Can You Go Back?

Yes, but after changing important data, old simulation/funding/send results may become outdated.

If you changed network, recipient, keys, or action type, rebuild and simulate again.
