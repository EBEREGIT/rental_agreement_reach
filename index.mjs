import { loadStdlib } from "@reach-sh/stdlib";
import * as backend from "./build/index.main.mjs";
const stdlib = loadStdlib();

const startingBalance = stdlib.parseCurrency(100);

// create account balace for Alice and Bob
const AliceAccount = await stdlib.newTestAccount(startingBalance);
const BobAccount = await stdlib.newTestAccount(startingBalance);

// format currency function
// formats currency to 4-decimal place
const currencyFormatter = (fund) => stdlib.formatCurrency(fund, 4);

// get balance function
const getBalance = async (person) =>
  currencyFormatter(await stdlib.balanceOf(person));

// get the balances before starting the agreement
const AliceBalanceBefore = await getBalance(AliceAccount);
const BobBalanceBefore = await getBalance(BobAccount);

// create contracts for Alice and Bob
const AliceContract = AliceAccount.contract(backend);
const BobContract = BobAccount.contract(backend, AliceContract.getInfo());

// define the choices
const CHOICE = ["Leave", "Stay"];
const RESULT = [
  "Bob Takes All the money",
  "No one takes a dime",
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
    // decides a deposit to make
    deposit: stdlib.parseCurrency(15),
  }),

  // Bob
  BobContract.p.Bob({
    ...Partaker("Bob"),
    // accepts to make the same deposit
    acceptDeposit: (amount) => {
      console.log(
        `Bob accepts to also deposit ${currencyFormatter(
          amount
        )} as proposed by Alice`
      );
    },
  }),
]);

// get the balances before starting the agreement
const AliceBalanceAfter = await getBalance(AliceAccount);
const BobBalanceAfter = await getBalance(BobAccount);

// display final each person's account balance
console.log(`Alice went from ${AliceBalanceBefore} to ${AliceBalanceAfter}`);
console.log(`Bob went from ${BobBalanceBefore} to ${BobBalanceAfter}`);
