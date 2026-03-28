---
title: Crypto Basics
description: "Plain-language crypto basics for first-time AntiDrain users: wallets, keys, chains, gas, RPC, transactions, calldata, and EIP-7702."
---

# Crypto Basics

You do not need to become a smart contract developer to use AntiDrain correctly.

You do need to understand a small set of concepts well enough that you do not confuse:

- an address with a private key
- a wallet app with the account behind it
- a token with the chain's native coin
- a pending estimate with a guaranteed final outcome

This page explains the minimum useful crypto knowledge in plain language.

## Wallet address vs private key vs mnemonic

These three things are not the same.

### Wallet address

Your wallet address is the public identifier that other people can send assets to.

- it usually starts with `0x`
- you can share it publicly
- it is safe to paste into block explorers, recipients, and receive fields

### Private key

Your private key is the secret that controls one specific account.

- anyone with it can sign transactions from that wallet
- you must never paste it into random websites, support chats, or forms you do not trust
- if an attacker has the compromised wallet private key, they effectively control that wallet

### Mnemonic / recovery phrase / seed phrase

A mnemonic is a human-readable backup phrase that can recreate one or more wallet accounts.

- it is even more sensitive than a single private key
- anyone with the phrase can usually restore the whole wallet
- do not screenshot it and do not leave it in cloud notes

AntiDrain works with both donor wallet private keys and donor wallet mnemonics, but both should be treated as high-risk secrets.

Read more:

- [Ethereum wallets](https://ethereum.org/wallets/)
- [Ethereum security and scam prevention](https://ethereum.org/security/)

## Wallet app vs blockchain account

Rabby, MetaMask, Ledger Live, and similar products are wallet apps.

The actual account lives on the blockchain.

This matters because:

- switching wallet apps does not change the account itself
- the same private key can often be imported into different wallet apps
- if the key is exposed, changing wallet apps does not fix the exposure

## Network, chain, and chain ID

AntiDrain is very sensitive to network selection.

In simple terms:

- a **network** or **chain** is a specific blockchain environment
- each network has its own **chain ID**
- the same address can exist on multiple networks, but balances and assets are different on each one

If you choose the wrong network:

- you may see the wrong balances
- token or pool detection can fail
- a transaction can be prepared for the wrong chain context

This is why TX Builder forces network selection early.

## Block explorers and why you should use them

A block explorer is a read-only site that shows on-chain data.

It is one of the safest tools a beginner can use because it helps you verify:

- whether an address is really the one you expect
- whether a token contract belongs to the intended network
- whether a transaction is still pending or already confirmed
- whether the wallet balance you see matches on-chain reality

Examples:

- Etherscan for Ethereum
- Arbiscan for Arbitrum
- chain-specific explorers for the network you are rescuing on

Good beginner rule:

- if something looks strange in the app, compare it with a block explorer before sending

## Native coin vs token vs NFT

These are three different asset types.

### Native coin

The native coin is the built-in currency of a network.

Examples:

- ETH on Ethereum mainnet
- POL or MATIC-style native balance on Polygon-style networks, depending on the network naming

Native coin pays for gas.

### ERC-20 token

An ERC-20 is a fungible token contract.

Examples:

- stablecoins
- governance tokens
- most regular token balances you see in wallets

In AntiDrain:

- ERC-20 transfers can be built manually in TX Builder
- the `Tokens Transfer [BETA]` route is a simplified ERC-20 sweep route

### ERC-721 / ERC-1155 NFT

NFT standards are different from ERC-20:

- ERC-721 usually means one token ID equals one unique NFT
- ERC-1155 can represent multiple token IDs and quantities in one contract

Read more:

- [ERC-20](https://eips.ethereum.org/EIPS/eip-20)
- [ERC-721](https://eips.ethereum.org/EIPS/eip-721)
- [ERC-1155](https://eips.ethereum.org/EIPS/eip-1155)

## Gas in simple terms

Gas is the execution cost of using the blockchain.

You can think of it as:

- the amount of work the network needs to do
- multiplied by the price per unit of that work

Important beginner rules:

- every transaction needs gas
- gas is paid in the network's native coin
- even a failed transaction can still consume gas
- more complex smart contract actions usually need more gas than a simple send

This is why AntiDrain uses a donor wallet: the donor wallet holds the native balance needed to execute the recovery flow.

Read more:

- [Ethereum gas and fees](https://ethereum.org/developers/docs/gas/)

## Gas limit, gas price, and why estimates can change

Three separate ideas are easy to confuse:

### Gas limit

The maximum gas a transaction is allowed to consume.

If the limit is too low:

- the transaction can fail with an out-of-gas error

### Gas price or EIP-1559 fees

The price paid per gas unit.

Depending on the chain and RPC, the site may use:

- legacy `gasPrice`
- or EIP-1559 style `maxFeePerGas` and `maxPriorityFeePerGas`

### Estimate

An estimate is the site's best current guess before sending.

It can change later because:

- network fee conditions move
- the RPC simulates differently
- the app learns more about the staged execution path

So if Fund Donor and TX Sender show slightly different numbers, that does not automatically mean anything is broken.

## RPC in plain language

RPC is the node endpoint the site talks to for blockchain data and transaction sending.

Examples:

- a public RPC
- your own private RPC
- a MEV-protected or private RPC

Why this matters in AntiDrain:

- RPC affects balance reads
- RPC affects gas estimation
- RPC affects simulation quality
- RPC affects how private your final send path is

For sensitive recoveries, MEV-protected or private RPC is usually safer than generic public RPC.

## Pending, confirmed, nonce, receipt

These words show up often in wallet and node tooling.

### Pending transaction

A pending transaction has been broadcast but is not finalized yet.

### Confirmed transaction

A confirmed transaction has been included on-chain.

### Nonce

Nonce is the per-account transaction counter.

Very simple rule:

- each new transaction from the same sender uses the next nonce

If nonce handling is wrong, the chain or RPC can reject the transaction.

### Receipt

A receipt is the result record for a mined transaction.

In TX Sender and Donor Assets, the app waits for finalization by transaction hash and then checks the receipt status.

## Smart contract, calldata, and ABI

If you are new, this sounds harder than it is.

### Smart contract

A smart contract is on-chain program logic.

When you claim rewards, withdraw from a pool, transfer tokens, or move NFTs, you are often calling a smart contract.

### Calldata

Calldata is the encoded input sent to a contract method.

It tells the contract what function to run and with which arguments.

### ABI

ABI is the structured description of a contract interface.

AntiDrain includes an ABI Encoder to help you build calldata locally when you know the function you need.

## EIP-7702 in one minute

You do not need the full specification to use AntiDrain safely.

Plain-language version:

- EIP-7702 adds a transaction path where an externally owned account can temporarily execute through delegated code
- the intended upside is better UX, including batching multiple actions into one flow and enabling sponsored-style execution patterns
- the same UX improvement is why one malicious signature can hide much more than users expect

What this means in practice:

- a single signature can wrap actions that previously looked like many separate prompts
- that can include approvals, transfers, claims, unstake flows, or other custom calls
- if you do not understand exactly what the signature is authorizing, do not sign it

What EIP-7702 does **not** do:

- it does not make your wallet a permanent smart wallet with durable safety rules
- it does not magically fix an already exposed private key
- it does not remove the need to verify the site, chain, recipient, and contract you are interacting with

This is why AntiDrain has a dedicated `Remove EIP-7702 Delegation` route and why the builder/send flow is EIP-7702-aware.

Useful references:

- [EIP-7702: Set Code for EOAs](https://eips.ethereum.org/EIPS/eip-7702)
- [EIP7702.io overview](https://eip7702.io/)
- [Pectra and EIP-7702 explainer by nazavod](https://teletype.in/@n4z4v0d/pectra_update)

## What AntiDrain can do and what it cannot do

AntiDrain can help you:

- prepare donor-funded recovery flows
- remove a malicious delegation in the narrow standalone case
- build and send staged rescue transactions
- clean up leftover donor assets

AntiDrain cannot:

- magically reverse an already confirmed wrong transfer
- make a compromised private key safe again
- guarantee perfect simulation on every RPC
- replace careful review of addresses, routes, and amounts

## The simplest mental model for AntiDrain

If you remember only this, remember this:

1. The **compromised wallet** is the wallet in danger.
2. The **donor wallet** is the separate wallet used to fund and send the rescue.
3. **TX Builder** defines what will happen.
4. **Fund Donor** estimates what the donor still needs.
5. **TX Sender** is the final execution step.

## Recommended next pages

- [Getting Started](./getting-started)
- [Safety Basics](./safety-basics)
- [Actions and Routes](./actions-and-routes)
- [Glossary](./glossary)

Optional external beginner reading:

- [Long-form crypto basics guide by cryppi](https://teletype.in/@cryppi/howtocrypto)
