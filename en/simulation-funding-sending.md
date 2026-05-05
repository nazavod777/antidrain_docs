# Simulation, Funding, and Sending

These steps happen after the transaction is built.

## Simulation

Simulation checks whether the transaction can execute.

It can help detect:

- wrong address;
- wrong network;
- missing balance;
- contract revert;
- gas issue;
- unsupported flow.

## If Simulation Succeeds

If simulation succeeds:

1. Check the summary.
2. Make sure the action looks expected.
3. Continue to Fund Donor.

## If Simulation Fails

Do not send blindly.

Check:

- selected network;
- RPC;
- donor address;
- recipient address;
- balances;
- private keys entered;
- whether the selected action is supported.

Sometimes an advanced override may be used, but only if you understand the error.

## Fund Donor

The Fund Donor step shows how much funding is required.

The donor usually needs funds for:

- gas;
- native value, if the flow sends native currency;
- service fee, if present;
- buffer for gas price changes.

## Send

The Send step broadcasts the transaction.

Before clicking Send, check:

- network;
- transaction type;
- donor address;
- recipient address;
- expected action;
- gas/funding summary;
- simulation result.

After sending, wait for the transaction hash and final status.

## If Sending Fails

Save the error and transaction hash if there is one.

Check whether the transaction was actually broadcast. Sometimes a UI error does not mean nothing happened on-chain.
