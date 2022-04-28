import { loadStdlib } from "@reach-sh/stdlib";
import * as backend from "./build/index.main.mjs";
const stdlib = loadStdlib();

const startingBalance = stdlib.parseCurrency(100);

// create account balace for Alice and Bob
const AliceBalance = await stdlib.newTestAccount(startingBalance);
const BobBalance = await stdlib.newTestAccount(startingBalance);

// create contracts for Alice and Bob
const AliceContract = AliceBalance.contract(backend);
const BobContract = BobBalance.contract(backend, AliceContract.getInfo());

// define the choices
const CHOICE = ["Leave", "Stay"];
const RESULT = [
  "Bob Takes All the money",
  "No one takes a dim",
  "Alice Takes All the money",
  "Each Person's money is refunded",
];

// Define the Partaker
const Partaker = (person) => ({
  getChoice: () => {
    // make a random choice by picking a number between 1 & 2
    const choice = Math.floor(Math.random() * 2);
    console.log(`${person} wants to ${CHOICE[choice]}`);
    return choice;
  },

  seeResult: (result) => {
    console.log(`${RESULT[result]}`);
  },
});

// initialize the backend
// execute the steps Alice and Bob takes in this program
await Promise.all([
  // Alice
  AliceContract.p.Alice({
    ...Partaker("Alice"),
  }),

  // Bob
  BobContract.p.Bob({
    ...Partaker("Bob"),
  }),
]);
