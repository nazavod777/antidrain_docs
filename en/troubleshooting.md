# Troubleshooting

If you are new, do not fix errors by clicking randomly. Read the error, check network, addresses, and RPC, then repeat only the needed step.

## Button Is Disabled

Usually a button is disabled because required data is missing.

Check:

- donor is created;
- wallet is added;
- action is selected;
- recipient is entered;
- balances finished loading;
- simulation passed.

If there is a tooltip or disabled-button message, read it. It usually tells you exactly what is missing.

## Invalid Private Key

Check that the key:

- starts with `0x`;
- has the correct length;
- has no spaces;
- belongs to the expected wallet;
- is not the donor private key when the field expects a rescue wallet.

Do not paste a seed phrase into a private-key field. A private key is one `0x...` string; a seed phrase is a list of words.

## RPC Does Not Work

Try:

- refreshing the page;
- selecting another RPC;
- checking chainId;
- checking your internet connection;
- trying again later.

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

- DeBank does not support the network;
- asset is not indexed;
- address is empty or wrong;
- DeBank is temporarily unavailable;
- selected asset is not supported by the current flow.

If the asset is in the wallet but DeBank does not show it, this is not always a site bug. DeBank may be delayed or may not support that position.

## Simulation Failed

Do not send blindly.

Check:

- correct network;
- available balance;
- allowance or permit;
- nonce;
- recipient;
- contract state.

If the error is unclear, do not continue to Send through advanced override. Try a simpler action or check one asset separately.

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

- wait;
- check gas;
- do not send another transaction without understanding nonce behavior.

## Balance Did Not Update

Click refresh, check RPC, and check the explorer.

Some RPC providers update data with a delay.

## Sending Failed After Broadcast

If the site shows an error after sending but a tx hash already exists, check that hash in an explorer first.

Two things are possible:

- the transaction was sent and is waiting for confirmation;
- the transaction reverted or was rejected by the network.

Do not send again until you understand what happened to the first tx hash.
