---
title: Rescue Actions
description: Detailed guide to choosing the right rescue action for your specific wallet recovery scenario.
---

# Rescue Actions

The site has several action types. Choose the one that matches your case.

If you are new, do not choose only by the name. First answer a simple question: what exactly do you want to do with the wallet or assets?

## Remove Delegation

This action clears EIP-7702 delegation from added wallets.

Use it when:

- The wallet has active EIP-7702 delegation
- You want to remove delegated code
- You want to stop future actions through that delegation

Important: Remove Delegation does not change the private key. If the private key is already compromised, it stays compromised.

In simple words: this action removes delegated code connected to the account. It is like disconnecting a risky add-on, but the wallet key itself stays the same.

Prepare:

- The private key of the wallet where delegation must be removed
- The correct network
- A donor wallet to pay gas

When to Stop:

- The site says there is no delegation
- Nonce loading fails
- RPC cannot check delegation
- You are not sure you added the correct wallet

## Custom Batch

Custom Batch lets you build several actions into one rescue flow.

Examples:

- ERC-20 transfer
- NFT transfer
- Claim
- Raw contract call

This mode is better for experienced users. If you do not understand calldata or contract calls, use it carefully.

For a beginner, the clearest TX Builder path is a normal ERC-20 or NFT transfer where you know the contract address, amount, and recipient.

Prepare for ERC-20:

- Private key of the wallet holding the token
- Token contract address
- Recipient address
- Amount, or max mode if you want to move the full balance
- Correct network

Prepare for NFT:

- Private key of the NFT owner wallet
- Collection contract address
- Token ID
- Recipient address

Use raw custom transactions only if you know the target address, data, and native value. If those words do not mean anything to you, do not use that mode.

## Permit Rescue

Permit Rescue uses token permit signatures when the token supports the required standard.

Supported ideas:

- EIP-2612
- EIP-3009
- DAI-like permit

This action is useful when token transfer can be approved by signature instead of a separate approval transaction.

In simple words: some tokens let you sign permission for a transfer without sending a separate approve transaction. The site checks Permit support and asks you to generate permitData.

Prepare:

- Private key of the wallet holding the token
- Token contract address
- Recipient address
- Amount or balance-at-execution mode
- A clear deadline, meaning when the signature expires

When to Stop:

- The token shows No Permit or Unknown
- Signing fails
- The site asks you to regenerate permitData after changing amount, network, donor, or deadline
- You do not understand what amount will move or what minimum should arrive

## DeBank Withdraw

DeBank Withdraw loads portfolio data from DeBank and helps prepare supported withdrawals.

The current flow focuses on supported Bundler token transfers and pool exits.

If DeBank does not show assets or returns an error, check:

- Network
- Wallet address
- RPC
- DeBank availability
- Whether the asset is supported by the current flow

In simple words: the site tries to find assets through DeBank and prepare withdrawals only for assets it knows how to handle. Not every DeFi position can be withdrawn automatically.

Prepare:

- Private key of the wallet with assets
- Correct network
- Recipient address
- Time for DeBank data to load
- Confirmation that selected token or pool positions are actually supported

::: warning Check Permit Compatibility

If a Permit token is selected inside DeBank Withdraw, sending may be unavailable for that variant. Use supported Bundler token transfers and pool exits when the site clearly allows you to continue.

:::

## Scenario Comparison

| Action | When to Use | What to Prepare |
| --- | --- | --- |
| Remove Delegation | Need to clear EIP-7702 delegation | Private key of wallet, donor, correct network |
| Custom Batch | Need to move tokens or NFTs manually | Private key, contract addresses, recipient, network |
| Permit Rescue | Token supports permit signatures | Private key, contract address, recipient, deadline, network |
| DeBank Withdraw | Assets are visible in DeBank and supported | Private key, recipient, time for data load, network |

## How to Choose

If you need to clear EIP-7702 delegation, choose Remove Delegation.

If you need to transfer normal tokens or NFTs through a prepared batch, choose Custom Batch.

If the token supports permit and you need a permit-based transfer, choose Permit Rescue.

If assets are visible in DeBank and the site supports the withdrawal, choose DeBank Withdraw.

## If You Still Do Not Know

::: info Do Not Guess

Do not guess. Use this safer order:

:::

1. Check the network and recipient.
2. Create a donor.
3. Choose the simplest action for one asset.
4. Build the transaction.
5. Run simulation.
6. If the result is unclear, do not send.
