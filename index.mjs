import { loadStdlib, ask } from "@reach-sh/stdlib";
import * as backend from "./build/index.main.mjs";
const stdlib = loadStdlib();

// check if the player is Alice or Bob
const isAlice = await ask.ask(`Are you Alice?`, ask.yesno);
const person = isAlice ? "Alice" : "Bob";

console.log(`You are entering this agreement as ${person}`);

// create account
let userAccount = null;

// ask to create a new account
const createAccount = await ask.ask(
  `Would you like to create a new account?`,
  ask.yesno
);

// create a new account if createAccount is true else just join the contract with your password
if (createAccount) {
  userAccount = await stdlib.newTestAccount(stdlib.parseCurrency(1000));
} else {
  const accountPassword = await ask.ask(
    `What is the account password?`,
    (password) => password
  );

  userAccount = await stdlib.newAccountFromSecret(accountPassword);
}

// create contract
let transactionContract = null;
if (isAlice) {
  transactionContract = userAccount.contract(backend);
  transactionContract.getInfo().then((contractInfo) => {
    console.log(
      `Your contract has been deployed as ${JSON.stringify(contractInfo)}`
    );
  });
} else {
  const contractInfo = await ask.ask(
    `Please enter your contract details:`,
    JSON.parse
  );
  transactionContract = userAccount.contract(backend, contractInfo);
}

// format currency function
// formats currency to 4-decimal place
const currencyFormatter = (fund) => stdlib.formatCurrency(fund, 4);

// get balance function
const getBalance = async () =>
  currencyFormatter(await stdlib.balanceOf(userAccount));

// get user's previous balance
const balanceBefore = await getBalance();
console.log(`Your Balance is ${balanceBefore}`);

// start participant interaction interface
const interact = { ...stdlib.hasRandom };

// define the timeout function
interact.participantTimeout = () => {
  console.log(`There was a timeout`);
  process.exit(1);
};

// deposit and deadline (timeUp)
if (isAlice) {
  // setup deposit
  const amount = await ask.ask(
    `How much do you want to deposit?`,
    stdlib.parseCurrency
  );
  interact.deposit = amount;
  interact.timeUp = { ETH: 100, ALGO: 100, CFX: 1000 }[stdlib.connector];
} else {
  // setup accept deposit function
  interact.acceptDeposit = async (amount) => {
    const accepted = await ask.ask(
      `Do you accept to make the same deposit of ${currencyFormatter(
        amount
      )} as Alice?`,
      ask.yesno
    );

    // terminate if terms are not accepted
    if (!accepted) {
      process.exit(0);
    }
  };
}

// define the choices
const CHOICE = ["Leave", "Stay"];
const CHOICES = {
  leave: 0,
  L: 0,
  l: 0,
  LEAVE: 0,
  stay: 1,
  S: 1,
  s: 1,
  STAY: 1,
};

// get choice function
interact.getChoice = async () => {
  const choice = await ask.ask(`Do you want to STAY or LEAVE?`, (result) => {
    const resultingChoice = CHOICES[result];
    if (resultingChoice === undefined) {
      throw Error(`${resultingChoice} isn't an option!`);
    }
    return resultingChoice;
  });

  console.log(`You want to ${CHOICE[choice]}`);
  return choice;
};

// define outcome
const RESULT = [
  "Bob Takes All the money",
  "No one takes a dime",
  "Alice Takes All the money",
  "Each Person's money is refunded",
];

interact.seeResult = async (result) => {
  console.log(`${RESULT[result]}`);
};

const individual = isAlice
  ? transactionContract.p.Alice
  : transactionContract.p.Bob;

await individual(interact);

const balanceAfter = await getBalance();
console.log(`Your balance is now ${balanceAfter}`);

ask.done();
