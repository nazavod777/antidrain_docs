---
title: FAQ
description: Frequently asked questions about AntiDrain, wallet recovery, and rescue operations.
---

# FAQ

## Will AntiDrain block an attack automatically?

No. AntiDrain does not monitor wallets and does not block transactions automatically. You prepare and send every flow yourself.

## I am completely new. Where should I start?

Start with a new safe recipient address and `https://antidrain.me/workspace`. Create a donor, select the network, build one clear action, run simulation, and do not send until you understand the summary.

## Do my keys leave the browser?

The site is a client-side app. Keys are used in the browser. This does not remove browser, extension, XSS, or local storage risks.

## Can I use my main wallet as the donor?

Technically yes, but it is safer to use a separate donor wallet with only the required amount.

## Where should rescued funds go?

To a new safe recipient wallet. Do not send funds back to an address whose private key may be stolen.

## When should I fund the donor?

After successful simulation, on the Fund Donor step. The site shows **Total to Fund** and **Remaining to Fund**. Before that, do not keep a large balance on the donor.

## What should I do after a successful rescue?

Check recipient balance, save the tx hash, withdraw leftovers from the donor, and stop using the compromised key. Erasing the donor wallet is the one step that waits: the line under the send buttons has to go empty first, which is how the site says the transaction is permanent.

## The transaction is confirmed. Why can I not erase the donor wallet?

Because for a while — from a few seconds to about half an hour, depending on the network — a network can still reshuffle its most recent blocks, and a transaction reshuffled away stops having happened. The donor holds the only key that could send the rescue again if that happens, so the site will not let you throw it away until your transaction is proved permanent. The same check guards **Generate Wallet** and **Import Wallet**, because a new donor is written over the stored one. Nothing is wrong and nothing is lost — press **Erase and reload** again later; where the site knows how long your network usually takes, the dialog's notice says so. Read the notice the dialog adds before you settle in to wait, though: if it says the transaction is not in a block yet and the place in the queue it was signed for is still free for it, the send step can replace that transaction rather than wait it out. Both cases are covered in [Why an Irreversible Step Can Be Withheld](/en/donor-wallet#why-an-irreversible-step-can-be-withheld) and [After Sending: Is the Transaction Permanent?](/en/simulation-funding-sending#after-sending-is-the-transaction-permanent).

## The transaction has been sent and is not in a block. What can I do?

Press **Check again** in the line under the send buttons first. It costs nothing, it asks the network afresh, and a transaction that has simply arrived ends the question on its own. If that same line also says the place in the queue your transaction was signed for is still free for it, there is a second button beside it — **Replace with a higher gas price** — which rebuilds the rescue for that same place in the queue and outbids what is waiting there.

Do not send the rescue a second time yourself. A second transaction from the donor takes the *next* place in the queue and waits behind the first, so you would pay for both and arrive no sooner. The full answer, including what to do when a network turns a replacement down, is [Sent, Not in a Block Yet, and Replaceable](/en/simulation-funding-sending#sent-not-in-a-block-yet-and-replaceable).

## Why do I need simulation?

Simulation helps check that the transaction looks executable before sending it to the network.

## Simulation succeeded. Is that a guarantee?

No. It is only a check at the time of simulation. Network state can change.

## What is EIP-7702 delegation?

It is a mechanism where an account can temporarily act through delegated code. Remove Delegation clears that delegation, but it does not change the private key.

Simpler: it is like a program connected to the account. Remove Delegation disconnects it, but if the private key was stolen, the old wallet is still unsafe.

## What is Permit Rescue?

It is a flow that uses a token permit signature if the token supports that approval method.

Not every token supports Permit. If the site shows No Permit or Not checked, or asks you to regenerate permitData, fix that first and do not send blindly.

## What is DeBank Withdraw?

It is a flow that uses DeBank data to find supported assets and prepare withdrawals.

If DeBank does not see an asset or the site says the flow is unsupported, that asset is not ready for automatic withdrawal through this action.

## What is a native token?

It is the main coin used for gas on a network: ETH, BNB, POL, and similar coins. ERC-20 tokens like USDT or USDC usually do not pay gas.

## What is RPC?

It is the connection to the network. Through RPC, the site reads balances, checks chain ID, runs simulation, and sends the transaction. If RPC is bad or unavailable from the browser, choose another one.

## What if I have a tx hash but the UI shows an error?

Check the tx hash in an explorer. Sometimes the transaction was already sent, but the UI or RPC could not wait for confirmation.

## What if I am not sure?

Do not send the transaction. First check network, addresses, amounts, simulation, and transaction details.

## Next

- [Glossary](/en/glossary) — what the terms mean.
- [Troubleshooting](/en/troubleshooting) — if something is not working.
- [Quick Start](/en/quick-start) — the step-by-step path.
