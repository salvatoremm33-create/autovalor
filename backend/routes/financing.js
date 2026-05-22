const express = require('express');
const router = express.Router();

router.post('/calculate', (req, res) => {
  const { vehiclePrice, downPayment, interestRate, termMonths } = req.body;

  if (!vehiclePrice || !termMonths) {
    return res.status(400).json({ error: 'Se requieren precio y plazo' });
  }

  const price = parseFloat(vehiclePrice);
  const down = parseFloat(downPayment || 0);
  const rate = parseFloat(interestRate || 18) / 100 / 12;
  const n = parseInt(termMonths);

  const principal = price - down;

  if (principal <= 0) {
    return res.json({
      monthlyPayment: 0, totalCost: down, totalInterest: 0,
      principal: 0, downPayment: down, termMonths: n
    });
  }

  let monthlyPayment;
  if (rate === 0) {
    monthlyPayment = principal / n;
  } else {
    monthlyPayment = principal * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
  }

  const totalCost = monthlyPayment * n + down;
  const totalInterest = totalCost - price;

  const schedule = [];
  let balance = principal;
  for (let month = 1; month <= Math.min(n, 12); month++) {
    const interestPayment = balance * rate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;
    schedule.push({
      month,
      payment: Math.round(monthlyPayment),
      principal: Math.round(principalPayment),
      interest: Math.round(interestPayment),
      balance: Math.max(0, Math.round(balance))
    });
  }

  res.json({
    monthlyPayment: Math.round(monthlyPayment),
    totalCost: Math.round(totalCost),
    totalInterest: Math.round(totalInterest),
    principal: Math.round(principal),
    downPayment: Math.round(down),
    termMonths: n,
    annualRate: parseFloat(interestRate || 18),
    schedule
  });
});

router.get('/rates', (req, res) => {
  res.json({
    banks: [
      { name: 'BBVA', minRate: 12.9, maxRate: 18.9, maxTerm: 60 },
      { name: 'Santander', minRate: 13.5, maxRate: 19.5, maxTerm: 60 },
      { name: 'Banorte', minRate: 14.0, maxRate: 20.0, maxTerm: 48 },
      { name: 'HSBC', minRate: 13.9, maxRate: 19.9, maxTerm: 60 },
      { name: 'Citibanamex', minRate: 12.5, maxRate: 18.5, maxTerm: 60 }
    ],
    terms: [12, 24, 36, 48, 60],
    defaultRate: 16.5,
    defaultTerm: 48
  });
});

module.exports = router;
