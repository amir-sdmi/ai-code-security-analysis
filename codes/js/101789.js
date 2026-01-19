/**
 * Hate the mutation in here but it does the job. Co-authored with ChatGPT for speed.
 * https://chat.openai.com/share/8a78a751-1919-4e65-8928-fc1ed7616e97
 * I wanted a mortgage calculator that outputted data in-line with my current mortgage, which this does.
 */

/**
 * 
 * @param {number} debt 
 * @param {number} monthlyInterestRate 
 * @param {number} totalPayments 
 * @returns 
 */
const calculateRemainingPayment = (debt, monthlyInterestRate, totalPayments) => {
  return (debt * monthlyInterestRate) /
    (1 - Math.pow(1 + monthlyInterestRate, -totalPayments));
}

/**
 * 
 * @param {number} interestRate 
 * @returns 
 */
const getMonthlyInterestRate = interestRate => interestRate / 12 / 100;

/**
 * 
 * @param {boolean} isPostFixedTerm 
 * @param {number} marketMonthlyInterestRate 
 * @param {number} fixedTermMonthlyInterestRate 
 * @returns 
 */
const getCurrentInterestRate = (isPostFixedTerm, marketMonthlyInterestRate, fixedTermMonthlyInterestRate) =>
  isPostFixedTerm ?
    marketMonthlyInterestRate :
    fixedTermMonthlyInterestRate;

/**
 * 
 * @param {number} debt 
 * @param {number} fixedTermInterestRate 
 * @param {number} totalPayments 
 * @param {number} extraPaymentStartMonth 
 * @param {number} monthlyExtraPayment 
 * @param {number} fixedTermInMonths 
 * @param {number} marketInterestRate 
 * @returns 
 */
function calculateMortgageAmortization(
  debt,
  fixedTermInterestRate,
  totalPayments,
  extraPaymentStartMonth,
  monthlyExtraPayment,
  fixedTermInMonths,
  marketInterestRate,
) {

  const fixedTermMonthlyInterestRate = getMonthlyInterestRate(fixedTermInterestRate);
  const marketMonthlyInterestRate = getMonthlyInterestRate(marketInterestRate);

  let reduceLifetimeRemainingBalance = debt;
  let reduceLifetimeSchedule = [];

  let totalPaymentsAtEnd;
  let debtAtFixedTermEnd;

  // Payment plan 1
  for (let month = 1; month <= totalPayments; month++) {
    if (reduceLifetimeRemainingBalance <= 0) {
      continue;
    }

    const isPostFixedTerm = month > fixedTermInMonths;
    const interestRate = getCurrentInterestRate(isPostFixedTerm, marketMonthlyInterestRate, fixedTermMonthlyInterestRate);

    const isFirstPaymentAfterFixedTerm = month === (fixedTermInMonths + 1);

    if (isFirstPaymentAfterFixedTerm) {
      debtAtFixedTermEnd = reduceLifetimeRemainingBalance;
      totalPaymentsAtEnd = totalPayments - fixedTermInMonths;
    }

    const totalDebt = isPostFixedTerm ? debtAtFixedTermEnd : debt;
    const totalPaymentsOfRemainingTerm = isPostFixedTerm ? totalPaymentsAtEnd : totalPayments;
    const planOneMonthlyPayment = calculateRemainingPayment(totalDebt, interestRate, totalPaymentsOfRemainingTerm)

    const interestPayment = reduceLifetimeRemainingBalance * interestRate;
    const shouldAddOverpayment = month >= extraPaymentStartMonth;

    let debtPayment = planOneMonthlyPayment - interestPayment;

    if (shouldAddOverpayment) {
      reduceLifetimeRemainingBalance -= monthlyExtraPayment;
    }

    if ((reduceLifetimeRemainingBalance - debtPayment) < 0) {
      debtPayment = reduceLifetimeRemainingBalance;
    }

    reduceLifetimeRemainingBalance -= debtPayment;

    reduceLifetimeSchedule.push({
      month,
      debtPayment,
      interestPayment,
      extraPayment: month >= extraPaymentStartMonth ? monthlyExtraPayment : 0,
      remainingBalance: reduceLifetimeRemainingBalance,
    });
  }

  let reduceMortgagePaymentsBalance = debt;
  let reducePaymentSchedule = [];

  // Payment plan 2
  for (let month = 1; month <= totalPayments; month++) {
    const totalPaymentsRemaining = totalPayments - month + 1;
    const isPostFixedTerm = month > fixedTermInMonths;
    const interestRate = getCurrentInterestRate(isPostFixedTerm, marketMonthlyInterestRate, fixedTermMonthlyInterestRate);
    let remainingMonthlyPayment = calculateRemainingPayment(reduceMortgagePaymentsBalance, interestRate, totalPaymentsRemaining)
    const interestPayment = reduceMortgagePaymentsBalance * interestRate;
    const debtPayment = remainingMonthlyPayment - interestPayment;

    reduceMortgagePaymentsBalance -= debtPayment;
    let totalOverpayment = 0;

    const shouldOverpay = month >= extraPaymentStartMonth

    if (shouldOverpay && reduceMortgagePaymentsBalance - monthlyExtraPayment > 0) {
      reduceMortgagePaymentsBalance -= monthlyExtraPayment;
    }

    remainingMonthlyPayment = calculateRemainingPayment(reduceMortgagePaymentsBalance, interestRate, totalPaymentsRemaining)

    reducePaymentSchedule.push({
      month,
      debtPayment,
      interestPayment,
      extraPayment: totalOverpayment,
      remainingBalance: Math.abs(reduceMortgagePaymentsBalance),
    });
  }

  let noOverpaymentsSchedule = [];
  let noOverpaymentRemainingBalance = debt;
  let noOverpaymentsTotalPaymentsAtEnd;
  let noOverpaymentsDebtAtFixedTermEnd;

  // No overpayments
  for (let month = 1; month <= totalPayments; month++) {
    if (noOverpaymentRemainingBalance < 0) {
      continue;
    }

    const isPostFixedTerm = month > fixedTermInMonths;
    const interestRate = getCurrentInterestRate(isPostFixedTerm, marketMonthlyInterestRate, fixedTermMonthlyInterestRate);

    const isFirstPaymentAfterFixedTerm = month === (fixedTermInMonths + 1);

    if (isFirstPaymentAfterFixedTerm) {
      noOverpaymentsTotalPaymentsAtEnd = noOverpaymentRemainingBalance;
      noOverpaymentsDebtAtFixedTermEnd = totalPayments - fixedTermInMonths;
    }

    const totalDebt = isPostFixedTerm ? noOverpaymentsTotalPaymentsAtEnd : debt;
    const totalPaymentsOfRemainingTerm = isPostFixedTerm ? noOverpaymentsDebtAtFixedTermEnd : totalPayments;
    const noOverpaymentMonthlyPayment = calculateRemainingPayment(totalDebt, interestRate, totalPaymentsOfRemainingTerm)

    const interestPayment = noOverpaymentRemainingBalance * interestRate;

    let debtPayment = noOverpaymentMonthlyPayment - interestPayment;

    noOverpaymentRemainingBalance -= debtPayment;

    noOverpaymentsSchedule.push({
      month,
      debtPayment,
      interestPayment,
      extraPayment: 0,
      remainingBalance: noOverpaymentRemainingBalance,
    });
  }

  return {
    reduceLifetimeSchedule, reducePaymentSchedule, noOverpaymentsSchedule
  };
}

/**
 * 
 * @param {Array} data 
 * @returns 
 */
const calculateStats = (data) => {
  return data.reduce((a, b) => ({
    debtPayment: a.debtPayment + b.debtPayment + b.extraPayment,
    interestPayment: a.interestPayment + b.interestPayment,
    extraPayment: a.extraPayment + b.extraPayment,
  }), {
    debtPayment: 0,
    interestPayment: 0,
    extraPayment: 0,
  });
}
