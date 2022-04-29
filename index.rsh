"reach 0.1";

const Partaker = {
  getChoice: Fun([], UInt),
  seeResult: Fun([UInt], Null),
};

export const main = Reach.App(() => {
  // declear the those partaking in the agreement
  const Alice = Participant("Alice", {
    // extend or take the Partaker properties
    ...Partaker,
    // define the deposit
    deposit: UInt,
  });
  const Bob = Participant("Bob", {
    // extend or take the Partaker properties
    ...Partaker,
    // define the acceptDeposit function
    acceptDeposit: Fun([UInt], Null),
  });

  // start the program
  init();

  // Alice local step
  // Alice interact with the frontend to make a choice and commit
  Alice.only(() => {
    const deposit = declassify(interact.deposit);
    const AliceChoice = declassify(interact.getChoice());
  });
  // makes her hand public and pays in her deposit
  Alice.publish(deposit, AliceChoice).pay(deposit);
  commit();

  // Bob local step
  // Bob interact with the frontend to make a choice
  Bob.only(() => {
    interact.acceptDeposit(deposit);
    const BobChoice = declassify(interact.getChoice());
  });
  Bob.publish(BobChoice).pay(deposit);

  // compute the result depending on their choices
  const outcome =
    AliceChoice === 1 && BobChoice === 1
      ? 1
      : AliceChoice === 0 && BobChoice === 1
      ? 0
      : AliceChoice === 1 && BobChoice === 0
      ? 2
      : 3;

  // transfer to the winner
  // No one is supposed to get a dim but since we can't leave money in the contract, we do a refund
  if (outcome === 1) {
    transfer(1 * deposit).to(Alice);
    transfer(1 * deposit).to(Bob);
  }

  //   Bob takes all
  if (outcome === 0) {
    transfer(2 * deposit).to(Bob);
  }

  //   Alice takes all
  if (outcome === 2) {
    transfer(2 * deposit).to(Alice);
  }

  //   each one gets a refund
  if (outcome === 3) {
    transfer(1 * deposit).to(Alice);
    transfer(1 * deposit).to(Bob);
  }

  commit();

  // pass the outcome for each to see the result
  each([Alice, Bob], () => {
    interact.seeResult(outcome);
  });
});
