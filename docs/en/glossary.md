---
title: Glossary
description: Short explanations of the terms used across the AntiDrain documentation and in the site's interface.
---

# Glossary

Terms that appear in the documentation and in the interface. If a word came up in the text and did not make sense, it is probably here.

## Wallets and Access

### Private key

A secret string of the form `0x...` that gives full control over one address. Whoever knows the key controls the funds. It cannot be recovered or changed.

### Seed phrase (mnemonic)

A set of 12 or 24 words that private keys are derived from, usually for many addresses at once. If a seed phrase leaks, every address derived from it is compromised, not just one.

### Compromised wallet

A wallet whose private key or seed phrase may have reached someone else. Such a wallet must never be used again, even after the assets are moved out.

### Drainer

Software that automatically moves funds out of a wallet it has access to. It works faster than a person and reacts to anything that arrives.

### Recipient

The address the rescued assets will arrive at. It must be new and derived from a different seed phrase — see [Before You Start](/en/prepare).

### Donor wallet

A separate clean wallet that pays only for gas. It exists because topping up a compromised wallet is not an option.

## Networks and Transactions

### Network

A separate blockchain: Ethereum, BNB Chain, Polygon and others. Assets do not move between networks by themselves, and a rescue happens on the network that holds them.

### chain ID

The numeric identifier of a network. The site compares it against the RPC's answer: if they disagree, the selected network and the actual connection are different, and no transaction should be sent.

### RPC

The node the site reads network data through and sends transactions to. Different RPCs answer differently and restrict browser requests differently.

### Gas

The network's charge for executing a transaction. It is paid only in the native coin.

### Native token

The network's main coin, used to pay gas: ETH, BNB, POL and similar. Tokens like USDT cannot pay for gas.

### Nonce

A per-address transaction counter, and in plain words the place in the queue a transaction is signed for. Transactions from one address take effect in that order, so a second one sent while the first is still waiting does not overtake it — it queues up behind it, and you pay for both. That is why replacing a transaction that has not made it into a block means signing the replacement for the *same* place in the queue rather than the next one, and why the site offers to build one that way while that place is still free — see [Sent, Not in a Block Yet, and Replaceable](/en/simulation-funding-sending#sent-not-in-a-block-yet-and-replaceable).

### Simulation

A trial run of the transaction without sending it: the site shows what would happen and what it would cost. A successful simulation lowers the risk but is not a guarantee — network state can change.

### Transaction plan

The assembled set of data to be sent. It is valid for five minutes: gas prices and balances go stale in that time, so an expired plan has to be rebuilt.

### Broadcast

The moment a signed transaction goes out to the network. After broadcast it cannot be called back. It can be waited for, and while it is not in a block and the place in the queue it was signed for is still free for it, it can be replaced by another transaction signed for that same place — but the one thing nobody can do is un-send it.

### Permanent transaction

A transaction the network can no longer take back. Being confirmed is not the same thing: for a few minutes a network can still reshuffle its most recent blocks, and a transaction reshuffled away stops having happened. The site checks this before it lets the donor wallet be replaced or erased, or the whole rescue session erased — see [After Sending: Is the Transaction Permanent?](/en/simulation-funding-sending#after-sending-is-the-transaction-permanent).

### Tx hash

The identifier of a sent transaction. It is what you use to find the transaction in an explorer and see what happened to it.

### Explorer

A site for viewing transactions and balances on a specific network — Etherscan for Ethereum, BscScan for BNB Chain, and so on. Each network has its own.

## Tokens and Permissions

### ERC-20

The standard for ordinary tokens: USDT, USDC and most others. Tokens of this standard move through a contract call rather than like the native coin.

### ERC-721 and ERC-1155

NFT standards. ERC-721 is a unique item; ERC-1155 is an item that can exist in several copies. The standard affects how the fee is calculated.

### Approve and allowance

`approve` is the permission you grant a contract to spend your tokens. The `allowance` is how much it may spend. The permission stays valid until it is revoked, which is why access granted once remains with a malicious contract.

### Permit

A way to authorise a token transfer with a signature, without a separate `approve` transaction. It only works with tokens that support it.

### EIP-7702 delegation

A mechanism that makes an ordinary wallet execute code at a given address. Useful in itself, but a delegation signed over to an attacker lets them drive the wallet's transactions. It is cleared by the Remove Delegation action.

## AntiDrain Terms

### Bundler

An internal AntiDrain route that packs several transfers into one transaction through the rescue contract. This is not an ERC-4337 bundler; it is the name of a route in the interface.

### Pool exit

Withdrawing funds from a DeFi position — a liquidity pool or a lending protocol, for example — rather than a plain token transfer from an address.

### Calldata

Contract call data in hex form. It is only needed in the custom transaction mode: if you do not know what it contains, do not use that mode.

### Fee unit

How some actions are priced: one unit equals $5, and the site converts that into the native coin at the current price. It is used where a percentage of the amount makes no sense — an NFT transfer, for example.

### Balance at execution

A mode where the transfer amount comes from the actual balance at the moment the transaction runs, rather than from a number you typed. Useful when the balance may change before sending.

## Next

- [How Your Wallet Was Compromised](/en/wallet-compromised) — what happened and why.
- [FAQ](/en/faq) — short answers to common questions.
- [Troubleshooting](/en/troubleshooting) — if something is not working.
