---
title: Simulation, Funding, and Sending
description: Final three steps to validate, fund, and broadcast your prepared rescue transaction.
---

# Simulation, Funding, and Sending

These steps happen after the transaction is built.

## TX Simulator {#simulation}

Simulation checks whether the transaction can execute. The button that starts it reads **Run Simulation**.

There is nothing to set up before it runs, and no fields to fill in. The check goes through the same [RPC](/en/glossary#rpc) connection the rest of the site is already using, so it needs no account with any other service and no settings of its own.

It can help detect:

- Wrong address
- Wrong network
- Missing balance
- Contract revert
- Gas issue
- Unsupported flow

## If Simulation Succeeds

If simulation succeeds:

1. Check the summary.
2. Make sure the action looks expected.
3. Press **Proceed to Fund Donor**.

A rescue is sometimes sent as two transactions rather than one. The site calls those two the *steps* of the rescue, and a successful result does not always mean it measured both. When it did not, it says so underneath the result: *Both steps were not checked together. The first was estimated on its own; the second was calculated rather than measured, so the real cost can differ — and nothing measures it before sending either.*

That is a limit on the number, not a problem with the transaction. The cost of the second step is worked out rather than observed, so the real one can come out higher or lower, and no later step goes back and measures it — it stays an estimate right up to sending. Fund with the buffer the next step already includes, and do not read the total as an exact price.

## If Simulation Fails

**Two different things end up here, and they are not the same news.** One is an answer: the check ran, it ran your transaction as a trial, and the trial did not succeed. The other is the absence of an answer: the check never finished — the network did not reply, what came back could not be read, or the request never got out — so nothing was established about your transaction at all, in either direction.

The site shows a different card for each, because what to do next is different. **The card's first line says which one you have**, and the colour of the card says it a second time:

- **The check ran and the transaction failed.** The first line reads *This transaction will likely fail on-chain.* The card behind it is tinted amber, and that line is amber too. Yours is [When the Check Says the Transaction Will Fail](#when-the-check-says-the-transaction-will-fail).
- **The check did not finish.** The first line reads *The check did not finish, so nothing is known about this transaction yet.* The card behind it is plain grey, with no amber in it at all, and that line is in ordinary text rather than amber. Yours is [When the Check Did Not Finish](#when-the-check-did-not-finish).

Go by the sentence if the two look the same colour to you. A high-contrast mode turned on in your system replaces the site's palette with its own, and the amber goes with it — then the wording is the whole of the difference. Where there is colour, read it off the block the sentence sits in rather than off the buttons: with the header toggle on **Advanced**, both cards grow the same amber tick box and amber button underneath, because going on is the cautious act either way.

### When the Check Did Not Finish

The check did not run to an answer. The site could not reach the network it checks through, or what came back was not something it could use, or the request never went out — or the plan you built produced no transaction to check in the first place. Whichever it was, nothing was established about your transaction: not that it would work, and not that it would fail.

**The card's own sentence says which of those it was, and that is what decides your next move.** There are four of them, and they do not ask for the same thing:

- *The network did not answer the check.* Nothing came back at all. The connection is the thing to work on, and the rest of this section is about doing that.
- *The check did not come back with a usable answer.* Something did come back, and it could not be used. A different connection does not mend this one, and what is wrong may well be in the transaction — so the sentence sends you to the **TX Builder** to look it over **and** to check again afterwards. Advanced mode shows what actually came back.
- *There was no transaction to check: this plan produced none.* This is the one case where checking again cannot help, because there was never anything to run. Go back to the **TX Builder** and look at what is selected.
- *The check could not be completed.* Nothing beyond that is known. Press **Check Again**, and advanced mode shows the technical details.

**Press Check Again first**, unless the sentence says there was no transaction to check. The button sits inside the simulator's card, under its text. It costs nothing, sends nothing to the blockchain, spends no gas, and runs exactly the check that did not finish. A check that did not get through once very often does on the next try, so this is the first move rather than the last resort. While it runs, the card disappears and the **Run Simulation** button above shows that a check is in progress; the answer comes back in the same place. (The send step, described much further down this page, has a **Check again** of its own. That is a different button asking a different question — about a transaction that has already gone out.)

If there is no **Check Again** button in the card at all, it is because **Run Simulation** above is blocked for some reason — the retry is the same check, so it is never offered where that button cannot run. Read what that button says is missing, put it right, and run the check from there.

If pressing it keeps giving you the same card with the same sentence about the network, what is in the way is between you and the network rather than in your transaction. There is one thing to try: **set a different [RPC](/en/glossary#rpc) address for this network** in the network selector at the top of the page. A check is only as good as the connection it goes through, and a different address is a different connection.

::: tip An Open Question, Not a Verdict

This card is not the other one worded gently. Nobody ran your transaction, so nothing here says it would fail — and, just as much, nothing here says it would work. Read it as a question still open rather than as bad news: the rescue you are in the middle of is exactly where it was, and the compromised wallet is still the thing that needs you.

:::

**You can go on without the check, and that takes Advanced mode.** In simple mode there is no button for it; in its place the card says *Going on without a finished check is blocked by default. Switch to Advanced mode if you want to send this transaction unchecked.* Set the header toggle to **Advanced** and the card gains a **Gas Limit** field, a tick box, and a button reading **Continue Without the Check**. The **Gas Limit** arrives filled in with a suggested figure, so there is nothing you have to work out.

Read the tick box before you tick it: *I understand nobody checked this transaction, and I am going on without knowing whether it will work.* That is the whole of what you are agreeing to — not that the transaction is bad, only that nobody established anything either way. Until it is ticked, **Continue Without the Check** stays disabled and says why: *Confirm you are going on without a finished check.*

If the transaction then does fail on-chain, what it costs you is the gas it spent getting there, and the time. That is the case for pressing **Check Again** a few times and trying another RPC first: the check is the cheap place to find a problem, and sending is the expensive one. It is also the case for the button existing at all — when your own connection will not answer, there is no second one to switch to, and a rescue abandoned half-way costs more than a failed transaction does.

### When the Check Says the Transaction Will Fail

Here the check finished, and the answer is the bad one. Your transaction really was run as a trial, and the trial did not succeed: the contract reverted it, or the trial run came back failed. So *This transaction will likely fail on-chain.* is a measurement rather than a guess, and that is what earns the warning.

**There is no Check Again button on this card, and that is deliberate.** Running the same check a second time asks the same question of the same network and gets the same answer back. What changes the answer is changing something about the transaction, and that is what the list below is for.

::: danger Do Not Send

Do not send blindly.

Check:

- Selected network
- RPC
- Donor address
- Recipient address
- Balances
- Private keys entered
- Whether the selected action is supported

The button at the bottom of this card — **Continue Anyway** — is only for someone who understands the error.

:::

**What you change, you change back at the TX Builder step.** It is step 3, and the row of numbered steps across the top of the page takes you there — on a phone that row shows only the numbers, so look for the 3. Put right whatever the list above points at, then simulate again from there.

**Continue Anyway** is built like **Continue Without the Check** on the other card and means something else. It needs the header toggle on **Advanced** in the same way, and it has a tick box of its own — but that tick box says something stronger: *I understand this transaction was not verified by simulation and may fail or spend funds unexpectedly.* What differs is what you accept by pressing it: here, a risk somebody measured; there, the absence of a measurement. This is the one to be slow about.

## Fund Donor

The Fund Donor step shows how much funding is required.

The donor usually needs funds for:

- **Estimated Gas Cost**
- **Native Value to Send**, if the flow sends native currency
- **Native Service Fee**, if there is one
- A buffer for gas price changes

The panel adds these up as **Total to Fund**.

Use the figure this plan shows you. The estimate is worked out for the route this particular rescue takes, so the same wallet and the same token can need a different amount on another run — an amount you remember from last time is not a substitute for the one on screen.

The same panel can also list **Token Service Fee**, and that one is not part of the total. It is a percentage of what the rescue moves, taken out of the rescued assets when the transaction runs rather than out of the donor's balance — and some of its rows carry an extra line saying the fee may not be charged at all. [Service Fees](/en/service-fees#when-a-fee-row-says-it-may-not-apply) explains both.

Read that percentage as the most that transfer will be charged. Less can be collected, for reasons the site cannot see beforehand, and the amounts beside it — including the **Calculated recipient share** — are worked out from the rate rather than measured. They do not include what the token itself charges for a transfer, so what reaches your recipient can be lower than the figure on screen. [Service Fees](/en/service-fees#1-token-rescue-fee) works through why.

## TX Sender {#send}

The TX Sender step broadcasts the transaction.

Before pressing **Send Transaction**, check:

- Network
- Transaction type
- Donor address
- Recipient address
- Expected action
- Gas/funding summary
- Simulation result

After sending, wait for the tx hash and final status.

Once the transaction is confirmed, the send controls also offer **Erase donor wallet**, which retires the donor and reloads the page — see [How to Erase the Donor Wallet](/en/donor-wallet#how-to-erase-the-donor-wallet). Erasing waits for the check described next.

## After Sending: Is the Transaction Permanent?

A confirmed transaction is not automatically a finished rescue. For a short while a network can still reshuffle its most recent blocks, and a transaction whose block gets reshuffled away stops having happened at all.

So the moment the send step finishes — whether it succeeded or failed — the site asks the network whether your transaction's block is still part of the chain. The answer appears in a line below the buttons, and it decides whether four things are allowed: **Finish — Manage Donor Assets**, replacing the donor wallet, erasing it, and erasing the whole rescue session from this browser.

The last three are the ones that leave the donor's private key unrecoverable, so this page speaks of them together — **the three that discard the donor**. Replacing counts because **Generate Wallet** and **Import Wallet** write the new donor over the stored one; see [How to Replace the Donor Wallet](/en/donor-wallet#how-to-replace-the-donor-wallet).

Two things to know about the check itself:

- **It runs on its own, and keeps asking while the answer is to wait.** While the line says the transaction is not yet permanent, the site checks again by itself every so often, quietly — the line changes only when the answer does. It stops once the answer is final, or after about three times the usual wait for that network, at most an hour and a half. Every other answer stays as it is until you press **Check again** beside it, and pressing it also starts the automatic checks over. Changing the network or the RPC starts a fresh check on its own.
- **It only reads.** It does not send anything, costs no gas, and cannot undo the transaction. If your rescue was sent as more than one transaction, every one of them is checked and the line reports the worst answer, which may not be about the last tx hash you saw.

**Which buttons you have depends on two things: how the send step itself ended, and what this line answers.** Usually the send step is what decides and the line only holds something back. So where an answer below says **Finish — Manage Donor Assets** works, or says anything about the success card — the card the send step shows when the transaction went through — it is describing a send that reported success, which is the ordinary way to arrive here.

A send that ended in an **error** gets a line too, because the check reads back everything this rescue has already sent rather than only the last attempt. There you see the error instead of the success card, **Retry — Back to TX Builder** is offered and **Finish — Manage Donor Assets** is not, whatever the line says. The three that discard the donor are held back either way.

That is the ordinary shape of it, and the answers below take it as read. One of them is the error case and nothing else: [Sent, Not in a Block Yet, and Replaceable](#sent-not-in-a-block-yet-and-replaceable) is almost always reached by a send that ended in an error, so there Retry without Finish is the ordinary case rather than a sign that something extra went wrong. The rare exception is described in that section.

Two of them are the exception, and they are the only two: [The Network Reorganised and the Rescue Did Not Happen](#the-network-reorganised-and-the-rescue-did-not-happen) and [The Network Included the Transaction Again and Something Else Came of It](#the-network-included-the-transaction-again-and-something-else-came-of-it). Those two refute what the send step recorded, so there the line does more than hold a button back: after a send that reported success, **Finish — Manage Donor Assets** is blocked and **Retry — Back to TX Builder** is offered anyway. No other answer overrules the send step like that — the rest can only take something away.

One more thing about the buttons themselves: **a button the page has held back tells you why.** Put the mouse on it, tap it, or move to it with the **Tab** key — a held-back button still takes its turn in the tab order, and tapping one opens its reason instead of doing nothing — and the reason appears beside it. **Esc** closes the reason again, and so does moving on to anything else. The answers below quote those reasons without repeating how to reach them.

Every answer the line can give has a section of its own below. Two things are worth knowing before you read them: the good one is silence, and exactly one of them comes with a button that changes something.

### While the Site Is Still Checking

The line reads *Checking that the transaction is permanent…*

Nothing to do. Wait for it to finish. The **Check again** button appears only after the first answer arrives.

### When the Line Goes Empty

Nothing at all: the line goes blank, and the **Check again** button disappears with it.

This is the outcome you want, and it is worth knowing in advance, because the site says nothing when the answer is yes. An empty space under the buttons means the transaction is [permanent](/en/glossary#permanent-transaction), the rescue is as finished as anything on a blockchain gets, and the donor wallet can now be erased.

### Not Yet Permanent — Wait and Check Again

The line reads *The transaction is on the blockchain but not yet permanent. For a while a network can still reshuffle its most recent blocks — anywhere from a few seconds to about half an hour, depending on the network — and until that settles the rescue could be undone. Wait, then check again.*

On a network where the site knows how long this usually takes, the line adds that too — for example *On this network that usually takes about 20 minutes from when the transaction was sent.*

Your transaction is on the blockchain and everything is going the way it should. **Finish — Manage Donor Assets** works normally, so you can go on and withdraw the donor's leftovers. The only things being held back are the three that discard the donor: replacing the donor wallet, erasing it, and erasing the whole rescue session.

You do not have to press anything: while this line is showing, the site checks again by itself, and the line goes empty once the transaction is permanent. **Check again** asks right away if you would rather not wait for the next automatic check. You do not have to sit and watch it either: this state holds back only the three that discard the donor, so if you are not erasing or replacing anything, press **Finish — Manage Donor Assets** and carry on.

::: tip This Is Normal, Not an Error

Every transaction on every network passes through this state. Seeing it does not mean anything went wrong, and there is nothing to fix — the network simply has not put enough blocks on top of yours yet. How long that takes depends on the network — seconds on some, up to about half an hour on others. The figure the line gives is a usual time, not a deadline: a transaction that takes longer has not gone wrong.

:::

### On the Blockchain, but the Page Could Not See How Many Blocks Are on Top

The line reads *This transaction is on the blockchain, in a block the network still stands behind. What this page could not get is how many blocks have been built on top of it, so it cannot yet call the rescue permanent — that is the only thing missing, and nothing here says anything went wrong. Wait a moment and run the check again; nothing is lost while you wait.*

This is the one answer that is partly good news, and the good part is the part that matters most: your transaction is in a block, and that block is still one the network stands behind. The check established that, it did not assume it. What it could not get is the second half of the same question — how many blocks the network has built on top of yours — and that second half is what proof of permanence is made of.

What it means:

- **The transaction is on the blockchain.** That much is settled rather than hoped for. Nothing here says your rescue went wrong, and nothing here is a reason to send it again.
- **The success card stays.** Nothing has refuted it, and a number the page could not read is not news.
- **Finish — Manage Donor Assets works.** You can go on and withdraw the donor's leftovers, exactly as in [Not Yet Permanent — Wait and Check Again](#not-yet-permanent-wait-and-check-again) above.
- **The three that discard the donor are held back.** Replacing the donor wallet, erasing it and erasing the whole rescue session each ask for proof that the rescue can no longer be undone — and that proof is the one thing missing.
- **Retry — Back to TX Builder is not offered**, because nothing has been refuted. Sending the rescue a second time would spend gas on a transaction that is already in a block.

Wait a moment, then press **Check again**. Ordinarily the blocks on top of yours only pile up, so a check that could not read the count this time may read it the next — and the waiting itself costs you nothing. The one thing that takes blocks back is a reorganisation, and it does not leave you reading this sentence: it has answers of its own, starting with [The Network Reorganised and the Rescue Did Not Happen](#the-network-reorganised-and-the-rescue-did-not-happen).

This answer is ordinary rather than rare. A great many networks are read through a source that hands out blocks by height perfectly happily and simply will not answer how deep one of them sits: everything except the last question goes through, which is why the sentence blames nothing. There is nothing here to blame.

If every press gives you this same sentence, the source you are reading that network through is one of those, and it is not going to start answering because you asked again. [When the Check Keeps Refusing](#when-the-check-keeps-refusing) is about exactly that: which networks it happens on, what still works meanwhile, and what to do about a key you pasted on someone else's computer.

### Sent, but Not in a Block Yet

The line reads *The transaction has been sent, and it cannot be confirmed yet that a block holds
it. This says nothing about your rescue, only that the check could not be completed. Wait a minute
and check again; nothing is lost while you wait.*

This is not either of the two states above. In both of those your transaction is already in a block;
here there is no block yet — the network accepted the transaction and has not put it in one. An
ordinary queue at a low gas price looks exactly like this.

Wait a minute and press **Check again**. Do not send the transaction a second time: it will not make
the first one arrive sooner, and the site is already watching for the one you sent.

There is a second version of this sentence, and it is the one to hope for: it adds that the place in
the queue your transaction was signed for is still free for it, and it comes with a button. If that
is what you are reading, go to [Sent, Not in a Block Yet, and
Replaceable](#sent-not-in-a-block-yet-and-replaceable) instead. This shorter sentence is what you get
when a replacement cannot be aimed — the site could not read the queue, could not keep the hash, or
something else has already taken that place in the queue — and then waiting really is the honest
advice.

This sentence usually comes from a send that ended in an error, the same as the one below it — a
broadcast that nothing came back to confirm is what produces both — so **Finish — Manage Donor
Assets** is usually not available here either. It can also reach a send that succeeded, and then it
works. None of the three that discard the donor works in either case, for the same reason as above:
the site treats only a proven block as a yes.

### Sent, Not in a Block Yet, and Replaceable

The line reads *The transaction has been sent and is not in a block yet, and the place in the queue it was signed for is still free for it — so it can still go through on its own. Wait a moment and check again; nothing is lost while you wait. If nothing changes, you can replace it by offering more for gas: the replacement takes that same place in the queue instead of queueing up behind it.*

This answer almost always arrives with the send step reporting an **error**, and it is the one place on
this page where that is the ordinary case rather than the exception. The send failed because nothing
came back to confirm it — the transaction is out there all the same, which is what the line is
telling you. So **Retry — Back to TX Builder** is already offered above, and **Finish — Manage Donor
Assets** is not, exactly as after any failed send.

Beside **Check again** there is then a second button: **Replace with a higher gas price**. It is the
only answer on this page that comes with a button of its own, and what it adds is not a way out that
Retry does not already give you — it goes to the same place. What it adds is the *name*: it says what
rebuilding will do with your money here, which is to outbid the transaction already waiting rather
than to start a second one.

Rarely, the same line appears while the send step reports **success**. Then **Retry — Back to TX
Builder** stays greyed out, **Finish — Manage Donor Assets** works, and **Replace with a higher gas
price** is the only way to rebuild — it goes where Retry would have gone.

Read the two buttons in the order they sit in, because that order is the advice:

1. **Check again** first. It is free, it asks the network afresh, and a transaction that has simply
   arrived ends the whole state on its own. Nothing is lost while you wait.
2. **Replace with a higher gas price** if nothing changes. This one costs gas, so it is worth doing
   only after the check has said the place in the queue is still free.

The button takes you back to the **TX Builder** step — the same place **Retry — Back to TX Builder**
goes — where the gas price is raised. From there you walk the same three steps as the first time:
simulate, check the funding, send. Nothing new goes to the network until that last step, and three
things are true of the plan you build on the way:

- **The replacement is signed for the waiting transaction's own place in the queue**, not for the
  next one. That is what makes it a replacement instead of a second transaction: only one of the two
  can ever take effect, so you are not paying twice and you are not queueing behind your own send.
  The place in the queue is what a [nonce](/en/glossary#nonce) is.
- **In simple mode you do not have to work the new price out.** The builder chooses the replacement
  gas price itself and states it above the build controls, with the figure filled in: *An earlier
  attempt from the donor wallet is still waiting at this place in the queue. To replace it, this
  transaction pays … gwei for gas.* Nothing is asked of you and there is no field to type into. Read
  that number as the most your replacement can pay rather than as what the network is demanding — it
  is the ceiling the transaction carries, and the demand is a separate figure that moves with every
  block. Until the live gas quote arrives there is no price to state, so **Build Transaction** waits
  and says it is waiting for the quote that sets the replacement price; that clears on its own. Then
  it is build, simulate, check the funding, send.
- **If you set the price by hand, the builder is where a too-low one is refused.** With the header
  toggle on **Advanced**, the fee fields name the minimum before you type anything — a line reading
  **Minimum to replace**, with the figure in gwei — and a smaller number is turned down on the spot.
  The field says an earlier attempt is still waiting at this place in the queue and names the figure
  you have to reach, and **Build Transaction** stays disabled, telling you to fix the invalid gas
  settings before building the transaction, until you raise the number. Nothing is built, so nothing
  is signed and nothing reaches the simulator.

The simulator can refuse the plan too, for either of two reasons. The minimum is recomputed from the
network, so it can rise between the moment the plan is built and the moment you press **Proceed to
Fund Donor**. And the builder can only hold you to a minimum it managed to read in the first place —
when the network would not tell it, the builder lets the plan through and the simulator is where it
is caught instead. Either way the refusal names the lowest the site will now accept in gwei. Nothing
has gone to the network at that point either, so it costs you nothing but the time it took to read —
go back to **TX Builder**, raise the price above what it named, and simulate again.

::: warning It Is Offered, Not Promised

The site can offer the replacement; it cannot promise the network will take it. A network can turn one down for reasons no published threshold covers, and then you are back at this same sentence, with this same button and a higher minimum than last time. That is a loop, not a dead end: **Check again** is still free, the transaction you already sent is still valid and may still arrive, and nothing you have already rescued is affected either way.

:::

Two things this state is not:

- **It is not about how long you have been waiting.** The site measures no waiting time anywhere, so
  a transaction sent two seconds ago reaches this sentence exactly as one sent twenty minutes ago
  does. There is no period you are meant to sit through first, and no number the site is keeping from
  you. If you have used **Speed Up** in an ordinary wallet, this is the same move, and those wallets
  offer it straight away for the same reason.
- **It is not the state above.** [Sent, but Not in a Block Yet](#sent-but-not-in-a-block-yet) is the
  shorter sentence with no button, and the difference between them is not how bad things are — it is
  whether there is an action. If your line has no **Replace with a higher gas price** button, the
  replacement cannot be aimed from here, and the section above is yours.

**Finish — Manage Donor Assets** does not work in this state, and here that is because the send
failed rather than because of anything the line says. None of the three that discard the donor works
either, for the reason it does not in the state above: a transaction that is not yet in a block is
not a proven one. If you met this sentence inside a confirmation dialog rather than in the line —
erasing the donor, erasing the session, or replacing the donor — the button is not in the dialog.
Close the dialog with its keep button, and both **Check again** and **Replace with a higher gas
price** are waiting in the line under the send controls.

### Sent on a Different Network

The line reads *The transaction was sent on a different network from the one this page is set to now, so it cannot be checked from here — and waiting will not change that. This says nothing about your rescue, only that the check cannot be made while another network is selected. Switch back to the network you sent it on, then run the check again.*

This one is about the page, not about your transaction. The check asks whichever network the selector at the top of the site is pointing at, and your transaction is on a different one, so there is nothing there to look up. Your rescue has not been refuted — and it has not been confirmed either, because no question was asked.

It is also the one answer where waiting is the thing that will not help. The states above are waiting on the network to do something; here nothing was asked at all, so there is nothing for time to change, and **Check again** with another network selected gives the same answer for as long as you keep pressing it.

There is one fix, and one control does it: set the network selector back to the network you sent on. Switching starts a fresh check by itself, so the line answers again without you pressing anything. If you no longer remember which network that was, set the header toggle to **Advanced**: the same sentence then ends with a technical line giving the [chain ID](/en/glossary#chain-id) the transaction went to and the one this page is set to now. If you met this sentence inside a confirmation dialog rather than in the line — erasing the donor, erasing the session, or replacing the donor — the fix is the same one: close the dialog, switch the selector back, then press the button again.

**Finish — Manage Donor Assets** works in this state. None of the three that discard the donor does: a question nobody asked is never treated as a yes.

### The Source for That Network Would Not Say Which Network It Is

The line reads *We could not confirm that the transaction is permanent, because the source this page reads that network through would not say which network it is — and a source that will not identify itself cannot be trusted to answer about your money. This says nothing about your rescue. Wait a moment and run the check again; nothing is lost while you wait. If it keeps happening, set a different address for that network at the top of the page, then run the check again.*

This is the neighbour of [Sent on a Different Network](#sent-on-a-different-network) above, and what separates them is what you can do about it. Before every check the site asks each address it is about to read through which network it serves — and nothing further down asks again. An address quietly serving a different network answers about a different wallet entirely, and the site would have called the rescue done on the strength of that answer. So an address that will not answer that question is not used at all.

Refusing to answer is a fact about the address, not about your transaction. It is exactly where you left it, and your rescue has not been refuted.

Switching networks does not help here, and that is the whole difference from the section above: selecting this network asks the same silent addresses and gets the same silence. Waiting does not fix it by itself either, though it is worth one try — the address may simply have been unavailable for a moment.

What to do:

1. Press **Check again**. A single refusal here is ordinary.
2. If it keeps happening, set a different [RPC](/en/glossary#rpc) address for that network in the network selector at the top of the page. That is the fix that works here.

**Finish — Manage Donor Assets** works in this state. None of the three that discard the donor does: an answer the site could not get never counts as a yes.

### The Page Could Not Read Back What This Rescue Has Sent

The line reads *We could not confirm that the transaction is permanent, because this page could not read back its own list of what this rescue has already sent. This says nothing about your rescue and nothing about the network — only that the check could not be completed. Wait a moment and run the check again; nothing is lost while you wait. If it keeps happening, whatever is in the way is here rather than on the network — this browser may not be letting the page keep its own data for this session.*

This one is about the page, not about the network, and that is the whole difference between it and [The Check Could Not Be Completed](#the-check-could-not-be-completed) below. The site writes down what this rescue sends, and the check reads that list first, to know which transactions to ask the network about. When the list cannot be read in full there is nothing to ask about, so no question goes out at all — your transaction is exactly where you left it, and what the site has lost sight of is its own note of it, not the transaction.

Several different things end in this sentence: this browser refuses the page the data it keeps for this session, something written down cannot be read back by this version of the site, a send could not be written down in the first place, or one of those turns up again after the checks have finished. None of them is about your rescue, and none of them is about the network.

What to do:

1. Press **Check again**. A one-off refusal like this is common, so it is worth pressing, and nothing is lost while you wait.
2. If every press gives you the same sentence, what is in the way is on this side rather than on the network, and it is not going to clear on its own. Which of the reasons above it is, the sentence does not say. If it is this browser not letting the page keep its own data for this session — a private window with site data blocked does exactly that — an ordinary window or a different browser is the way out of it. If it is one of the others, the browser is storing perfectly well and moving to another one changes nothing.

What will not help either way is a different [RPC](/en/glossary#rpc) or a different network. No endpoint was contacted about this, so neither selector has anything to change.

**Finish — Manage Donor Assets** works in this state. None of the three that discard the donor does, for the same reason as everywhere else on this page: an answer the site could not get is never treated as a yes. If you met this sentence inside a confirmation dialog rather than in the line — erasing the donor, erasing the session, or replacing the donor — it means the same thing there, and every press of confirm asks again.

### The Check Could Not Be Completed

The line reads *We could not confirm that the transaction is permanent — the network did not answer. This says nothing about your rescue, only that the check could not be completed. Check your internet connection and run the check again in a minute; nothing is lost while you wait.*

Read the middle sentence twice. This is a fact about the connection, not about your transaction: your rescue is in exactly the state it was in a moment ago, and nothing about it has been refuted. Some RPC endpoints simply will not answer this particular question.

Try these, in order:

1. press **Check again**;
2. select a different [RPC](/en/glossary#rpc) — switching starts a fresh check by itself, and **Check again** repeats it;
3. look the tx hash up in an [explorer](/en/glossary#explorer), which answers the same question without the site.

The network selector is not on that list, and it used to be. A transaction sent on another network now gets [its own answer](#sent-on-a-different-network) instead of this one, so if you are reading this sentence, the selector is not what went wrong.

This sentence is now only about the network in the other direction as well. It used to be shown when the site could not read back its own list of what this rescue has sent — an obstacle inside this browser, where checking your internet connection was never going to help. That case has [its own answer](#the-page-could-not-read-back-what-this-rescue-has-sent) above, so reading this sentence means a lookup really was made and the network did not answer it.

**Finish — Manage Donor Assets** works in this state as well. None of the three that discard the donor does: an answer the site could not get is never treated as a yes.

### When the Check Keeps Refusing

More than one sentence can repeat for as long as you keep pressing, and this section is about the two
that repeat because of the network: the one that says the page could not see how many blocks are on
top of yours, and the one that says the network did not answer at all. If the first of those is what
you are reading, your transaction is in a block and only its permanence is open — the reasons below
are why that question goes unanswered on some networks, and [On the Blockchain, but the Page Could
Not See How Many Blocks Are on
Top](#on-the-blockchain-but-the-page-could-not-see-how-many-blocks-are-on-top) is the section for the
sentence itself. If yours is the one about the page not being able to read back
its own list of what this rescue has sent, the network is not what is refusing, and a different RPC
will not change it — [The Page Could Not Read Back What This Rescue Has
Sent](#the-page-could-not-read-back-what-this-rescue-has-sent) is yours instead.

On some networks all three of the remedies above can fail, every time, and nothing is wrong with your
browser. Your rescue is not affected by any of this; if you would rather skip the reason, what still
works and what to do about a key you pasted on someone else's computer are listed further down. The
site treats the network's own **finalized** block as the answer, and where an endpoint will not serve
it there is no confirmation count the site is willing to put in its place — not on Optimism, Polygon,
Base, Arbitrum, nor on any network the site has not reviewed. Three different reasons end in that
same refusal:

- **Optimism, Base and Arbitrum settle on Ethereum.** Counting their own blocks would only measure how
  many of them they have produced since, not whether Ethereum has accepted the result — and it is Ethereum
  accepting it that decides whether your transaction can still be undone.
- **Polygon is refused on its own record.** It capped reorganisations at 32 blocks in January 2023 and
  then reorganised 157 blocks the month after, so no small number of blocks can be trusted to mean
  permanent there.
- **A network the site has not reviewed has no reviewed depth at all**, and the site will not invent
  one.

Ethereum and BNB Chain are the only two where the site is willing to count blocks instead when the
tag is unavailable. On the rest, an endpoint
that never answers this question means the three that discard the donor can be refused for as long
as you keep asking. None of the three can be overridden, and that is deliberate: the rescue you could lose by
discarding the donor early cannot be recovered, and discarding it can always be done later.

What you have in that state:

- **none of this reaches anything except those three.** **Finish — Manage Donor Assets**, the
  transaction log, the tx hash it gave you and your rescued funds are all unaffected;
- **an [explorer](/en/glossary#explorer) answers the question the site could not** — you can see for
  yourself that your transaction is where you left it;
- **if what you wanted erased is the private key you pasted in**, and this is not your own computer,
  remove it outside the site rather than waiting for the check: close the tab — keys the page held in
  memory go with it — and clear this site's data in your browser, which takes the donor with it. Next
  time, run the rescue in a private window, where nothing survives closing it. None of that is a way
  around the check: the check exists to stop the *site* from destroying a key the network may still
  need, and it has no opinion about what you delete yourself;
- **keep the backup file you exported.** It is what makes a donor left in place something you can
  walk away from.


### The Check Was Overtaken by Your Own Rescue

The line reads *Something about this rescue changed while the check was running, so its answer would describe how things were a moment ago rather than how they are now. Nothing is lost — run the check again.*

This one looks like [the previous answer](#the-check-could-not-be-completed) and is about something else. The previous one is about a question that came back empty; this one is about an answer that went out of date while it was being assembled — a block arrived for the very transaction being checked, or the send still running in this tab reached its next step.

So the answer the site had assembled was about a state that no longer exists, and it threw it away rather than show it to you. That matters most in one case: had it shown you the earlier reading, it could have offered to replace a transaction that is already in a block — a payment for nothing.

There is one thing to do:

1. Press **Check again**.

You do not need to wait a minute first, and you do not need to look at your connection — the site is not asking you to fix anything. It is telling you that the thing it was measuring was still moving, and by the time you read the sentence it has usually stopped. If a send in this tab is still running, it may take another try or two before the check and the send stop overlapping.

**Finish — Manage Donor Assets** works in this state as well. None of the three that discard the donor does, for the same reason as everywhere else on this page: an answer the site does not stand behind is never treated as a yes.


### The Network Reorganised and the Rescue Did Not Happen

The line reads *The network reorganised and this transaction is no longer part of the blockchain, so the rescue did not take effect. Nothing has been erased: the donor wallet is still here, so run the rescue again — it checks what that wallet holds before it sends anything.*

This is the one answer that is bad news, and it is recoverable. What it means:

- **The assets were not moved.** Whatever the transaction was going to do, it did not happen.
- **Nothing was deleted.** The donor wallet and its private key are still in this browser, and that is what makes running the rescue again possible. What is left on that wallet is a separate question, and not one this check asks — it reads blocks, not balances. The funding step is where it gets answered.
- **Finish — Manage Donor Assets** is blocked, and its reason reads *This transaction is no longer on the blockchain, so there is nothing to finish yet — run the rescue again.*
- **Retry — Back to TX Builder** becomes available. That is the way out, and it is available for exactly this reason.

Press **Retry — Back to TX Builder**, build the transaction again, simulate it again and send it again. A rollback returns the gas that transaction would have spent, so a fresh funding step is usually not needed — but the site does not assume it: the funding step reads what the donor wallet actually holds and asks you to top it up if it is short.

Notice that the sentence says *run the rescue again* and not "start over". How much of the plan that costs depends on the plan, and where the site can prove the answer it tells you. A rescue sent as more than one transaction carries a step-scope sentence — see [Which Step of the Plan the Answer Is About](#which-step-of-the-plan-the-answer-is-about) — and where every *other* step of that plan has been proved permanent, one more sentence follows it: *The rest of this plan already went through and is not affected — running the rescue again will not repeat it, only pick up from here.*

That sentence appears only when the site holds that proof for every other step, so not seeing it is not bad news about them: it means the site has not proved them permanent, not that they were undone. And read it as a description of what the rebuild will find rather than a promise about what it will cost. There is one control — build the plan again — and the planner works out for itself which parts are still needed; a wallet whose tokens have already moved rebuilds to nothing at all. It can still turn out that a helper contract has to be deployed a second time, for instance if the site itself has been updated in between. That is a surprise on the gas estimate rather than a loss, and deploying again is the right thing to do when it happens.

::: danger Send It Again, and Do Not Put It Off

The compromised wallet is still compromised and whatever was draining it is still draining it. A rescue the network has reorganised away is a rescue that has not happened, so treat this as being back where you started, not as a finished job with a warning on it.

:::

### The Network Included the Transaction Again and Something Else Came of It

The line reads *This transaction is on the blockchain, but not with the result this page recorded for it: the network reorganised and included it again, and what came of it the second time is different. So what you were shown about this step is no longer what happened. Nothing has been erased and the donor wallet is still here, though the attempt may have spent some of its gas. Check the balance of the wallet you were rescuing, and the gas left on the donor wallet, before you do anything else; then run the rescue again if the funds are still where they were.*

This is the neighbour of the section above and its other half. There the reorganisation threw the transaction out of the blockchain altogether; here the network threw it out of one block and included it in another — and the second time round, something else came of it. Most often that means a transaction that went through reverted on its way back in: gas was spent and nothing was moved.

So the sentence does not say the transaction is gone: it is there, and sending it again as though it were not would be wrong. And for the same reason it does not stay quiet: the step is still showing a success the site can no longer stand behind.

What changes on screen:

- **The success card goes away.** The site stops claiming what it can no longer prove.
- **Finish — Manage Donor Assets** is blocked, as it is after a reorganisation — but it says something else, because something else is true here. Its reason reads *This transaction is on the blockchain, but it came out differently from what is recorded here, so there is nothing to finish yet — run the rescue again.* After a reorganisation it says the transaction is no longer on the blockchain; here it is, and that is the whole difference between the two answers.
- **Retry — Back to TX Builder** becomes available, and it does so whether the step ended in success or in an error, because that is the way out.

Check the balance of the wallet you were rescuing first — in [an explorer](/en/glossary#explorer) or in your own wallet. That is the only thing that settles it here: the result the page recorded and the result the network reports disagree, and the balance is what tells the truth. If the funds are still where they were, run the rescue again; if they have already left, there is nothing to repeat.

Running it again is offered rather than urged: sending again costs gas and can revert the same way. The donor wallet itself is still here either way — it is the key the rescue is run with, and nothing removes it. How much gas is left on it is a different question, and the site does not know the answer: a transaction that reverted on its way back into the blockchain spent its gas doing so, while one the reorganisation returned did not. So check that balance too before you send anything again, in the same explorer.

::: danger Do Not Put Off Checking the Balance

The compromised wallet is still compromised. If the rescue reverted on its way back in then it did not happen — and whatever was draining the wallet has not gone anywhere in the meantime.

:::

### The Network Included the Transaction Again and the Site Cannot Compare the Result

The line reads *This transaction is on the blockchain, but this page cannot tell whether what came of it is what it recorded for this step — one of the two results is missing, not different, so nothing here says your rescue went wrong. Check the balance of the wallet you were rescuing, because that is what settles it, and run the check again.*

This is the quietest neighbour of the two sections above, and the difference is worth being exact about, because the words are close and what they mean is not.

In the section above, the site has *two* answers about what came of the transaction — its own and the network's — and they disagree. Here it has only one. Either the step was recorded by an older version of the site that did not store what came of the transaction, or the network reported the result in a form this site will not guess at. In both cases there is nothing to compare, and a comparison that was not made is not a comparison that failed.

So the sentence claims nothing:

- **The success card stays.** Nothing has refuted it. Taking it down because a field is missing would be inventing bad news, and this site does not do that in either direction.
- **Finish — Manage Donor Assets works**, and that is one more thing separating this answer from the one above, where it is blocked. Nothing here has been refuted, so nothing is taken away from you: go on and withdraw the donor's leftovers if that is what you were doing. What stays held back is the three that discard the donor — replacing the donor wallet, erasing it, and erasing the whole rescue session — because the site did not reach "this is permanent", and only reaching it unlocks those three.
- **Retry — Back to TX Builder is not offered**, because nothing says the rescue needs repeating — and repeating it costs gas.

What ends it is the same thing that ends the section above: look at the balance of the wallet you were rescuing, in [an explorer](/en/glossary#explorer) or in your own wallet. If the funds have moved, the rescue happened. Then run the check again — on a later check the network may name the block in a form the site can read.

### Which Step of the Plan the Answer Is About

Some rescues send more than one transaction: one that deploys its own helper contract and then
executes the transfer through it sends two. Where the plan has more than one step, the line adds
*This answer is about step 2 of 2 in this plan.*

It is there because the site always shows you the **worst** answer it has. If the first step is
already permanent and the second was reorganised away, what you read is about the second — and
without that sentence there is no way to tell which half of the rescue the news is about. A plan with
a single step says nothing about steps at all, so seeing the sentence means there was something to
tell apart.

One sentence can follow it, and only after a reorganisation: the one that says the rest of the plan
already went through and is not affected. [The Network Reorganised and the Rescue Did Not
Happen](#the-network-reorganised-and-the-rescue-did-not-happen) covers when it appears and how much
to read into it.

## Erasing the Keys From This Browser

Under the result card, the send step offers one more button: **Erase keys from this browser**. It is
not the same button as [Erase the donor wallet](/en/donor-wallet#how-to-erase-the-donor-wallet) — it
erases more. It takes the donor mnemonic and private key, the compromised wallet keys you pasted,
and the saved state of this session, and then reloads the page. The text above it says so, and how
it ends follows the line described in
[After Sending: Is the Transaction Permanent?](#after-sending-is-the-transaction-permanent). While
that line still shows anything — the check is still running, or it has any answer other than
silence — the text adds that erasing waits until the network confirms the rescue is permanent. Once
the line goes empty, it says instead that the network has confirmed the rescue is permanent and that
you can erase them now.

Pressing it opens a dialog titled **Erase the rescue session?**, with **Keep them for now** and
**Erase and reload**. Nothing is deleted until you choose **Erase and reload**, and not even then
until the site has asked the network — at that moment, not when the dialog opened — whether your
transaction is still part of the blockchain. The refusal, its wording and what to do about it are
exactly the ones described in
[Why an Irreversible Step Can Be Withheld](/en/donor-wallet#why-an-irreversible-step-can-be-withheld): the button reads
**Checking that the transaction is permanent…** while the question is out, the dialog stays open with
the reason on it if the answer is anything but a clear yes, and every press asks again.

There is one more answer, and it comes from the browser rather than from the network: where the
browser will not confirm that this site's own data was deleted, the erase says so instead of
reloading. Either *nothing* was erased — the browser is blocking storage for this site, so everything
is exactly where it was — or the erase *did not finish*: the browser did not confirm that every entry
was deleted, so some of it may still be here and some of it may already be gone, and the page is
deliberately left as it is rather than reloaded, because a reload would look like success. In both
cases the sentence under the button ends the same way: close the tab, which drops what was in
memory, then clear this site's data in your browser settings.

::: warning Have the Pasted Keys to Hand

This erase takes the compromised wallet keys you pasted with it, and nothing on this site can give
them back. If you might still need them — a second rescue on the same wallet, another asset the plan
did not cover — keep them somewhere of your own before you press **Erase and reload**.

:::

## If Sending Fails

Save the error and tx hash if there is one.

Check whether the transaction was actually broadcast. Sometimes a UI error does not mean nothing happened on-chain.

## Next

- [Donor Asset Withdrawal](/en/asset-manager) — what to do with leftovers after sending.
- [Troubleshooting](/en/troubleshooting) — if simulation or sending failed.
- [Service Fees](/en/service-fees) — what goes into the Fund Donor amount.
