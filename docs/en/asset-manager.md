---
title: Donor Asset Withdrawal
description: How to withdraw leftover funds and manage assets in the donor wallet after rescue.
---

# Donor Asset Withdrawal {#donor-asset-manager}

Donor Asset Withdrawal is the panel on step one that helps you manage the donor wallet's assets.

It is usually used after rescue to withdraw leftover donor funds.

## What You Can Do

Depending on the network and available assets, you can:

- View native balance
- View ERC-20 balance
- Withdraw native token
- Withdraw ERC-20 token

## How to Withdraw Native Balance

1. Open the workspace: `https://antidrain.me/workspace`.
2. Go to Donor Asset Withdrawal on step one.
3. Enter the recipient.
4. Click Withdraw.
5. Check the confirmation.
6. Confirm sending.

## How to Withdraw ERC-20

1. Make sure the token is shown.
2. Enter the recipient.
3. Check the amount.
4. Click Withdraw.
5. Confirm.

## Important Checks

Before withdrawing, check:

- Recipient is not the donor
- Recipient address is correct
- Selected network is correct
- Donor has enough gas
- Token is really the token you want to withdraw

## Why Sending May Be Blocked

| Reason | What to Check |
| --- | --- |
| Balance is zero | No assets on the donor to withdraw |
| Recipient is invalid | Enter the correct recipient address |
| Recipient equals donor | Cannot send to the same address |
| RPC is unavailable | Check your connection and try another RPC |
| chain ID does not match | Wrong network selected, choose the correct one |
| Gas is not enough | Insufficient funds on the donor for gas |
| Token is not found | Token contract is not supported |

## Next

- [Service Fees](/en/service-fees) — whether a fee applies to donor withdrawals.
- [Troubleshooting](/en/troubleshooting) — if the withdraw button is disabled.
