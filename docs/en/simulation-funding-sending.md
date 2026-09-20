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

## If Simulation Fails

**Two different things end up here, and they are not the same news.** One is an answer: the check ran, it ran your transaction as a trial, and the trial did not succeed. The other is the absence of an answer: the check never finished — the network did not reply, what came back could not be read, or the request never got out — so nothing was established about your transaction at all, in either direction.

The site shows a different card for each, because what to do next is different. **The card's first line says which one you have**, and the colour of the card says it a second time:

- **The check ran and the transaction failed.** The first line reads *This transaction will likely fail on-chain.* The card behind it is tinted amber, and that line is amber too. Yours is [When the Check Says the Transaction Will Fail](#when-the-check-says-the-transaction-will-fail).
- **The check did not finish.** The first line reads *The check did not finish, so nothing is known about this transaction yet.* The card behind it is plain grey, with no amber in it at all, and that line is in ordinary text rather than amber. Yours is [When the Check Did Not Finish](#when-the-check-did-not-finish).

Go by the sentence if the two look the same colour to you. A high-contrast mode turned on in your system replaces the site's palette with its own, and the amber goes with it — then the wording is the whole of the difference. Where there is colour, read it off the block the sentence sits in rather than off the buttons: with the header toggle on **Advanced**, both cards grow the same amber tick box and amber button underneath, because going on is the cautious act either way.

### When the Check Did Not Finish

Nothing was run and nothing came back. The site could not reach the network it checks through, or what came back was not something it could read, or the request never went out. None of that is about your transaction, and none of it is a reason to change the transaction: it has not been checked yet.

**Press Check Again first.** The button sits inside the simulator's card, under its text. It costs nothing, sends nothing to the blockchain, spends no gas, and runs exactly the check that did not finish. A check that did not get through once very often does on the next try, so this is the first move rather than the last resort. While it runs, the card disappears and the **Run Simulation** button above shows that a check is in progress; the answer comes back in the same place. (The send step, described much further down this page, has a **Check again** of its own. That is a different button asking a different question — about a transaction that has already gone out.)

If there is no **Check Again** button in the card at all, it is because **Run Simulation** above is blocked for some reason — the retry is the same check, so it is never offered where that button cannot run. Read what that button says is missing, put it right, and run the check from there.

If pressing it keeps giving you this same card, what is in the way is between you and the network rather than in your transaction. There is one thing to try: **set a different [RPC](/en/glossary#rpc) address for this network** in the network selector at the top of the page. A check is only as good as the connection it goes through, and a different address is a different connection.

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

So the moment the send reports success, the site asks the network whether your transaction's block is still part of the chain. The answer appears in a line below the buttons, and it decides four things: whether **Finish — Manage Donor Assets** works, whether the donor wallet can be replaced, whether it can be erased, and whether the whole rescue session can be erased from this browser.

The last three are the ones that leave the donor's private key unrecoverable, so this page speaks of them together — **the three that discard the donor**. Replacing counts because **Generate Wallet** and **Import Wallet** write the new donor over the stored one; see [How to Replace the Donor Wallet](/en/donor-wallet#how-to-replace-the-donor-wallet).

Two things to know about the check itself:

- **It runs once on its own, and after that when you ask.** There is no timer, so a line that has not settled stays as it is until you press **Check again** beside it. Changing the network or the RPC starts a fresh check on its own.
- **It only reads.** It does not send anything, costs no gas, and cannot undo the transaction. If your rescue was sent as more than one transaction, every one of them is checked and the line reports the worst answer, which may not be about the last tx hash you saw.

The line has seven possible answers. Two things are worth knowing before you read them: the good one is silence, and exactly one of them comes with a button that changes something.

### While the Site Is Still Checking

The line reads *Checking that the transaction is permanent…*

Nothing to do. Wait for it to finish. The **Check again** button appears only after the first answer arrives.

### When the Line Goes Empty

Nothing at all: the line goes blank, and the **Check again** button disappears with it.

This is the outcome you want, and it is worth knowing in advance, because the site says nothing when the answer is yes. An empty space under the buttons means the transaction is [permanent](/en/glossary#permanent-transaction), the rescue is as finished as anything on a blockchain gets, and the donor wallet can now be erased.

### Not Yet Permanent — Wait and Check Again

The line reads *The transaction is on the blockchain but not yet permanent. For a few minutes a network can still reshuffle its most recent blocks, and until that settles the rescue could be undone. Wait a moment, then check again.*

Your transaction is on the blockchain and everything is going the way it should. **Finish — Manage Donor Assets** works normally, so you can go on and withdraw the donor's leftovers. The only things being held back are the three that discard the donor: replacing the donor wallet, erasing it, and erasing the whole rescue session.

Wait a minute or two, then press **Check again**. You do not have to sit and watch it: this state holds back only the three that discard the donor, so if you are not erasing or replacing anything, press **Finish — Manage Donor Assets** and carry on.

::: tip This Is Normal, Not an Error

Every transaction on every network passes through this state. Seeing it does not mean anything went wrong, and there is nothing to fix — the network simply has not put enough blocks on top of yours yet. How long that takes depends on the network, and the site will not guess at a number it cannot know.

:::

### Sent, but Not in a Block Yet

The line reads *The transaction has been sent, and it cannot be confirmed yet that a block holds
it. This says nothing about your rescue, only that the check could not be completed. Wait a minute
and check again; nothing is lost while you wait.*

This is not the state above. There, your transaction is already in a block and the block is waiting
to become permanent; here there is no block yet — the network accepted the transaction and has not
put it in one. An ordinary queue at a low gas price looks exactly like this.

Wait a minute and press **Check again**. Do not send the transaction a second time: it will not make
the first one arrive sooner, and the site is already watching for the one you sent.

There is a second version of this sentence, and it is the one to hope for: it adds that the place in
the queue your transaction was signed for is still free for it, and it comes with a button. If that
is what you are reading, go to [Sent, Not in a Block Yet, and
Replaceable](#sent-not-in-a-block-yet-and-replaceable) instead. This shorter sentence is what you get
when a replacement cannot be aimed — the site could not read the queue, could not keep the hash, or
something else has already taken that place in the queue — and then waiting really is the honest
advice.

**Finish — Manage Donor Assets** works in this state. None of the three that discard the donor does,
for the same reason as above: the site treats only a proven block as a yes.

### Sent, Not in a Block Yet, and Replaceable

The line reads *The transaction has been sent and is not in a block yet, and the place in the queue it was signed for is still free for it — so it can still go through on its own. Wait a moment and check again; nothing is lost while you wait. If nothing changes, you can replace it by offering more for gas: the replacement takes that same place in the queue instead of queueing up behind it.*

Beside **Check again** there is a second button: **Replace with a higher gas price**. It is the only
answer on this page that comes with a way forward of its own, and that is not an oversight in the
others — this is the one state where a send is neither finished nor failed, so neither **Retry — Back
to TX Builder** nor **Finish — Manage Donor Assets** is the right control for it.

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

**Finish — Manage Donor Assets** works in this state. None of the three that discard the donor does,
exactly as in the state above: a transaction that is not yet in a block is not a proven one. If you
met this sentence inside a confirmation dialog rather than in the line — erasing the donor, erasing
the session, or replacing the donor — the button is not in the dialog. Close the dialog with its keep
button, and both **Check again** and **Replace with a higher gas price** are waiting in the line
under the send controls.

### Sent on a Different Network

The line reads *The transaction was sent on a different network from the one this page is set to now, so it cannot be checked from here — and waiting will not change that. This says nothing about your rescue, only that the check cannot be made while another network is selected. Switch back to the network you sent it on, then run the check again.*

This one is about the page, not about your transaction. The check asks whichever network the selector at the top of the site is pointing at, and your transaction is on a different one, so there is nothing there to look up. Your rescue has not been refuted — and it has not been confirmed either, because no question was asked.

It is also the one answer where waiting is the thing that will not help. The states above are waiting on the network to do something; here nothing was asked at all, so there is nothing for time to change, and **Check again** with another network selected gives the same answer for as long as you keep pressing it.

There is one fix, and one control does it: set the network selector back to the network you sent on. Switching starts a fresh check by itself, so the line answers again without you pressing anything. If you no longer remember which network that was, set the header toggle to **Advanced**: the same sentence then ends with a technical line giving the [chain ID](/en/glossary#chain-id) the transaction went to and the one this page is set to now. If you met this sentence inside a confirmation dialog rather than in the line — erasing the donor, erasing the session, or replacing the donor — the fix is the same one: close the dialog, switch the selector back, then press the button again.

### The Check Could Not Be Completed

The line reads *We could not confirm that the transaction is permanent — the network did not answer. This says nothing about your rescue, only that the check could not be completed. Check your internet connection and run the check again in a minute; nothing is lost while you wait.*

Read the middle sentence twice. This is a fact about the connection, not about your transaction: your rescue is in exactly the state it was in a moment ago, and nothing about it has been refuted. Some RPC endpoints simply will not answer this particular question.

Try these, in order:

1. press **Check again**;
2. select a different [RPC](/en/glossary#rpc) — switching starts a fresh check by itself, and **Check again** repeats it;
3. look the tx hash up in an [explorer](/en/glossary#explorer), which answers the same question without the site.

The network selector is not on that list, and it used to be. A transaction sent on another network now gets [its own answer](#sent-on-a-different-network) instead of this one, so if you are reading this sentence, the selector is not what went wrong.

**Finish — Manage Donor Assets** works in this state as well. None of the three that discard the donor does: an answer the site could not get is never treated as a yes.

### When the Check Keeps Refusing

On some networks all three of those remedies can fail, every time, and nothing is wrong with your
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

- **everything except those three works.** **Finish — Manage Donor Assets**, the transaction log, the
  tx hash it gave you and your rescued funds are all unaffected;
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


### The Network Reorganised and the Rescue Did Not Happen

The line reads *The network reorganised and this transaction is no longer part of the blockchain, so the rescue did not take effect. Nothing has been erased: the donor wallet is still here and still funded, so run the rescue again.*

This is the one answer that is bad news, and it is recoverable. What it means:

- **The assets were not moved.** Whatever the transaction was going to do, it did not happen.
- **Nothing was deleted.** The donor wallet, its private key and the gas on it are all still here.
- **Finish — Manage Donor Assets** is blocked. Hover it and it says *This transaction is no longer on the blockchain, so there is nothing to finish yet — run the rescue again.*
- **Retry — Back to TX Builder** becomes available. That is the way out, and it is available for exactly this reason.

Press **Retry — Back to TX Builder**, build the transaction again, simulate it again and send it again. The donor is still funded, so no new funding step is usually needed.

Notice that the sentence says *run the rescue again* and not "start over". How much of the plan that costs depends on the plan, and where the site can prove the answer it tells you. A rescue sent as more than one transaction carries a step-scope sentence — see [Which Step of the Plan the Answer Is About](#which-step-of-the-plan-the-answer-is-about) — and where every *other* step of that plan has been proved permanent, one more sentence follows it: *The rest of this plan already went through and is not affected — running the rescue again will not repeat it, only pick up from here.*

That sentence appears only when the site holds that proof for every other step, so not seeing it is not bad news about them: it means the site has not proved them permanent, not that they were undone. And read it as a description of what the rebuild will find rather than a promise about what it will cost. There is one control — build the plan again — and the planner works out for itself which parts are still needed; a wallet whose tokens have already moved rebuilds to nothing at all. It can still turn out that a helper contract has to be deployed a second time, for instance if the site itself has been updated in between. That is a surprise on the gas estimate rather than a loss, and deploying again is the right thing to do when it happens.

::: danger Send It Again, and Do Not Put It Off

The compromised wallet is still compromised and whatever was draining it is still draining it. A rescue the network has reorganised away is a rescue that has not happened, so treat this as being back where you started, not as a finished job with a warning on it.

:::

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
and the saved state of this session, and then reloads the page. The text above it says so, and adds
that erasing waits until the network confirms the rescue is permanent.

Pressing it opens a dialog titled **Erase the rescue session?**, with **Keep them for now** and
**Erase and reload**. Nothing is deleted until you choose **Erase and reload**, and not even then
until the site has asked the network — at that moment, not when the dialog opened — whether your
transaction is still part of the blockchain. The refusal, its wording and what to do about it are
exactly the ones described in
[Why an Irreversible Step Can Be Withheld](/en/donor-wallet#why-an-irreversible-step-can-be-withheld): the button reads
**Checking that the transaction is permanent…** while the question is out, the dialog stays open with
the reason on it if the answer is anything but a clear yes, and every press asks again.

There is one more answer, and it comes from the browser rather than from the network: where the
browser blocks this site from deleting its own data, the erase says so instead of reloading. Either
*nothing* was erased — everything is exactly where it was — or *part* of it was, in which case the
page is deliberately left as it is rather than reloaded, because a reload would look like success. In
both cases the sentence under the button ends the same way: close the tab, which drops what was in
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
