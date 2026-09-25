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
| Transaction sent, but no block holds it | [Transaction Is Pending](#transaction-is-pending) |
| Confirmed, but not permanent | [Confirmed but Not Permanent](#confirmed-but-not-permanent) |
| Balance unchanged | [Balance Did Not Update](#balance-did-not-update) |
| Error after broadcast | [Sending Failed After Broadcast](#sending-failed-after-broadcast) |
| Saved data disappeared | [Some Saved Data Was Removed](#some-saved-data-was-removed) |
| A panel came back empty | [A Draft May Not Have Been Saved](#a-draft-may-not-have-been-saved) |
| Page stayed in the same language | [The Language Did Not Switch](#the-language-did-not-switch) |

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

Two cases after a successful send are not on the list above and no amount of re-entering data will fix them: **Finish — Manage Donor Assets** is greyed out when the network has reorganised your transaction away, and when the network has included the transaction again and something else came of it. **Erase donor wallet** is different again — it is not greyed out at all, but confirming it can refuse, and **Generate Wallet** and **Import Wallet** refuse the same way once a rescue has been sent from this tab. All of them are [Confirmed but Not Permanent](#confirmed-but-not-permanent).

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
- Check chain ID
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

**First, read the first line of the card.** If it says *The check did not finish, so nothing is known about this transaction yet.* — the simulation did not fail, it never ran, and nothing in this section applies to it. Press **Check Again**, and read [When the Check Did Not Finish](/en/simulation-funding-sending#when-the-check-did-not-finish). Everything below is about the other card, the one that reads *This transaction will likely fail on-chain.*

::: danger Do Not Send

Do not send blindly.

Check:

- Correct network
- Available balance
- Allowance or permit
- Nonce
- Recipient
- Contract state

If the error is unclear, do not continue to TX Sender with **Continue Anyway** at the bottom of the card. Try a simpler action or check one asset separately.

:::

In simple mode the failure line tells you what happened and what to try next. It does not show the words the network sent back. Switch to Advanced mode to read those, together with the revert data — that is where an unclear error becomes readable. The notes under the result follow the same rule: simple mode says what was and was not checked, Advanced mode names the methods it was checked with.

## Transaction Plan Expired

The transaction plan is valid only for a limited time. This prevents old gas and fee calculations from being used too late.

What to do:

1. return to TX Simulator;
2. run simulation again;
3. approve the new plan;
4. check Fund Donor again;
5. continue to TX Sender.

These same steps are the fix whenever the site refuses a plan and tells you to build it again, and an expired plan is only one of the reasons it can give. For what happened to your funds, read the message itself rather than guessing. Where it says nothing was signed and nothing was sent, building the plan again costs you nothing but the time. Where it says *this step* was not signed or not sent, a plan can have more than one step and an earlier one may already have gone through — the transaction log above the message is what lists them, and rebuilding is still the way forward.

There is one exception. When the message says the plan's Permit signatures are expiring, running the simulation again does not help: a new plan cannot outlast the signatures it is built from. Go back to TX Builder, sign again in the Permit Rescue panel and build a new plan — on Fund Donor the **Return to TX Builder and sign again** button takes you there. [Permit Rescue](/en/rescue-actions#permit-rescue) describes where each of these messages appears.

## Transaction Is Pending

The transaction went out to the network and no block holds it yet. Check the tx hash in an [explorer](/en/glossary#explorer) — it shows you the same thing the site is looking at.

If the rescue was sent from this tab, you do not have to work out what to do from the explorer: the line under the send buttons has already run the check and says which case this is. One of its answers comes with a button, because the transaction can be replaced instead of waited out — read [Sent, Not in a Block Yet, and Replaceable](/en/simulation-funding-sending#sent-not-in-a-block-yet-and-replaceable).

In either case, two things hold:

- **Press Check again first.** It costs nothing, it asks the network afresh, and a transaction that has simply arrived ends the whole question on its own.
- **Do not send the rescue a second time.** A second transaction from the donor is signed for the *next* place in the queue — its [nonce](/en/glossary#nonce) — so it waits behind the first rather than replacing it, and you pay for both. A replacement has to take the same place in the queue, and **Replace with a higher gas price** is the control that builds one.

## Confirmed but Not Permanent

The transaction is confirmed, but a line under the send buttons says it is not permanent yet, or that it is in a block the network still stands behind but the page could not see how many blocks have been built on top of it, or that no block holds the transaction yet, or that no block holds it yet and the place in the queue it was signed for is still free for it — so it can be replaced, or that the check could not be completed, or that the page could not read back its own list of what this rescue has sent, or that the check was overtaken because the rescue itself moved while it ran, or that it was sent on a network this page is no longer set to, or that the source for that network would not say which network it is, or that the network included the transaction again and something else came of it, or that the network included it again and the site cannot compare the result, or that the network reorganised. This is not a failure of the site and it is not something you have entered wrongly: a network can still reshuffle its most recent blocks, so the site checks whether your transaction's block is still in the chain before it treats the rescue as final.

Which of the states you are in decides what to do, and they are not the same thing at all: one is normal; one says the transaction is in a block the network still stands behind and that only the count of blocks on top of it could not be read, which asks for the same wait the normal one does; two say the transaction is not in a block yet and differ only in whether there is anything to do about it — the second comes with a button that replaces the waiting transaction, the first does not; two say nothing about your rescue and differ in what could not answer — the network in one, this browser's own record of what the rescue has sent in the other, which is why a different RPC is worth trying for the first and pointless for the second; one says the answer went out of date while it was being worked out, and asks only that you run the check again; one is only about which network the page is set to, and its neighbour is about the source for that network refusing to say which network it is, where switching networks is exactly what does not help; one means the transaction is on the blockchain but with a different result from the one the page showed you, where the first thing to do is look at the balance of the wallet you were rescuing; one means the transaction is on the blockchain and the page simply has nothing to compare its result against, which takes nothing away from you and asks for the same balance check; and one means the rescue has to be sent again. Each outcome, the exact sentence it puts on screen and the steps for it are in [After Sending: Is the Transaction Permanent?](/en/simulation-funding-sending#after-sending-is-the-transaction-permanent).

Three symptoms lead here rather than to [Button Is Disabled](#button-is-disabled):

- **Erase donor wallet** opens its dialog, you confirm, and nothing is erased. See [Why an Irreversible Step Can Be Withheld](/en/donor-wallet#why-an-irreversible-step-can-be-withheld).
- **Finish — Manage Donor Assets** is greyed out after a successful send. Exactly two answers do that, and both of them say the rescue you were shown did not stand: the network reorganised your transaction out of the blockchain, or it included the transaction again and something else came of it. Under every other answer **Finish — Manage Donor Assets** works — while the transaction is merely not permanent yet, and equally while the site could not establish that it is.
- **Generate Wallet** or **Import Wallet** opens a dialog about replacing the donor, you confirm, and nothing is replaced. It is the same rule for the same reason — see [Why an Irreversible Step Can Be Withheld](/en/donor-wallet#why-an-irreversible-step-can-be-withheld).

All three dialogs quote the same sentence the line does, so read which one it is before you settle in to wait. If it says the transaction is not in a block yet and the place in the queue it was signed for is still free for it, there is a button — not in the dialog, but in the line under the send controls: [Sent, Not in a Block Yet, and Replaceable](/en/simulation-funding-sending#sent-not-in-a-block-yet-and-replaceable).

## Balance Did Not Update

Click refresh, check RPC, and check the explorer.

Some RPC providers update data with a delay.

## Sending Failed After Broadcast

If the site shows an error after sending but a tx hash already exists, check that hash in an explorer first.

Two things are possible:

- The transaction was sent and is waiting for confirmation
- The transaction reverted or was rejected by the network

Do not send again until you understand what happened to the first tx hash.

## Some Saved Data Was Removed

The workspace shows a box titled **Some Saved Data Was Removed**, with a list of what it was. Each
line in that list names what to do about it; the same three remedies are spelled out below.

This is the site telling you something it had saved could not be read back, so it deleted it. It is
not an error you can retry, and it is not about the blockchain: your wallets, your funds and any
transaction already sent are untouched. Only what this browser had written down is gone.

What to do depends on the line in the list:

- **the donor wallet saved in this browser** — generate or import a donor again on the first step.
  If you exported the backup file, the old donor is still reachable from it and whatever gas is left
  on that address is still there.
- **the saved progress of this rescue** — the step that needs a value will ask for it again. Paste
  the compromised wallet's key once more when the panel asks.
- **the network you had selected** — pick the network again in the header.

The site removes a saved value only after it has established that the value cannot be read at all —
never because a read merely failed. That distinction is the point of the other notice, **Saved State
Not Opened**: it deletes nothing and asks you to try again.

## A Draft May Not Have Been Saved

The workspace shows a box titled **A Draft May Not Have Been Saved**.

This one is about a save that was still running. Everything you type into a panel is encrypted before
it is written down, and that takes a moment; the site gives each save a minute and then stops waiting
for it. The minute runs out on its own, whatever you were doing — the panel does not have to have
been closed, and a tab left in the background reaches the same deadline with the panel still on
screen. Nothing was deleted — the value never got as far as being saved at all.

What to do: look over the panel you were last typing in. In most cases what you entered is still
there, because the panel had kept it in memory and saved it again. If a field is empty, type it in
again — there is nothing to recover and nothing to retry.

This is not the same as [Some Saved Data Was Removed](#some-saved-data-was-removed), which is about
something the site had saved and then could not read back, and not the same as **Pasted Keys Are Not
Being Saved**, which is about a browser that cannot save pasted keys at all. This notice says neither:
saving works here, and a draft may have missed its turn. It goes away once that draft is changed
again and the change saves — typing into it again is what clears it, and reopening the panel to
look at what is already there does not. The notice does not say which draft it was, and more than
one can be waiting behind it, so it stays until each of them has been saved that way.

## The Language Did Not Switch

You press the **EN/RU** language toggle in the header and the page stays in the language it was
already in. A line appears under the header: *The other language could not be downloaded, so the
page stayed in this one. Check your connection and press again.*

The workspace text is downloaded separately for each language, so in the workspace switching needs
a working internet connection. When that download does not succeed, the site leaves the page in
the language it can still display rather than clearing a rescue in progress off the screen. This
is not something you entered wrongly, and it is not about the blockchain: your donor wallet, your
saved progress and any transaction already sent are untouched, and every button and field keeps
working in the language you are in.

What to do:

- Press the toggle again — each press tries the download again.
- Check your internet connection — the same checks as in [RPC Does Not Work](#rpc-does-not-work).
- Carry on in the language you have; nothing in the rescue depends on which one it is.

One case looks worse than it is. If you use the browser's Back button to go to the other language's
copy of a page, a failed download can leave the browser's address bar saying one language while the
page shows the other — `/ru/workspace` while you are still reading English. It is the address bar
that is wrong, not the page, and the next switch that does go through makes them match again.
**Do not reload the page to line them up.** While that language still will not download, a reload
opens the workspace in the language the address bar names, fails to download it a second time, and
puts an error screen where your rescue was.

## Next

- [FAQ](/en/faq) — if the question is not about an error.
- [Glossary](/en/glossary) — if a term in the error message is unclear.
- [Core Safety Rules](/en/safety) — what to check so it does not happen again.
