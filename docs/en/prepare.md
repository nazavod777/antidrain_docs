---
title: Before You Start
description: "What to gather before a rescue: a new recipient wallet, the right network, coin for gas, and a check that you opened the real site."
---

# Before You Start

A rescue moves fast, and hunting for an address or figuring out an exchange mid-process is the worst time to do it. Gather everything first — it takes a few minutes and removes most of the risk of a mistake.

## What You Will Need

- A new safe wallet for the rescued assets to arrive in.
- Knowledge of which network holds the assets.
- A small amount of that network's native coin for gas, but **not** on the affected wallet.
- The private key of the affected wallet — it is needed to sign the withdrawal.
- The real AntiDrain address.

Below is how to get each one if this is your first time.

## The New Recipient Wallet

The recipient is the address the assets will move to. It must be new and entirely yours.

Create a new wallet in any EVM wallet (MetaMask, Rabby or Trust Wallet, for example). It has to support the same network the assets are on: addresses look identical across EVM networks, but the network is chosen inside the wallet itself.

Write the new wallet's seed phrase on paper and put it away. Do not save it in notes, in a chat, in cloud storage, and do not screenshot it — that is the most common way access is lost.

::: danger Do not create the recipient from the same seed phrase
If the attacker has the affected wallet's seed phrase, then every address derived from that same phrase is under their control too — including a "new account" added inside the same wallet with one click.

You need a wallet with a completely new seed phrase. If you are not sure where the affected address came from, assume the seed is compromised.
:::

## How to Find Which Network Holds Your Assets

Funds do not move between networks by themselves. You rescue on the network where they sit, and each network separately.

Ways to check:

- Open your wallet and switch networks: wherever the tokens show up is where they are.
- Open the address portfolio on debank.com — it shows assets across many networks at once. The DeBank Withdraw action uses the same data.
- Look the address up in a block explorer for the network, if you already know which one to check.

If assets sit on several networks, start with the largest and repeat for the others.

## Where the Gas Coin Comes From

Gas is paid in the network's native coin: ETH on Ethereum, BNB on BNB Chain, POL on Polygon, and so on. Tokens like USDT do not pay for gas.

The coin is needed on the donor wallet you create in step one, not on the affected wallet. You can get it:

- from an exchange — withdraw a small amount, making sure to select the same network;
- from another wallet of yours the attacker has no access to.

::: warning Fund the donor only after the calculation
The Fund Donor step shows the exact amount. Do not send a large amount to the donor in advance: the precise figure appears after the transaction is built and simulated, and it is usually small.

And do not send gas to the affected wallet: it will be swept along with everything else. See [How Your Wallet Was Compromised](/en/wallet-compromised).
:::

## Check You Opened the Real Site

Fake copies of rescue sites are common, and someone in a panic checks the address less carefully than usual.

The workspace lives at `https://antidrain.me/workspace` and the documentation at `https://docs.antidrain.me`. Compare the address in the browser bar character by character before entering a private key.

Open the site from a link you typed yourself or took from your bookmarks — not from search results, a chat, or an email.

## What It Costs

On top of gas, the site takes a fee out of the rescued amount: up to 20% of each token or native withdrawal, of which 5% goes to an affiliate when a link is active and that address can accept it. Some actions are charged at $5 per unit instead of a percentage.

The percentage is the most taken from one transfer, not a bill for the whole rescue, and the amounts beside it are calculated rather than measured — a token that keeps a cut of its own transfers delivers less. The fee is visible before sending, on the Fund Donor step. Every case is covered on [Service Fees](/en/service-fees).

## Next

- [Quick Start](/en/quick-start) — eight steps from donor to send.
- [Donor Wallet](/en/donor-wallet) — why it exists and how to create it.
- [Glossary](/en/glossary) — if any term is unfamiliar.
