# If You Are New and Your Wallet Is at Risk

This page is for the moment when you do not know many web3 terms yet, but you need to understand what AntiDrain expects from you.

The basic idea is simple: prepare a new safe address, choose the action you need, check it with simulation, fund a separate donor wallet only for gas, and send the prepared transaction.

## Stop and Prepare First

Before you start, prepare:

- a clean browser without unnecessary extensions;
- the correct AntiDrain site link;
- a new safe recipient wallet where rescued funds should arrive;
- the networks where your assets are located, such as Ethereum, BNB Chain, Base, or Arbitrum;
- token or NFT contract addresses, if you already know what you need to rescue;
- a small amount of native coin for donor gas, but only after the Fund Donor step shows the required amount.

If you are using someone else's computer, screen sharing, recording your screen, or working on a device with suspicious extensions, stop first.

## In Very Simple Words

**Compromised wallet** means a wallet whose private key may be known by an attacker.

**Recipient** means the new safe address where you want the assets to go.

**Donor** means a separate wallet that pays gas and sends rescue transactions. Do not keep large balances on it.

**Gas** means the network fee for running a transaction. Gas is paid in the native coin of the network, such as ETH, BNB, or MATIC.

**Network** means the blockchain where the assets are. An asset on Ethereum cannot be rescued by a transaction sent on BNB Chain.

**RPC** means the network connection used by the site to read balances, simulate, and send transactions. If the RPC is bad, balances, simulation, or sending may fail.

**Simulation** means a check before sending. It helps you see whether the transaction is likely to work, but it is not a full guarantee.

**Tx hash** means the transaction number. You can use it to find the transaction in a block explorer.

## Which Action to Choose

Choose **Remove Delegation** if the site shows active EIP-7702 delegation and you need to remove it. This removes delegated code, but it does not make the old private key safe again.

Choose **TX Builder** if you know exactly which token or NFT to send, and you have the contract address, recipient, and amount. For a normal ERC-20 transfer, this is the clearest manual path. Use raw custom calls only if you know the exact calldata.

Choose **Permit Rescue** if the token supports Permit and the site can prepare the signature. Not every token supports this.

Choose **DeBank Withdraw** if assets are visible through DeBank and the site marks them as supported for withdrawal. If an asset is missing or unsupported, do not try to send blindly.

If you do not know what to choose, start small: find the network and one asset, check the recipient, create a donor, run simulation, and do not send until the result is clear.

## Low-Risk Order of Actions

1. Open `/workspace`.
2. Select the correct network at the top of the site.
3. Create a new donor wallet and save the backup.
4. Copy the donor address, but do not fund it with a large amount.
5. Choose a rescue action.
6. Add only the wallets and tokens required for that action.
7. Enter the recipient address. This should be your new safe address.
8. Click Build Transaction.
9. Run Simulation.
10. If simulation succeeds, carefully review the summary.
11. On Fund Donor, fund the donor only with the shown amount plus a small gas buffer.
12. Go to Send only if the network, recipient, amount, and simulation result look expected.
13. Save the tx hash and check the recipient balance in your wallet or explorer.

## When You Must Not Continue

Do not send the transaction if:

- the wrong network is selected;
- you do not recognize the recipient address;
- the site shows an unexpected address;
- simulation failed and you do not understand why;
- the amount is larger than expected;
- RPC shows a different chainId;
- the UI asks for an advanced override and you do not understand why;
- you accidentally pasted the donor private key into a rescue-wallet field.

In these cases, go back, check the data, and rebuild the scenario.

## After Rescue

After a successful send:

- save the tx hash;
- check that assets arrived at the recipient;
- withdraw leftovers from the donor through Donor Asset Recovery;
- stop using the compromised wallet;
- clear browser data if you used someone else's device.

AntiDrain helps you prepare and check actions, but you still decide whether to send.
