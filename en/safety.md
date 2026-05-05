# Core Safety Rules

AntiDrain runs in your browser. This is convenient, but you must be careful.

The goal is to avoid turning one wallet problem into a second loss caused by a rushed mistake. If something looks strange, stop.

## Use a Clean Environment

It is better to open the site in a separate browser profile or a browser without unnecessary extensions.

Do not work through:

- suspicious extensions;
- someone else's computer;
- public Wi-Fi unless necessary;
- screen sharing where private keys or mnemonic words are visible;
- unknown sites asking for signatures in other tabs.

## Never Paste Extra Keys

Add only the private keys needed for the selected rescue action.

Do not paste:

- a main wallet seed phrase unless absolutely needed;
- private keys for wallets with large balances;
- the donor private key into fields meant for rescue wallets.

If the site asks for a private key, first check which role that field means. The donor and the rescue wallet are different roles.

## Use a Separate Donor

It is safer to use a separate donor wallet created only for rescue transactions.

The donor should hold only the amount needed for gas and the current flow.

Do not send all your funds to the donor. The Fund Donor step shows the calculation. Fund roughly that amount plus a small buffer for gas changes.

## Check the Network

Before every send, make sure the selected network is correct.

For example, if the assets are on Ethereum, do not send the flow on BNB Chain or another network.

Also check RPC. If RPC returns a different chainId or does not respond, the site may block actions. That is expected: fixing RPC is safer than sending blindly.

## Check the Recipient

Recipient is the address that should receive the assets.

If the recipient is wrong, assets can go to the wrong wallet.

It is best to create a new safe recipient wallet first and send rescued assets there. Do not send assets back to a compromised address.

## Simulation Is Not a Guarantee

A successful simulation reduces risk, but it is not a full guarantee. Network state can change between simulation and sending.

If simulation failed, a normal user should not use advanced override. Override is only for someone who understands the failure reason and accepts the gas risk.

## Do Not Use the Site Blindly

If you see an unexpected error, strange address, unexpected amount, or wrong network/chainId, stop.

It is better to spend time checking than to send the wrong transaction.

## Check the Final Send Screen

Before Send, review:

- action;
- network;
- donor address;
- recipient;
- tokens or NFTs;
- gas/funding summary;
- simulation result;
- service fee, if present;
- transaction plan expiry.

If you changed network, recipient, amount, keys, or action after simulation, rebuild and simulate again.

## After Finishing

After a successful rescue:

- save the transaction hash;
- check the recipient balance;
- withdraw leftover funds from the donor;
- clear browser data if you used someone else's device;
- do not keep using a compromised private key.
