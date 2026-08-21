---
title: Affiliate Link
description: How to create and use affiliate links to earn a share of protocol fees from supported rescue flows.
---

# Affiliate Link

The `/affiliate` page helps create a link with your EVM payout address.

If someone opens AntiDrain through your link and later uses a supported paid rescue flow, part of the fee can be paid to your address.

## How to Create a Link

1. Open `/affiliate`.
2. Enter your EVM payout address.
3. Copy the link.
4. Share it with the user.

## Affiliate Wallet Requirements

The payout address must be a normal EVM wallet that you control.

Do not use an address if:

- It is a smart contract
- It has an active EIP-7702 delegation
- The address currently shows delegated code

If you are not sure, check the address in an explorer or through RPC before creating the link. If the address has EIP-7702 delegation, remove it with Remove Delegation first, then use the address as the affiliate wallet.

## How It Works

The link includes your address in the `?affiliate=` parameter.

When a user opens the site with that link, AntiDrain saves your address locally in the user's browser as the affiliate wallet.

If the user's browser already has another affiliate wallet saved, the new address usually does not replace the old one. The user can clear the saved address on `/affiliate`.

::: info Fee Split Only

The affiliate link does not increase the user's total fee. It only changes how an existing fee is split between protocol and affiliate.

:::

## Percentages and Rewards

There are two payout types.

### 1. Token Rescue Fee

This is a fee in the token being rescued.

When a supported token rescue flow applies the standard token fee:

- Total fee is 20% of the rescued amount
- User/recipient receives 80%
- Protocol receives 15%
- Affiliate receives 5%

If there is no active affiliate wallet:

- User/recipient receives 80%
- Protocol receives 20%
- Affiliate receives 0%

Examples:

- If 100 USDT is rescued, the affiliate receives 5 USDT
- If 1,000 TOKEN is rescued, the affiliate receives 50 TOKEN
- If 0.5 ETH is rescued through a supported native transfer-all flow with the same split, the affiliate receives 0.025 ETH

### 2. Native Service Fee

This is a separate fee in the network's native coin: ETH, BNB, POL, AVAX, and so on.

The site calculates it in fee units. One fee unit is $5, then it is converted into the native coin using the current price.

If an affiliate wallet is active:

- Protocol receives 75% of the native service fee
- Affiliate receives 25% of the native service fee

So the affiliate receives $1.25 for each fee unit.

Examples:

- If the service fee is $5, the affiliate reward is $1.25 in the native coin
- If the service fee is $10, the affiliate reward is $2.50 in the native coin
- If the service fee is $15, the affiliate reward is $3.75 in the native coin

The exact ETH/BNB/POL amount depends on the native coin price when the quote is calculated.

## When the Affiliate Gets Paid

The affiliate receives a payout only when all of these are true:

- The user opened the site through your link
- Your EVM address was saved as the affiliate wallet
- The user reached a paid rescue flow
- The selected flow supports affiliate fee sharing
- The transaction was sent and executed successfully
- That flow actually had a fee that can be split

The affiliate can receive a payout in these cases:

- Supported ERC-20 token rescue where token fee applies
- Permit Rescue when the selected mode uses token fee
- DeBank/Bundler token transfer or native transfer-all when that route applies fee split
- Custom Batch / DeBank actions with native service fee, such as raw calls, NFT/pool actions, or other fee-bearing operations

The affiliate does not receive a payout if:

- The user did not open your link
- The address was not saved or was cleared
- The flow is free
- The flow does not support affiliate fee sharing
- The transaction was not sent or failed before payout
- The affiliate wallet cannot receive the payout

## Important

::: info Safe Fallback Logic

An affiliate link does not change rescue safety.

If the affiliate wallet cannot receive a native payout or token payout, rescue execution should not break. In that case the affiliate reward may use fallback logic, usually sending that share to the protocol recipient.

:::

## What to Check

Check that:

- The address is correct
- The address is not a smart contract
- The address has no active EIP-7702 delegation
- The full link was copied
- The user opened your link
- `/affiliate` shows the expected saved affiliate wallet for the user
- The flow actually supports fee sharing
- The selected flow has a fee that can produce a payout
