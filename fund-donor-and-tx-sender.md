---
title: Fund Donor and TX Sender
description: "How Fund Donor and TX Sender turn a prepared AntiDrain plan into a funded, simulated, and broadcast Recovery flow."
---

# Fund Donor and TX Sender

These two screens turn the prepared plan into something executable.

For a beginner, the most important idea is:

- **Fund Donor** explains what the donor still needs
- **TX Sender** is the only place where the actual send happens

## Fund Donor: what this screen actually does

Fund Donor does not send anything.

It calculates the current donor funding snapshot for the plan built in TX Builder.

That snapshot can include:

- service fee
- dispatcher deploy reserve
- rescue execution reserve
- final sender funding target

## What the main cards mean

### Donor Balance

The donor wallet's current native balance for the selected network context.

### Service Fee

The current native-denominated service fee quote, if that fee applies on the selected route and network context.

### Staged Gas Reserve

The gas reserve AntiDrain currently expects the donor wallet to cover.

Depending on the route and RPC support, this may include:

- deploy gas
- execute gas
- or only the stage that can be estimated safely right now

### Total Sender Funding Target

The current total native target reserved for TX Sender.

This is the most important number for the donor funding step.

## Why the estimate can be "staged"

Some Recovery flow estimates are not resolved all at once.

Examples:

- stage 1 can cover dispatcher deployment
- stage 2 can cover rescue execution after deployment context becomes clearer

This is why you should read the status copy, not just stare at one number and assume it must already be final.

## State override and fallback in plain language

If the RPC supports state overrides, AntiDrain can pre-estimate some later execution requirements earlier.

If the RPC does not support that reliably, the app falls back to a staged path:

- fund what is safely knowable first
- resolve the later execution step in TX Sender after deployment context exists

This is normal behavior, not automatically an error.

## Why the required top-up can be zero

Fund Donor may say no donor top-up is needed.

That can be valid.

Common reasons:

- the donor wallet already has enough native balance
- the current route has no extra donor top-up requirement at this stage
- service fee can be covered from unique compromised wallets in the current plan

Do not assume zero means the screen is broken.

## Transfer All Native and donor funding

Transfer All Native has special behavior:

- the native sweep happens at execution time
- 20% becomes the fee side
- 80% goes to the donor wallet
- that fee is taken from the swept compromised-wallet balance itself

If the browser has a saved partner address, that 20% is split as 15% to the protocol and 5% to the saved partner address.

So Transfer All Native is not just a normal donor top-up line item.

## What to do on the Fund Donor screen

1. confirm the donor wallet shown is correct
2. read the donor balance
3. read the required top-up state
4. read the funding status copy
5. if needed, top up the donor wallet before going to TX Sender

## TX Sender: the final execution screen

TX Sender is where the prepared flow is actually:

- simulated
- gas-checked
- signed
- broadcast
- monitored to finalization

This is the last step before on-chain execution.

## What the execution log is for

The execution log is one of the most useful parts of the app.

It tells you:

- what stage is currently running
- whether a simulation succeeded
- whether the app had to fall back or retry
- whether gas changed
- whether the transaction hash was sent and finalized
- why a failure happened

Do not ignore it.

The site also lets you:

- copy the log
- save the log
- clear the log

Saving it is useful if you need to review what happened later.

## A plain-language view of what TX Sender may do

Depending on the route, TX Sender can do things like:

- run pre-send undelegation simulation
- deploy the dispatcher
- run rescue simulation
- resolve gas limits with fallback logic
- sign EIP-7702 authorizations
- broadcast transactions
- wait for receipts by transaction hash

For the beginner, the key idea is simple:

TX Sender is not randomly "doing extra stuff". It is executing the staged plan the route requires.

## Why TX Sender can return you to Fund Donor

This is important.

If the app learns during sending that the donor funding is no longer enough, it can redirect you back to Fund Donor.

Typical reasons:

- gas estimate changed
- node reported insufficient funds
- a safer gas limit was needed

This is protective behavior. It prevents you from continuing with underfunded execution.

## Out-of-gas handling

If the sender detects likely out-of-gas conditions, the app can:

- explain that the transaction ran out of gas
- ask for a higher gas limit
- recalculate the donor funding requirement
- retry the flow with the updated gas limit

This is one reason the sender is more than a simple "click send" page.

## Simulation fallbacks and RPC limitations

Sometimes the current RPC pool does not support ideal simulation behavior.

In those cases the app may:

- use State override when available
- fall back to direct simulation
- continue with heuristic gas planning when some RPC providers mis-simulate the Recovery flow

This does not mean "anything goes". It means the app is trying to stay resilient across different node behaviors.

## What to check before pressing Send

Confirm all of this:

- donor wallet is funded enough
- selected network is correct
- RPC choice is acceptable for your risk level
- route still matches the case
- recipients are correct
- token, NFT, or pool selections are correct
- beta routes still look sane

## What to do after success

After a successful Recovery flow:

- read the final sender status
- save the log if you want a record
- move to Donor Assets and review leftover donor balances

## What to do after failure

Do not panic-click retry immediately.

Instead:

1. read the execution log
2. identify whether the issue was funds, gas, simulation, or route data
3. if redirected, revisit Fund Donor
4. if the route itself looks wrong, return to TX Builder

Next page:

- [Donor Assets](./donor-assets)
