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
  });
  const Bob = Participant("Bob", {
    // extend or take the Partaker properties
    ...Partaker,
  });

  // start the program
  init();

  // Alice local step
  // Alice interact with the frontend to make a choice and commit
  Alice.only(() => {
    const AliceChoice = declassify(interact.getChoice());
  });
  Alice.publish(AliceChoice);
  commit();

  // Bob local step
  // Bob interact with the frontend to make a choice
  Bob.only(() => {
    const BobChoice = declassify(interact.getChoice());
  });
  Bob.publish(BobChoice);
  commit();

  // compute the result depending on their choices
  const outcome =
    AliceChoice === 1 && BobChoice === 1
      ? 1
      : AliceChoice === 0 && BobChoice === 1
      ? 0
      : AliceChoice === 1 && BobChoice === 0
      ? 2
      : 3;

  // pass the outcome for each to see the result
  each([Alice, Bob], () => {
    interact.seeResult(outcome);
  });
});
