# What AntiDrain Is

AntiDrain is a website for manually preparing EVM wallet rescue flows.

In simple words: the site helps you build a transaction, simulate it, calculate donor funding, and send the reviewed flow. It can help with asset rescue, EIP-7702 delegation removal, permit-based token transfers, custom batches, and supported DeBank withdrawal flows.

If you are new to web3 rescue, start with [If You Are New and Your Wallet Is at Risk](beginner-guide.md). It explains the workflow in plain language before the more detailed pages.

## What the Site Does

- creates or imports a donor wallet;
- helps you choose a rescue action;
- builds the transaction payload;
- shows a simulation result;
- calculates how much funding the donor needs;
- sends the transaction through the selected network and RPC;
- shows logs and the final result.

## What the Site Does Not Do

- it does not protect wallets automatically;
- it does not block attacker transactions;
- it does not monitor wallets in the background;
- it does not guarantee fund recovery;
- it does not replace your own checks.

## The Main Rule

Always check everything before sending:

- network;
- recipient address;
- donor address;
- wallet addresses you add;
- simulation result;
- gas and fee amount;
- final send screen.

If you do not understand what the selected action does, do not send the transaction.

## Minimal Rescue Shape

1. Prepare a new safe recipient address.
2. Open `/workspace`.
3. Select the network where the assets are.
4. Create a separate donor wallet.
5. Choose an action.
6. Build the transaction.
7. Run simulation.
8. Fund the donor only with the amount shown by the site.
9. Send the transaction.
10. Check the tx hash and recipient balance.

Do not rush. In a rescue flow, the correct network, correct recipient, and clear simulation result matter more than clicking quickly.
