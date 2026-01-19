/*import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// data from readme
const customerData = [
  { date: '2012-01-10', credit: 1000, debit: null, balance: 1000 },
  { date: '2012-01-13', credit: 2000, debit: null, balance: 3000 },
  { date: '2012-01-14', credit: null, debit: 500, balance: 2500 },
];

function printBankStatement() {
  console.log("Bank Statement:");
  for (const transaction of customerData) {
    const { date, credit, debit, balance } = transaction;
    console.log(`Date: ${date}, Credit: ${credit || ' '}, Debit: ${debit || ' '}, Balance: ${balance}`);
  }
}

rl.question("Type 'print' to print the bank statement or 'exit' to quit: ", (answer) => {
  if (answer === 'print') {
    printBankStatement();
  } else if (answer === 'exit') {
    rl.close();
  } else {
    console.log("Invalid input. Type 'print' to print the bank statement or 'exit' to quit.");
  }
}); */

//The above is my code, the below was generated with ChatGPT for the additional task to:
// - The output of the statement should be formatted so credits and positive balances 
// appear in green text, debits and negative balances appear in red text -- 
//to test node src/customer-data-repl.js

import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// data from readme
const customerData = [
  { date: '2012-01-10', credit: 1000, debit: null, balance: 1000 },
  { date: '2012-01-13', credit: 2000, debit: null, balance: 3000 },
  { date: '2012-01-14', credit: null, debit: 500, balance: 2500 },
];

function formatWithColor(text, colorCode) {
  return `\x1b[${colorCode}m${text}\x1b[0m`;
}

function printBankStatement() {
  console.log("Bank Statement:");
  for (const transaction of customerData) {
    const { date, credit, debit, balance } = transaction;
    const formattedCredit = credit ? formatWithColor(credit, '32') : ' '; // '32' is green
    const formattedDebit = debit ? formatWithColor(debit, '31') : ' '; // '31' is red
    const formattedBalance = balance >= 0 ? formatWithColor(balance, '32') : formatWithColor(balance, '31');
    console.log(`Date: ${date}, Credit: ${formattedCredit}, Debit: ${formattedDebit}, Balance: ${formattedBalance}`);
  }
}

rl.question("Type 'print' to print the bank statement or 'exit' to quit: ", (answer) => {
  if (answer === 'print') {
    printBankStatement();
  } else if (answer === 'exit') {
    rl.close();
  } else {
    console.log("Invalid input. Type 'print' to print the bank statement or 'exit' to quit.");
  }
});

