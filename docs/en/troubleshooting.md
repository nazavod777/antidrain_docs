---
title: Troubleshooting
description: Solutions for common issues when using AntiDrain like disabled buttons, RPC errors, and simulation failures.
---

# Troubleshooting

If you are new, do not fix errors by clicking randomly. Read the error, check network, addresses, and RPC, then repeat only the needed step.

| What You See | Go To |
| --- | --- |
| Button is disabled | [Button Is Disabled](#button-is-disabled) |
| Key not accepted | [Invalid Private Key](#invalid-private-key) |
| Network requests fail | [RPC Does Not Work](#rpc-does-not-work) |
| Network mismatch in wallet | [Chain ID Does Not Match](#chain-id-does-not-match) |
| Assets list is empty | [DeBank Did Not Load Assets](#debank-did-not-load-assets) |
| Simulation fails | [Simulation Failed](#simulation-failed) |
| Plan is outdated | [Transaction Plan Expired](#transaction-plan-expired) |
| Transaction has no confirmation | [Transaction Is Pending](#transaction-is-pending) |
| Balance unchanged | [Balance Did Not Update](#balance-did-not-update) |
| Error after broadcast | [Sending Failed After Broadcast](#sending-failed-after-broadcast) |

## Button Is Disabled

Usually a button is disabled because required data is missing.

Check:

- Donor is created
- Wallet is added
- Action is selected
- Recipient is entered
- Balances finished loading
- Simulation passed

If there is a tooltip or disabled-button message, read it. It usually tells you exactly what is missing.

## Invalid Private Key

Check that the key:

- Starts with `0x`
- Has the correct length
- Has no spaces
- Belongs to the expected wallet
- Is not the donor private key when the field expects a rescue wallet

Do not paste a seed phrase into a private-key field. A private key is one `0x...` string; a seed phrase is a list of words.

## RPC Does Not Work

Try:

- Refresh the page
- Select another RPC
- Check chainId
- Check your internet connection
- Try again later

RPC must be reachable from the browser. If an RPC blocks browser requests, choose another RPC with CORS support.

## Chain ID Does Not Match

This means the selected RPC is answering for the wrong network.

For example, you selected Ethereum, but the RPC responds as another chain. Do not continue:

1. select the correct network;
2. choose another RPC;
3. refresh balance or simulation;
4. only then build the transaction.

## DeBank Did Not Load Assets

Possible reasons:

- DeBank does not support the network
- Asset is not indexed
- Address is empty or wrong
- DeBank is temporarily unavailable
- Selected asset is not supported by the current flow

If the asset is in the wallet but DeBank does not show it, this is not always a site bug. DeBank may be delayed or may not support that position.

## Simulation Failed

::: danger Do Not Send

Do not send blindly.

Check:

- Correct network
- Available balance
- Allowance or permit
- Nonce
- Recipient
- Contract state

If the error is unclear, do not continue to Send through advanced override. Try a simpler action or check one asset separately.

:::

## Transaction Plan Expired

The transaction plan is valid only for a limited time. This prevents old gas and fee calculations from being used too late.

What to do:

1. return to Simulation;
2. run simulation again;
3. approve the new plan;
4. check Fund Donor again;
5. continue to Send.

## Transaction Is Pending

Check the transaction hash in the explorer.

If the transaction is pending:

- Wait
- Check gas
- Do not send another transaction without understanding nonce behavior

## Balance Did Not Update

Click refresh, check RPC, and check the explorer.

Some RPC providers update data with a delay.

## Sending Failed After Broadcast

If the site shows an error after sending but a tx hash already exists, check that hash in an explorer first.

Two things are possible:

- The transaction was sent and is waiting for confirmation
- The transaction reverted or was rejected by the network

Do not send again until you understand what happened to the first tx hash.
