---
title: If You Are New and Your Wallet Is at Risk
description: Beginner-friendly introduction to AntiDrain's workflow for rescuing compromised wallets.
---

# If You Are New and Your Wallet Is at Risk

This page is for the moment when you do not know many web3 terms yet, but you need to understand what AntiDrain expects from you.

The basic idea is simple: prepare a new safe address, choose the action you need, check it with simulation, fund a separate donor wallet only for gas, and send the prepared transaction.

## Stop and Prepare First

::: warning Prepare Before Starting

Before you start, prepare:

- A clean browser without unnecessary extensions
- The correct site links: the workspace is `https://antidrain.me/workspace`, the docs are `https://docs.antidrain.me`
- A new safe recipient wallet where rescued funds should arrive
- The networks where your assets are located, such as Ethereum, BNB Chain, Base, or Arbitrum
- Token or NFT contract addresses, if you already know what you need to rescue
- A small amount of native coin for donor gas, but only after the Fund Donor step shows the required amount

:::

The gas coin is needed on the donor wallet, not on the affected one. Never send gas to the affected address: it will be swept along with everything else — see [How Your Wallet Was Compromised](/en/wallet-compromised). [Before You Start](/en/prepare) covers how to gather all of this.

If you are using someone else's computer, screen sharing, recording your screen, or working on a device with suspicious extensions, stop first.

## In Very Simple Words

**Compromised wallet** means a wallet whose private key may be known by an attacker.

**Recipient** means the new safe address where you want the assets to go.

**Donor** means a separate wallet that pays gas and sends rescue transactions. Do not keep large balances on it.

**Gas** means the network fee for running a transaction. Gas is paid in the native coin of the network, such as ETH, BNB, or POL.

**Network** means the blockchain where the assets are. An asset on Ethereum cannot be rescued by a transaction sent on BNB Chain.

**RPC** means the network connection used by the site to read balances, simulate, and send transactions. If the RPC is bad, balances, simulation, or sending may fail.

**Simulation** means a check before sending. It helps you see whether the transaction is likely to work, but it is not a full guarantee.

**Tx hash** means the transaction number. You can use it to find the transaction in a block explorer.

## Which Action to Choose

Choose **Remove Delegation** if the site shows an active [EIP-7702 delegation](/en/glossary#eip-7702-delegation) and you need to remove it. This removes delegated code, but it does not make the old private key safe again.

Choose **Custom TX Builder** if you know exactly which token or NFT to send, and you have the contract address, recipient, and amount.

For an ordinary token this is the clearest manual path. Ordinary tokens are the [ERC-20](/en/glossary#erc-20) standard: USDT, USDC and most others.

The same action also has a raw contract call mode. It needs [calldata](/en/glossary#calldata) — the call data in hex form. If that phrase means nothing to you, leave that mode alone.

Choose **Permit Rescue** if the token supports [permit](/en/glossary#permit) and the site can prepare the signature. Not every token supports this.

Choose **DeBank Withdraw** if assets are visible through DeBank and the site marks them as supported for withdrawal. If an asset is missing or unsupported, do not try to send blindly.

If you do not know what to choose, start small: find the network and one asset, check the recipient, create a donor, run simulation, and do not send until the result is clear.

## Low-Risk Order of Actions

1. Open `https://antidrain.me/workspace`.
2. Select the correct network at the top of the site.
3. Create a new donor wallet and save the backup.
4. Copy the donor address, but do not fund it with a large amount.
5. Choose a rescue action.
6. Add only the wallets and tokens required for that action.
7. Enter the recipient address. This should be your new safe address.
8. Click **Build Transaction**.
9. Click **Run Simulation**.
10. If simulation succeeds, carefully review the summary.
11. On Fund Donor, fund the donor only with the shown amount plus a small gas buffer.
12. Go to TX Sender only if the network, recipient, amount, and simulation result look expected.
13. Save the tx hash and check the recipient balance in your wallet or explorer.

## When You Must Not Continue

::: danger Do Not Send

Do not send the transaction if:

- The wrong network is selected
- You do not recognize the recipient address
- The site shows an unexpected address
- The check ran, reported the transaction will fail, and you do not understand why
- The amount is larger than expected
- RPC shows a different chain ID
- The site asks you to confirm continuing past a failure, and you do not understand why
- You accidentally pasted the donor private key into a rescue-wallet field

In these cases, go back, check the data, and rebuild the scenario.

:::

## After Rescue

After a successful send:

- Save the tx hash
- Check that assets arrived at the recipient
- Withdraw leftovers from the donor through Donor Asset Withdrawal
- Stop using the compromised wallet
- Clear browser data if you used someone else's device

AntiDrain helps you prepare and check actions, but you still decide whether to send.

## What It Costs

On top of network gas, the site takes up to 20% of each token or native withdrawal. Individual actions, an NFT transfer for example, are charged at $5 per unit.

The amount is visible before sending, on the Fund Donor step. Treat it as a calculation rather than a final bill: the percentage is the most taken from one transfer, less is sometimes collected, and a token that keeps a cut of its own transfers delivers less than the figure shown. Every case is covered on [Service Fees](/en/service-fees).

## Next

- [Before You Start](/en/prepare) — how to create the recipient, find the network, and get the gas coin.
- [Quick Start](/en/quick-start) — eight steps from donor to send.
- [Glossary](/en/glossary) — what the terms mean.
