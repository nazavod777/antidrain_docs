---
title: FAQ and Troubleshooting
description: "Quick answers for locked steps, estimation mismatches, missing balances, RPC issues, and other common AntiDrain problems."
---

# FAQ and Troubleshooting

## Why is the next step locked?

The app uses gated progression on purpose.

Common reasons:

- donor backup export is still missing
- no route is selected in Actions
- TX Builder is incomplete
- network or RPC is unresolved
- the funding snapshot is not ready yet

## Can I use my own donor wallet?

Yes.

The Donor Wallet screen supports importing your own donor:

- private key
- or mnemonic

Generating a new donor wallet is optional.

## What if I refresh the page?

The current tab can restore wallet and Recovery flow context from session storage after a normal refresh.

That can help, but it is not your main safety system.

Export the donor wallet Backup JSON anyway.

## What if I close the tab?

The current active session context is not something you should assume will survive tab closure.

This is exactly why the donor wallet Backup JSON matters so much.

## Where are wallet credentials created and stored?

The donor wallet is created locally in the browser.

In the current implementation, active wallet and Recovery flow context can remain in the current tab session until the tab is closed or session data is cleared.

## Which route should I use if I only signed something malicious?

Use `Remove EIP-7702 Delegation` only when:

- the private key itself was not leaked
- the main problem is the malicious delegation signature

If you also need to move assets, use TX Builder instead.

## Which route should I use if I need claims, transfers, or mixed actions?

Use `TX Builder`.

That is the broader, more explicit route.

## What if `Tokens Transfer [BETA]` or `Pool Withdrawal [BETA]` looks wrong?

Do not force it.

Do this instead:

1. stop
2. keep the intended route logic in mind
3. rebuild the same case in full `TX Builder`

## Why does donor funding look too low or too high?

Check these possibilities:

- wrong route
- wrong network
- wrong RPC
- staged estimate is still in effect
- Transfer All Native is changing the interpretation
- State override support was unavailable and a fallback path is active

## Why does Fund Donor say no top-up is needed?

That can be valid.

Typical reasons:

- the donor already has enough native balance
- the current stage does not require more donor funds yet
- service fee can be covered elsewhere in the current plan

## Why can TX Sender push me back to Fund Donor?

Because the sender may discover that the real required amount is now higher than the earlier estimate.

Typical reasons:

- gas limit increased
- node reported insufficient funds
- safer fallback planning became necessary

This is protective behavior.

## What if TX Sender reports insufficient funds?

Usually it means the donor wallet no longer covers the real gas or execution requirement.

The correct response is:

1. go back to Fund Donor
2. let the funding snapshot recalculate
3. fund the donor wallet if needed

## What if the sender reports out of gas?

That means the gas limit was too low for the actual execution path.

AntiDrain may prompt for a higher gas limit and then recalculate the funding requirement before retrying.

## Why can simulation say one thing but real sending still fail?

Simulation improves safety, but it is not perfect.

Possible reasons:

- node behavior differs
- some RPC providers mis-simulate complex flows
- gas conditions changed
- the relevant state changed between estimate and send

This is why the app uses fallback logic and execution logging.

## What if the chain is unsupported for pricing?

The app may skip the USD-to-native fee quote because it cannot safely price the native token on that chain.

That does not automatically invalidate the route.

It means the pricing layer is less informative there.

## Why is donor cleanup withdrawal still blocked?

Typical reasons:

- network is missing
- custom RPC is invalid in custom mode
- balance has not been refreshed
- recipient is invalid
- token contract is invalid
- the balance is too small to cover gas

## Why does token withdrawal require native balance too?

Because ERC-20 withdrawals are still blockchain transactions.

Transactions need gas, and gas is paid in the network's native coin.

## Should I save the TX Sender log?

Yes, often that is a good idea.

It helps if you later need to:

- review what happened
- compare retry attempts
- explain a failure to someone technical

## Can AntiDrain reverse a transaction I already sent to the wrong address?

Usually no.

AntiDrain helps prepare and execute recovery flows, but it does not override how blockchains work.

Confirmed on-chain mistakes are generally not reversible by a central operator.

## Final beginner advice

If you are unsure, prefer the more explicit path:

- slow down
- read the route notes again
- re-check the addresses
- fall back to TX Builder

It is better to move carefully than to send the wrong flow quickly.
