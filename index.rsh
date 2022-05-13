"reach 0.1";

const [isChoice, LEAVE, STAY] = makeEnum(2);
const [isResult, BOB_WINS, DRAW_NO_ONE, ALICE_WINS, DRAW_EVERY_ONE] =
  makeEnum(4);

const winner = (AliceChoice, BobChoice) => {
  const outcome =
    AliceChoice === 1 && BobChoice === 1
      ? 1
      : AliceChoice === 0 && BobChoice === 1
      ? 0
      : AliceChoice === 1 && BobChoice === 0
      ? 2
      : 3;

  return outcome;
};

assert(winner(STAY, STAY) === DRAW_NO_ONE);
assert(winner(LEAVE, STAY) === BOB_WINS);
assert(winner(STAY, LEAVE) === ALICE_WINS);
assert(winner(LEAVE, LEAVE) === DRAW_EVERY_ONE);

const Partaker = {
  ...hasRandom, // for generating random string
  getChoice: Fun([], UInt),
  seeResult: Fun([UInt], Null),
};

export const main = Reach.App(() => {
  // declare those partaking in the agreement
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
    // declassify the wager
    const deposit = declassify(interact.deposit);

    // get the choice of Alice
    const _AliceChoice = interact.getChoice();

    // make a commitment to the contract to get
    // commitment details and a password (salt) for unlocking Alice hand later
    const [_AliceCommit, _AliceSalt] = makeCommitment(interact, _AliceChoice);

    // declassify Alice commitment details
    const AliceCommit = declassify(_AliceCommit);
  });
  // makes her hand public and pays in her deposit
  Alice.publish(deposit, AliceCommit).pay(deposit);
  commit();

  //   tell the program that Bob can not know Alice choice for now
  unknowable(Bob, Alice(_AliceChoice, _AliceSalt));

  // Bob local step
  // Bob interact with the frontend to make a choice
  Bob.only(() => {
    interact.acceptDeposit(deposit);
    const BobChoice = declassify(interact.getChoice());
  });
  Bob.publish(BobChoice).pay(deposit);
  commit();

  // Declassify and publish Alice Details
  Alice.only(() => {
    const AliceChoice = declassify(_AliceChoice);
    const AliceSalt = declassify(_AliceSalt);
  });
  Alice.publish(AliceSalt, AliceChoice);

  // check if the commitment details and salt matches what was created during makeCommitment
  checkCommitment(AliceCommit, AliceSalt, AliceChoice);

  // compute the result depending on their choices
  const outcome = winner(AliceChoice, BobChoice);

  // transfer to the winner
  // No one is supposed to get a dim but since we can't leave money in the contract, we do a refund
  if (outcome === DRAW_NO_ONE) {
    transfer(1 * deposit).to(Alice);
    transfer(1 * deposit).to(Bob);
  }

  //   Bob takes all
  if (outcome === BOB_WINS) {
    transfer(2 * deposit).to(Bob);
  }

  //   Alice takes all
  if (outcome === ALICE_WINS) {
    transfer(2 * deposit).to(Alice);
  }

  //   each one gets a refund
  if (outcome === DRAW_EVERY_ONE) {
    transfer(1 * deposit).to(Alice);
    transfer(1 * deposit).to(Bob);
  }

  commit();

  // pass the outcome for each to see the result
  each([Alice, Bob], () => {
    interact.seeResult(outcome);
  });
});
