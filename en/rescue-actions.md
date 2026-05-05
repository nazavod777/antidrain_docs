# Rescue Actions

The site has several action types. Choose the one that matches your case.

If you are new, do not choose only by the name. First answer a simple question: what exactly do you want to do with the wallet or assets?

## Remove Delegation

This action clears EIP-7702 delegation from added wallets.

Use it when:

- the wallet has active EIP-7702 delegation;
- you want to remove delegated code;
- you want to stop future actions through that delegation.

Important: Remove Delegation does not change the private key. If the private key is already compromised, it stays compromised.

In simple words: this action removes delegated code connected to the account. It is like disconnecting a risky add-on, but the wallet key itself stays the same.

Prepare:

- the private key of the wallet where delegation must be removed;
- the correct network;
- a donor wallet to pay gas.

Stop if:

- the site says there is no delegation;
- nonce loading fails;
- RPC cannot check delegation;
- you are not sure you added the correct wallet.

## Custom Batch

Custom Batch lets you build several actions into one rescue flow.

Examples:

- ERC-20 transfer;
- NFT transfer;
- claim;
- raw contract call.

This mode is better for experienced users. If you do not understand calldata or contract calls, use it carefully.

For a beginner, the clearest TX Builder path is a normal ERC-20 or NFT transfer where you know the contract address, amount, and recipient.

Prepare for ERC-20:

- private key of the wallet holding the token;
- token contract address;
- recipient address;
- amount, or max mode if you want to move the full balance;
- correct network.

Prepare for NFT:

- private key of the NFT owner wallet;
- collection contract address;
- token ID;
- recipient address.

Use raw custom transactions only if you know the target address, data, and native value. If those words do not mean anything to you, do not use that mode.

## Permit Rescue

Permit Rescue uses token permit signatures when the token supports the required standard.

Supported ideas:

- EIP-2612;
- EIP-3009;
- DAI-like permit.

This action is useful when token transfer can be approved by signature instead of a separate approval transaction.

In simple words: some tokens let you sign permission for a transfer without sending a separate approve transaction. The site checks Permit support and asks you to generate permitData.

Prepare:

- private key of the wallet holding the token;
- token contract address;
- recipient address;
- amount or balance-at-execution mode;
- a clear deadline, meaning when the signature expires.

Stop if:

- the token shows No Permit or Unknown;
- signing fails;
- the site asks you to regenerate permitData after changing amount, network, donor, or deadline;
- you do not understand what amount will move or what minimum should arrive.

## DeBank Withdraw

DeBank Withdraw loads portfolio data from DeBank and helps prepare supported withdrawals.

The current flow focuses on supported Bundler token transfers and pool exits.

If DeBank does not show assets or returns an error, check:

- network;
- wallet address;
- RPC;
- DeBank availability;
- whether the asset is supported by the current flow.

In simple words: the site tries to find assets through DeBank and prepare withdrawals only for assets it knows how to handle. Not every DeFi position can be withdrawn automatically.

Prepare:

- private key of the wallet with assets;
- correct network;
- recipient address;
- time for DeBank data to load;
- confirmation that selected token or pool positions are actually supported.

Important: if a Permit token is selected inside DeBank Withdraw, sending may be unavailable for that variant. Use supported Bundler token transfers and pool exits when the site clearly allows you to continue.

## How to Choose

If you need to clear EIP-7702 delegation, choose Remove Delegation.

If you need to transfer normal tokens or NFTs through a prepared batch, choose Custom Batch.

If the token supports permit and you need a permit-based transfer, choose Permit Rescue.

If assets are visible in DeBank and the site supports the withdrawal, choose DeBank Withdraw.

## If You Still Do Not Know

Do not guess. Use this safer order:

1. Check the network and recipient.
2. Create a donor.
3. Choose the simplest action for one asset.
4. Build the transaction.
5. Run simulation.
6. If the result is unclear, do not send.
