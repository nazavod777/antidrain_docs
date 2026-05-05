# Donor Asset Manager

Asset Manager helps manage assets on the donor wallet.

It is usually used after rescue to withdraw leftover donor funds.

## What You Can Do

Depending on the network and available assets, you can:

- view native balance;
- view ERC-20 balance;
- withdraw native token;
- withdraw ERC-20 token.

## How to Withdraw Native Balance

1. Open Workspace.
2. Go to donor asset management.
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

- recipient is not the donor;
- recipient address is correct;
- selected network is correct;
- donor has enough gas;
- token is really the token you want to withdraw.

## Why Sending May Be Blocked

The button may be disabled if:

- balance is zero;
- recipient is invalid;
- recipient equals donor;
- RPC is unavailable;
- chainId does not match;
- gas is not enough;
- token is not found as a contract.
