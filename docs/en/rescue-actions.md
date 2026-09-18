---
title: Rescue Actions
description: Detailed guide to choosing the right rescue action for your specific wallet recovery scenario.
---

# Rescue Actions

The site has several action types. Choose the one that matches your case.

If you are new, do not choose only by the name. First answer a simple question: what exactly do you want to do with the wallet or assets?

This is what the choice looks like on step two of the workspace:

![The Select Action step: four cards — Remove Delegation, Custom TX Builder, Permit Rescue and DeBank Withdraw, each with a short description underneath.](/screenshots/en/03-select-action.webp)

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
- [Nonce](/en/glossary#nonce) loading fails — the nonce is the address's transaction counter
- RPC cannot check delegation
- You are not sure you added the correct wallet

## Custom TX Builder {#custom-batch}

The Custom TX Builder action lets you assemble several transfers into one flow and send them together. It has four transaction types, and the type you pick decides which fields you have to fill in.

The order of work is the same for every type:

1. Add the private key of the wallet you are rescuing assets from. You can add several wallets.
2. Press Add Transaction and choose a type.
3. Fill in that type's fields.
4. Repeat for the remaining assets and wallets.
5. Build the transaction and move on to simulation.

::: warning The donor key does not go here
This list takes the keys of the wallets you are rescuing **from**. The site will not accept the donor's private key here: the donor only pays gas and signs the send.
:::

### Transfer Tokens (ERC-20)

The most common case: USDT, USDC and most other tokens. Suitable for a beginner as long as you know the token's contract address.

Fields:

- **Token Contract** — the contract address of the token you are moving.
- **Decimals** — a unit dropdown, where `Wei (10^-18)` corresponds to 18 places. Ordinary tokens use 18, but there are exceptions: USDT and USDC use 6. If you are unsure, check it in an [explorer](/en/glossary#explorer).
- **Amount** — how much to move. There is a "max" toggle next to it: with it on, the field reads "Transferring all tokens" and the amount comes from the full balance at execution time.
- **Recipient Address** — your new safe wallet.

![The ERC-20 transfer form: Token Contract and Recipient Address on top, then Amount with its max toggle and the Decimals dropdown showing "Wei (10^-18) — Decimals 18". Required fields are marked with an asterisk.](/screenshots/en/06-tx-erc20.webp)

### Transfer NFT (ERC-721)

For NFTs that exist as a single copy. One item moves per transaction.

Fields:

- **NFT Contract** — the collection address.
- **Token ID(s)** — the item's number inside the collection, for example `42`.
- **Recipient Address**.

The fee here is not a percentage but [fee units](/en/glossary#fee-unit): one per NFT transfer.

![The ERC-721 transfer form: NFT Contract, Recipient Address and Token ID(s) with the hint "e.g. 42".](/screenshots/en/07-tx-erc721.webp)

### Transfer NFT (ERC-1155)

The same NFT family, except an item can exist in several copies and one transaction can move several different IDs at once.

Fields:

- **NFT Contract**.
- **Token ID(s)** — one number or several separated by commas: `42` or `1,2,3`.
- **Transfer Amount(s)** — correspondingly `10` or `1,5,2`. The order must match the order of the IDs.
- **Recipient Address**.

![The ERC-1155 transfer form: NFT Contract, Recipient Address, Token ID(s) hinted as "e.g. 42 or 1,2,3" and Transfer Amount(s) hinted as "e.g. 10 or 1,5,2".](/screenshots/en/08-tx-erc1155.webp)

### Custom Transaction

Full control over what goes to the network. Needed when an asset cannot be moved by an ordinary transfer — when you have to call a contract method, for example.

Fields:

- **Target Contract** — the address the call is addressed to.
- **Calldata (hex)** — the [call data](/en/glossary#calldata) in hex form.
- **Value (Native)** — how much native coin to attach to the call, as a decimal or as hex wei. Usually `0`. A **Unit** dropdown next to it picks the scale of that number: `Ether` or `wei`.

There is no recipient field here: where the funds go is decided by the calldata itself.

::: danger Do not use this type on a guess
The site sends exactly the data you entered and does not check what it does. A mistake in the calldata can send assets to the wrong place or burn gas for nothing.

If you do not know where to get calldata, use one of the three types above, or the [DeBank Withdraw](#debank-withdraw) action.
:::

![The custom transaction form: Target Contract and Calldata (hex) on top, then Value (Native) and a Unit dropdown showing "Ether (10^18 wei)". This form has no recipient field.](/screenshots/en/09-tx-custom.webp)

### The "donor" Toggle Beside Recipient Address

On the three transfer forms above — ERC-20, ERC-721 and ERC-1155 — the **Recipient Address** label has a toggle next to it marked **donor**. Turning it on fills the field with the donor wallet's address, so you do not have to go back to step one and copy it. It is a shortcut for typing and nothing more: the transaction that gets built is the same one you would have built by pasting that address yourself.

Three things to know before you use it:

- **The field stays yours to type in.** The toggle does not lock it. Type anything that is not the donor address and the toggle clears itself.
- **Turning the toggle off empties the field.** It does not bring back an address that was there before, so you enter the recipient again from scratch.
- **It does nothing until a donor exists.** Before you have generated or imported one, the toggle cannot be turned on, and it says why: *Generate or import a donor wallet first*. Put the mouse on it, tap it, or reach it with the **Tab** key to read that.

The [Custom Transaction](#custom-transaction) form has no recipient field, so it has no toggle either.

::: warning The Donor Is a Stop, Not a Destination

Assets sent to the donor land on the wallet whose private key this browser is holding — and that is the wallet the site later offers to [erase](/en/donor-wallet#how-to-erase-the-donor-wallet) and to [replace](/en/donor-wallet#how-to-replace-the-donor-wallet). Both of those destroy that key, and whatever is still sitting at that address when they do stays there for good.

So a rescue that sends to the donor is not finished when the transaction confirms. Move the assets on to your own new safe wallet through [Donor Asset Withdrawal](/en/asset-manager), and keep the donor's **Export Backup** file until you have. That is one transaction more, and gas for it, than sending straight to your own address.

If you already have the new safe wallet that [Before You Start](/en/prepare) asks you to prepare, put its address in the field and leave the toggle alone.

:::

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

The current flow focuses on supported [Bundler](/en/glossary#bundler) token transfers and [pool exits](/en/glossary#pool-exit).

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
| Custom TX Builder | Need to move tokens or NFTs manually | Private key, contract addresses, recipient, network |
| Permit Rescue | Token supports permit signatures | Private key, contract address, recipient, deadline, network |
| DeBank Withdraw | Assets are visible in DeBank and supported | Private key, recipient, time for data load, network |

## How to Choose

If you need to clear EIP-7702 delegation, choose Remove Delegation.

If you need to transfer normal tokens or NFTs through a prepared batch, choose Custom TX Builder.

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

## Next

- [Simulation, Funding, and Sending](/en/simulation-funding-sending) — what happens after building.
- [Service Fees](/en/service-fees) — what each action is charged.
- [Affiliate Link](/en/affiliate) — how the fee is split.
