---
title: How Your Wallet Was Compromised
description: What a drainer is, how access to your wallet was taken, and why you must never send gas to a compromised address.
---

# How Your Wallet Was Compromised

This page explains what happened to your wallet and why the rescue works the way it does. If you already know the cause and want to start, go to [Before You Start](/en/prepare).

## What a Drainer Is

A drainer is software that moves funds out of a wallet it has access to. It does not "break the blockchain": it uses the fact that, as far as the network is concerned, it can legitimately sign transactions on your behalf.

Once an attacker has access, they control the wallet exactly as you do. The network does not distinguish who sent a transaction — it only checks the signature.

## How Access Was Taken

Access usually leaks in one of these ways:

- You signed a transaction or a message on a fake site that looked like the real one.
- You granted a token spending allowance (`approve`) to a contract that turned out to be malicious. That allowance stays valid until it is revoked.
- You entered a seed phrase or private key somewhere else could see it: a fake site, someone else's computer, a screenshot, a chat, cloud storage.
- A browser extension was reading pages or swapping addresses.
- You signed an EIP-7702 delegation, which makes the wallet execute someone else's code.

You do not need to know the exact cause to run a rescue. What matters is this: if funds are leaving on their own, someone has access, and they keep it until you move the assets to a new address.

## What Is Happening Right Now

Transactions are visible on the network before they are included in a block. An attacker can watch that queue and send their own transaction with a higher fee so it executes before yours.

::: warning This is a race, and it can be lost
A drainer often runs automatically and reacts faster than a person. That is why AntiDrain prepares the transaction in advance and sends it in one action, instead of having you fill in fields as you go.

For the same reason, choose an MEV-protected RPC in the network settings: it reduces the chance that an attacker sees your transaction in the public queue and front-runs the withdrawal.
:::

## Never Top Up the Compromised Wallet

Sending a transaction needs the network's native coin for gas. The obvious move is to send a little coin to the affected wallet. Do not do that.

::: danger Gas sent there is gas you lose
The drainer sees the incoming funds and sweeps them along with everything else. You would simply hand the attacker a little more and still have no gas.

This is exactly why AntiDrain uses a [donor wallet](/en/donor-wallet): gas is paid by a separate clean wallet the attacker has no access to. Fund only the donor, and only with the amount the Fund Donor step shows.
:::

## Why the Old Wallet Can Never Be Used Again

Rescuing assets does not give you back control of the old wallet. The private key is still known to the attacker, and `approve` allowances and delegations may remain.

Even if you removed the delegation and moved out every last token, the wallet stays compromised permanently. Anything new that arrives there is at risk again.

Treat the old address as closed: do not accept payouts to it, do not use it for new operations, and do not restore its seed phrase into other wallets.

## If the Attacker Got There First

It happens, and it is worth saying plainly: blockchain transactions are irreversible. If the assets are already gone, AntiDrain cannot bring them back — the site prepares and sends transactions, it does not undo someone else's.

What is still worth checking:

- Whether assets remain on other networks. Funds do not move between networks by themselves, and often only one is drained.
- Whether NFTs or pool positions remain — those are not always taken.
- Whether an active EIP-7702 delegation is still in place, which would put future incoming funds at risk.

If anything remains, rescue it to a new address. If nothing remains, the only useful next step is understanding the cause so it does not repeat on the new wallet.

## Next

- [Before You Start](/en/prepare) — what to gather first.
- [Core Safety Rules](/en/safety) — what to check before every send.
- [Glossary](/en/glossary) — if any term here is unfamiliar.
