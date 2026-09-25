---
title: Core Safety Rules
description: Essential safety practices for using AntiDrain securely and avoiding compromising your rescue operation.
---

# Core Safety Rules

AntiDrain runs in your browser. This is convenient, but you must be careful.

The goal is to avoid turning one wallet problem into a second loss caused by a rushed mistake. If something looks strange, stop.

## Use a Clean Environment

::: warning Secure Your Environment

It is better to open the site in a separate browser profile or a browser without unnecessary extensions.

Do not work through:

- Suspicious extensions
- Someone else's computer
- Public Wi-Fi unless necessary
- Screen sharing where private keys or mnemonic words are visible
- Unknown sites asking for signatures in other tabs

:::

## Never Paste Extra Keys

::: danger Keys to Never Paste

Add only the private keys needed for the selected rescue action.

Do not paste:

- A main wallet seed phrase unless absolutely needed
- Private keys for wallets with large balances
- The donor private key into fields meant for rescue wallets

:::

If the site asks for a private key, first check which role that field means. The donor and the rescue wallet are different roles.

## Use a Separate Donor

It is safer to use a separate donor wallet created only for rescue transactions.

The donor should hold only the amount needed for gas and the current flow.

Do not send all your funds to the donor. The Fund Donor step shows the calculation. Fund roughly that amount plus a small buffer for gas changes.

## Check the Network

Before every send, make sure the selected network is correct.

For example, if the assets are on Ethereum, do not send the flow on BNB Chain or another network.

Also check RPC. If RPC returns a different chain ID or does not respond, the site may block actions. That is expected: fixing RPC is safer than sending blindly.

When the page loads, and again whenever you point it at a network or an RPC this tab has not asked before, the network actions are unavailable and say the site is checking the chain ID of this RPC. It is not a per-step wait, and not a repeating one: the answer is remembered for that endpoint, so neither moving between steps nor returning to an endpoint you have already used asks again. It is not a problem with your RPC either, and there is nothing to fix — the site is asking the node which chain it is on, and it will not let you build, simulate, fund or send against a node it has not heard from. How long it lasts depends on the node. When it does not answer, the site pauses and asks again — after 5 seconds, then 10, then 20 — and every ask can itself wait for a reply, up to 10 seconds for each of the network's endpoints it tries, so a slow or silent endpoint can make the whole wait noticeably longer than the pauses add up to. If the third repeat fails too, the site stops saying it is checking and asks you to choose a working RPC. Nothing you chose is lost by that: the selected action and your drafts stay as they were. If the failure looks temporary — a timeout, a rate limit, an overloaded server — the site keeps asking the node by itself every few seconds. If the node answered nothing usable, the site asks it again only when you come back to this tab or your connection returns, so switching to another tab and back is how you make it check once more. Either way, as soon as the node answers with the right chain you carry on where you were. Only a node that answers with a different chain sends the process back to the first step. The wording tells the two apart: "checking" clears on its own, while a request to choose a working RPC means the node either answered with the wrong chain or did not answer at all.

## Check the Recipient

Recipient is the address that should receive the assets.

If the recipient is wrong, assets can go to the wrong wallet.

It is best to create a new safe recipient wallet first and send rescued assets there. Do not send assets back to a compromised address.

## Simulation Is Not a Guarantee

A successful simulation reduces risk, but it is not a full guarantee. Network state can change between simulation and sending.

If the check ran and answered that the transaction will fail, a normal user should not press **Continue Anyway**. That override is only for someone who understands the failure reason and accepts the gas risk. A check that never finished is a different card with a different answer — it establishes nothing, so there is no measured risk to override, and **Check Again** is the first thing to press rather than the last; see [If Simulation Fails](/en/simulation-funding-sending#if-simulation-fails).

## Do Not Use the Site Blindly

If you see an unexpected error, strange address, unexpected amount, or wrong network/chain ID, stop.

It is better to spend time checking than to send the wrong transaction.

## Check the Final Send Screen

Before the TX Sender step, review:

- action;
- network;
- donor address;
- recipient;
- tokens or NFTs;
- gas/funding summary;
- simulation result;
- service fee, if present;
- transaction plan expiry.

If you changed network, recipient, amount, keys, or action after simulation, rebuild and simulate again.

## After Finishing

After a successful rescue:

- Save the tx hash
- Check the recipient balance
- Withdraw leftover funds from the donor
- Clear browser data if you used someone else's device
- Do not keep using a compromised private key

## Next

- [Donor Wallet](/en/donor-wallet) — why gas needs a separate wallet.
- [Simulation, Funding, and Sending](/en/simulation-funding-sending) — what to check on the final steps.
- [How Your Wallet Was Compromised](/en/wallet-compromised) — why the old address can never be reused.
