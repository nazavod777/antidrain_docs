# FAQ

## Will AntiDrain block an attack automatically?

No. AntiDrain does not monitor wallets and does not block transactions automatically. You prepare and send every flow yourself.

## I am completely new. Where should I start?

Start with a new safe recipient address and `/workspace`. Create a donor, select the network, build one clear action, run simulation, and do not send until you understand the summary.

## Do my keys leave the browser?

The site is a client-side app. Keys are used in the browser. This does not remove browser, extension, XSS, or local storage risks.

## Can I use my main wallet as the donor?

Technically yes, but it is safer to use a separate donor wallet with only the required amount.

## Where should rescued funds go?

To a new safe recipient wallet. Do not send funds back to an address whose private key may be stolen.

## When should I fund the donor?

After successful simulation, on the Fund Donor step. The site shows total required and remaining to fund. Before that, do not keep a large balance on the donor.

## What should I do after a successful rescue?

Check recipient balance, save the transaction hash, withdraw leftovers from the donor, and stop using the compromised key.

## Why do I need simulation?

Simulation helps check that the transaction looks executable before sending it to the network.

## Simulation succeeded. Is that a guarantee?

No. It is only a check at the time of simulation. Network state can change.

## What is EIP-7702 delegation?

It is a mechanism where an account can temporarily act through delegated code. Remove Delegation clears that delegation, but it does not change the private key.

Simpler: it is like a program connected to the account. Remove Delegation disconnects it, but if the private key was stolen, the old wallet is still unsafe.

## What is Permit Rescue?

It is a flow that uses a token permit signature if the token supports that approval method.

Not every token supports Permit. If the site shows No Permit, Unknown, or asks you to regenerate permitData, fix that first and do not send blindly.

## What is DeBank Withdraw?

It is a flow that uses DeBank data to find supported assets and prepare withdrawals.

If DeBank does not see an asset or the site says the flow is unsupported, that asset is not ready for automatic withdrawal through this action.

## What is a native token?

It is the main coin used for gas on a network: ETH, BNB, MATIC, and similar coins. ERC-20 tokens like USDT or USDC usually do not pay gas.

## What is RPC?

It is the connection to the network. Through RPC, the site reads balances, checks chainId, runs simulation, and sends the transaction. If RPC is bad or unavailable from the browser, choose another one.

## What if I have a tx hash but the UI shows an error?

Check the tx hash in an explorer. Sometimes the transaction was already sent, but the UI or RPC could not wait for confirmation.

## What if I am not sure?

Do not send the transaction. First check network, addresses, amounts, simulation, and transaction details.
