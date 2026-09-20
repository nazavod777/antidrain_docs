---
title: Donor Wallet
description: How to create, import, and manage the donor wallet for paying gas and sending rescue transactions.
---

# Donor Wallet

The donor wallet sends transactions and pays gas.

It allows the rescue flow to be sent even when the original or compromised wallet should not pay gas directly.

## Why the Donor Is Needed

The donor:

- Pays gas
- Sends the prepared rescue flow
- Can execute EIP-7702 flows
- Can send permit rescue flows
- Can withdraw its own leftover assets through Donor Asset Withdrawal

## How to Create a Donor

1. Open `https://antidrain.me/workspace`.
2. On the first step, press **Generate Wallet**.
3. Press **Export Backup** and save the file.
4. Copy the donor address.
5. Fund it only when the site shows the required amount.

If this browser is already holding a donor wallet, **Generate Wallet** does not add a second one — it writes the new wallet over the stored one. A dialog opens first, and if a rescue has already been sent from this tab the site can hold that dialog back. Read [How to Replace the Donor Wallet](#how-to-replace-the-donor-wallet) before you press it.

## How to Import a Donor

If you already have a donor:

1. Press **Import Wallet**.
2. Paste the private key or another supported format.
3. Check the address.
4. Press **Export Backup** if this donor is new to you.

**Import Wallet** replaces in exactly the same way: importing into a browser that already holds a donor destroys the one that was there. The same dialog opens — see [How to Replace the Donor Wallet](#how-to-replace-the-donor-wallet).

## How to Replace the Donor Wallet

This browser holds one donor wallet at a time. **Generate Wallet** and **Import Wallet** never add a second one: the new wallet is written over the stored one, and the previous recovery phrase and private key stop existing here. Writing over a key destroys it exactly as [erasing](#how-to-erase-the-donor-wallet) it does, so both buttons are treated as the irreversible step they are rather than as a fresh start.

Your first donor is not a replacement, and nothing asks about it: on a browser holding nothing, the wallet you generate or import is installed straight away, with no dialog and no check. The dialog opens when a donor **may** be there — either one is stored, or the site could not read its own storage to find out and will not assume the browser is empty. So meeting it on a browser you believe holds no donor does not mean something is broken: it means the site could not confirm the browser is empty, and it would rather ask than overwrite a key it cannot see. There is one case where nothing is asked even though something was stored: a saved wallet the site found and could not read. It says so on the donor step and removes the record it cannot open, so by the time you press **Generate Wallet** or **Import Wallet** there is nothing left to write over — and asking first would only stand between you and the backup file that fixes it. Export the backup of a donor you might still want before you replace it.

When it opens, the dialog is titled **Replace the donor wallet?** and has two buttons: **Keep the current wallet** and **Replace the donor wallet**. Nothing is overwritten until you choose **Replace the donor wallet**.

It says what you are agreeing to: *This browser is already holding a donor wallet. Continuing writes the new one over it, so its recovery phrase and private key are gone from here — only your exported backup file can bring them back.*

Then it lists three consequences. The first and the last are the ones the erase dialog also shows: whatever is left at the old donor address stays stranded there, and the attacker can delegate the compromised wallet again. The one between them belongs to replacing: *The rescue starts over at step one: the action you picked and the step you had reached are cleared along with the old wallet, so a rescue already under way has to be set up again. Transactions already sent stay sent, and nothing on the blockchain changes.*

Unlike the erase, replacing does not reload the page — it does not need to. The action you picked and the progress you had are cleared on the spot, the later steps lock again, and the site forgets that a backup was ever exported, so **Export Backup** applies to the new wallet from the start exactly as it did to the first one.

::: warning The Old Donor Keeps Whatever Is Sitting on It

Replacing does not empty the old donor address. Gas and tokens left there stay there, and without that donor's backup file nothing in this browser can reach them again. Nothing checks whether you ever exported one, either — the dialog will overwrite a donor you have no backup of. Withdraw the leftovers first through **Donor Asset Withdrawal**, the panel on the donor step right below these buttons — see [how to use it](/en/asset-manager).

:::

Like the erase, this dialog can be refused. If a rescue transaction was sent in this tab, the site checks that the transaction is permanent before it lets the stored donor be overwritten, and the notice it adds begins: *The donor wallet cannot be replaced until the transaction is permanent — the one this browser is already holding is the only key that could run the rescue again if the network undoes it, and generating or importing another one writes over it.* The rule behind that is the same one for both buttons and for the erase: [Why an Irreversible Step Can Be Withheld](#why-an-irreversible-step-can-be-withheld).

## Backup

Backup lets you restore the donor later.

::: warning Check Your Downloads Folder

The site can start the backup download, but the browser does not always prove that the file was actually saved. Check your Downloads folder or selected folder manually.

:::

## Show / Hide Private Key {#show--hide-private-key}

![The Donor Wallet panel with a created wallet: the mnemonic and private key fields each have an eye button to reveal the value and a copy button beside it, and the address field has a copy button. Below them sit Generate Wallet, Import Wallet and Export Backup, and below those, in a row of its own, Erase donor wallet. The values are blurred in this screenshot on purpose.](/screenshots/en/02-donor-created.webp)

The **Show private key** button reveals the value; the same button then reads **Hide private key**. Use it only when there is no screen share, screen recording, or other person nearby.

After a page reload, the private key should be hidden again.

## How to Erase the Donor Wallet

When the rescue is over, you can remove the donor wallet from this browser. The button reads **Erase donor wallet** and sits in two places. On the donor step it has a row of its own, below **Generate Wallet**, **Import Wallet** and **Export Backup**. The second place is the send controls, on the TX Sender step.

Each place has its own single reason for the button to be unavailable, and the two reasons are not the same:

- **On the donor step** the button is live as soon as a donor wallet exists — before you choose an action, before any transaction is built or sent. It is disabled only while this browser is holding no donor wallet: *Nothing to erase yet: this browser is holding no donor wallet. Generate or import one first.*
- **In the send controls** the button is disabled until the rescue transaction is confirmed: *Available once the transaction is confirmed. The donor wallet signs and pays for the rescue, so it has to stay until then.*

Pressing it never erases anything straight away. A dialog opens first, titled **Erase the donor wallet?**, with two buttons: **Keep the donor wallet** and **Erase and reload**. Nothing is deleted until you choose **Erase and reload** — and if you sent a rescue transaction in this tab, not even then until the site has proved that transaction is permanent. See [Why an Irreversible Step Can Be Withheld](#why-an-irreversible-step-can-be-withheld) below.

The dialog lists four consequences. The first and the last are the same wherever you pressed the button; the second depends on which of the two places you pressed it from, and the third depends on what this browser does with pasted keys. Everything else about the dialog is shared. Read the dialog you actually get before you accept it.

Erasing deletes the donor wallet from this browser: its recovery phrase, its private key and its saved copy.

::: warning Withdraw the Leftovers First

Whatever is still sitting at the donor address stays there, and without the backup file nothing in this browser can reach it again. Withdraw the leftover gas and tokens through **Donor Asset Withdrawal**, the panel on the donor step, before you erase — see [how to use it](/en/asset-manager).

:::

::: warning Check What the Dialog Says About Your Pasted Keys

The third point in the dialog is about the compromised wallet keys you pasted, and which of two sentences it shows depends on this browser. One says the pasted keys stay in this browser for the next transaction. The other says: *This browser is not saving what you paste — the compromised wallet keys exist only in this tab, so the reload takes them with it. Have them to hand before you confirm.* If you see the second one, have those keys in front of you before you press **Erase and reload** — the reload takes them, and nothing on this site can give them back.

:::

::: warning The Attacker Can Delegate Again

The attacker can delegate the compromised wallet again, and a follow-up rescue needs a new donor with gas on it.

:::

::: tip What the Reload Takes with It

**From the send controls:** the page reloads, this report closes and the flow starts over at step one, so copy the transaction hash above the button before you confirm if you still need it.

**From the donor step:** there is no report and no hash there. The action you picked and the step you had reached are cleared along with the donor, so a rescue already under way has to be set up again from step one.

Either way, transactions already sent stay sent, nothing on the blockchain changes, and your rescued funds are unaffected.

:::

### If the Erase Does Not Finish

Erasing can also fail, and a message below the button says which of two things happened. They are opposites, so read which one it is:

- **Nothing was erased.** This browser is blocking storage for the site, so the donor wallet is still here — exactly where it was, with nothing lost. Close the tab to drop it from memory, then clear this site's data in your browser settings.
- **The erase did not finish.** The browser did not confirm that every entry was deleted, so some of the donor wallet may still be here, and some of the rescue progress may already be gone. The page is left as it is on purpose. Close the tab to drop the wallet from memory, then clear this site's data in your browser settings.

::: danger A Partial Erase Means the Key May Still Be on This Device

If the message says the erase did not finish, do not walk away treating the donor private key as gone. Part of the donor wallet can still be in this browser's storage even if part of the rescue progress is already lost. Clear this site's data in your browser settings, and until you have, keep treating that donor address as one this device can still reach.

:::

## Why an Irreversible Step Can Be Withheld

Three things can leave the donor's private key unrecoverable, and one check guards all three: [replacing](#how-to-replace-the-donor-wallet) the donor wallet, [erasing](#how-to-erase-the-donor-wallet) it from either of the two places that button sits, and [erasing the whole rescue session](/en/simulation-funding-sending#erasing-the-keys-from-this-browser) from the send step. None of them always goes through. If a rescue transaction was sent in this tab, the site asks the network — right then, not when the dialog opened — whether that transaction is still part of the blockchain. Only a clear yes lets the step through.

Each dialog says why. The erase dialog: *The donor wallet cannot be erased until the transaction is permanent — it is the only key that could run the rescue again if the network undoes it.* The replacement dialog: *The donor wallet cannot be replaced until the transaction is permanent — the one this browser is already holding is the only key that could run the rescue again if the network undoes it, and generating or importing another one writes over it.*

That is the whole reason, and it does not depend on which of them you pressed. Losing the donor's private key is a one-way door: the donor is the wallet that pays for and signs the rescue, so if the network reshuffles your transaction away after that key is gone, nothing in this browser can send the rescue again, and the gas sitting on that address is out of reach as well. Only the backup file can bring that donor back, and only if you exported one. Writing a new wallet over the old one destroys it just as finally as deleting it does, which is why the question the site asks is not whether a button deletes the donor but whether the donor's key can stop being recoverable after it.

While the check runs, the confirm button stops reading **Erase and reload** or **Replace the donor wallet** and reads **Checking that the transaction is permanent…** instead, and cannot be pressed. Then one of two things happens:

- **The transaction is permanent.** The step goes ahead: the erase erases and the page reloads, the replacement writes the new donor over the old one.
- **It is not permanent, or the site could not tell.** Nothing is erased and nothing is overwritten. The dialog stays open and adds a notice: the sentence above, followed by which case it was — not permanent yet; sent but not in a block yet; sent and not in a block yet with the place in the queue still free for it; sent on a network this page is no longer set to; the network did not answer; the page could not read back its own list of what this rescue has sent; the check was overtaken because the rescue itself moved while it ran; or the network reorganised and the transaction is gone. Every one of them, and what to do about each, is in [After Sending: Is the Transaction Permanent?](/en/simulation-funding-sending#after-sending-is-the-transaction-permanent).

The confirm button is not greyed out while that notice is on screen. It stays pressable on purpose: the notice is there to be read, and the decision is yours. Nothing is lost while the step is withheld. Close the dialog with whichever keep button it has — **Keep the donor wallet**, **Keep the current wallet** or **Keep them for now** — or wait a moment and press confirm again; every press runs the check again.

Waiting is not always all that is left, so read which case the notice names. Two of them have a control behind them, and neither control is in the dialog. If it says the transaction went to a network this page is no longer set to, the network selector is the fix. If it says the transaction is not in a block yet **and that the place in the queue it was signed for is still free for it**, the send step can replace that transaction instead of waiting it out — so close the dialog, go back to the line under the send controls and read [Sent, Not in a Block Yet, and Replaceable](/en/simulation-funding-sending#sent-not-in-a-block-yet-and-replaceable). One case is not a waiting problem at all: where the network reorganised and the transaction is gone, the rescue has to be sent again, and the send step is where you do that. For every other case the notice can name, pressing confirm again after a moment is the whole of what this dialog can do.

::: warning "Could Not Tell" Is Not "Yes"

An unanswered check withholds the step exactly as a refuted one does, and that is on purpose: a check that could not be completed says nothing about your rescue, so it must not be allowed to authorise something irreversible. If the notice says the network did not answer and it keeps saying it, select a different RPC and press the button again. Read the notice first, though, because the RPC is the remedy for that one sentence and not for the others. Where it says the transaction was sent on a network this page is no longer set to, the RPC cannot fix it and the network selector can. Where it says the page could not read back its own list of what this rescue has sent, no endpoint was asked in the first place, so neither selector changes anything — whatever is in the way there is on this side rather than on the network, and [The Page Could Not Read Back What This Rescue Has Sent](/en/simulation-funding-sending#the-page-could-not-read-back-what-this-rescue-has-sent) is what to do about it. On some networks it can go on refusing for as long as you keep asking — [When the Check Keeps Refusing](/en/simulation-funding-sending#when-the-check-keeps-refusing) says which ones, and what to do about a pasted private key you wanted off a computer that is not yours.

:::

If nothing was sent from this tab, there is nothing for the check to look at and the step goes ahead as it always did — a donor you generated and then decided not to use is erased, or replaced, immediately. There is one exception: a browser that will not let the site read its own session data cannot show the check that nothing was sent either, so it answers that it could not tell — with the notice about the page not being able to read back its own list of what this rescue has sent. That is the same browser condition as the erase failures above, and [The Page Could Not Read Back What This Rescue Has Sent](/en/simulation-funding-sending#the-page-could-not-read-back-what-this-rescue-has-sent) is what to do about it.

The reverse also holds longer than people expect: the check keeps applying on the donor step after you have pressed **Finish — Manage Donor Assets** and moved on, because it is still the same rescue in the same tab.

## When to Fund the Donor

::: tip Wait for Fund Donor Calculation

You do not need to fund the donor with a large amount in advance. Wait for the Fund Donor step. It shows the calculated required amount.

:::

## Next

- [Workspace Flow](/en/workspace-flow) — the steps the workspace is made of.
- [Donor Asset Withdrawal](/en/asset-manager) — how to withdraw leftovers after a rescue.
- [Service Fees](/en/service-fees) — what makes up the final amount.
