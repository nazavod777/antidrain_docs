---
title: Glossary
description: "Plain-language definitions for the main AntiDrain terms, wallet roles, execution concepts, and route vocabulary."
---

# Glossary

This page explains the main AntiDrain terms in simple language.

If you want the longer beginner explanation, read [Crypto Basics](./crypto-basics) too.

## Compromised wallet

The wallet that is in danger.

Usually this means the wallet:

- that signed a malicious EIP-7702 delegation
- or that still holds the assets you are trying to move out safely

## Donor wallet

The separate wallet AntiDrain uses for execution.

It is used to:

- hold native coin for gas
- fund the staged Recovery flow
- send the final prepared transactions

It is not the wallet you are trying to rescue.

## Route

The recovery mode you choose in the **Actions** screen.

Available route families:

- `Remove EIP-7702 Delegation`
- `TX Builder`
- `Tokens Transfer [BETA]`
- `Pool Withdrawal [BETA]`

## Partner link

A normal AntiDrain link that carries the reward address of the person who shared it.

In practice:

- links usually use `affiliateAddress`
- older links with `affiliate_address` still work
- after the page opens, the browser remembers the reward address from the link
- that saved address can receive part of the fee
- it does not change the selected route or the total fee

## Recovery flow

The full sequence of steps from donor setup to final on-chain execution and cleanup.

A recovery flow can include:

- route selection
- transaction building
- donor funding estimation
- simulation
- sending
- donor cleanup

## Network / chain

The blockchain context you are working on.

Why it matters:

- balances are different per chain
- token contracts are different per chain
- chain ID and RPC must match the intended recovery

## Chain ID

The numeric identifier of the selected network.

If chain selection is wrong, the prepared transaction context can also be wrong.

## RPC

The node endpoint the site uses to read blockchain state and send requests.

Examples:

- public RPC
- private RPC
- MEV-protected RPC

## Block explorer

A read-only site that shows on-chain data.

You use it to verify things like:

- wallet balances
- token contracts
- transaction hashes
- whether a transaction is still pending or already confirmed

## MEV-protected or private RPC

An RPC path designed to reduce public mempool exposure or route the transaction more privately.

For sensitive recoveries, this is often safer than a generic public RPC.

## Native coin

The built-in coin of the selected network.

It pays gas.

This is why the donor wallet needs native balance even when you are mainly rescuing tokens.

## ERC-20

A fungible token standard.

In plain language, this covers most regular token balances.

## ERC-721

An NFT standard where token IDs usually represent unique items.

## ERC-1155

A multi-token standard that can represent multiple token IDs and quantities in one contract.

## Gas

The cost of executing a transaction on the network.

Simple version:

- more work usually means more gas
- gas is paid in native coin
- failed transactions can still consume gas

## Gas limit

The maximum gas a transaction is allowed to use.

If it is too low, the transaction can fail with an out-of-gas error.

## Simulation

A dry run before real sending.

Simulation helps answer questions like:

- will this likely revert
- is the route shaped correctly
- is the gas estimate plausible

It improves safety, but it is not an absolute guarantee.

## State override

A special RPC capability that lets the app estimate later execution states more accurately before the real send.

If the RPC does not support it, AntiDrain can fall back to a staged estimate and resolve later steps in TX Sender.

## Pending state

The not-yet-finalized state of the chain and transactions around it.

AntiDrain sometimes checks pending behavior because the final send path depends on current network conditions and current account state.

## Nonce

The per-account transaction counter.

Every new transaction from the same sender uses the next nonce.

## Receipt

The final result record for a mined transaction.

In simple terms, AntiDrain waits for the transaction hash and then checks the receipt status to decide whether the operation succeeded.

## TX Builder

The screen where you define what the recovery should actually do.

Depending on the route, it can control:

- network
- RPC
- compromised wallet keys
- transfer types
- recipients
- calldata
- simplified token or pool selection

## Fund Donor

The screen that calculates how much native balance the donor wallet currently needs for the chosen Recovery flow.

It does not send anything.

## TX Sender

The final execution screen.

This is where the app simulates, signs, broadcasts, and monitors the prepared Recovery flow.

## Donor Assets

The cleanup screen after the main recovery.

It helps you withdraw leftover:

- native balance
- ERC-20 balance

from the donor wallet.

## Transfer All Native

A special execution-time native sweep option.

In plain language:

- it runs after that wallet's other prepared calls
- it sweeps remaining native balance at execution time
- 20% is kept as the fee side
- 80% is routed to the donor wallet

If a partner address is saved, that 20% is split as 15% to the protocol and 5% to the saved address.

## Recipient

The address that should receive rescued assets or donor cleanup withdrawals.

Always double-check the recipient before sending anything.

## Backup JSON

The exported donor wallet Backup JSON file.

This is your durable fallback if the tab closes, crashes, or loses session state.

## Beta route

A shortcut route that can still be useful, but should be treated more cautiously.

If a beta shortcut looks incomplete or strange, the safe fallback is:

- stop
- rebuild the case in `TX Builder`

## Calldata

The encoded input sent to a smart contract function.

If you are using custom calls, calldata defines what the contract will try to do.

## ABI

The interface description used to encode or decode contract methods and arguments.

AntiDrain includes an ABI Encoder to help with this.

## Good beginner rule

If you do not understand a term, do not guess.

Go back one step, read the matching docs page, and confirm what the screen is supposed to do before you continue.
