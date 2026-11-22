const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function figuresFor(items, coupon) {
  const checkout = pricing.computeTotals(items, coupon);
  const printed = invoice.computeInvoiceFigures({
    items,
    coupon,
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    total: checkout.total,
  });
  return { checkout, printed };
}

test('#1001 prints the checkout HSN slabs', () => {
  // Saved lines can carry HSN without carrying a gstRate override.
  const items = [
    { name: 'Rice', price: 50, qty: 2, hsn: '1006' },
    { name: 'Ghee', price: 200, qty: 1, hsn: '0405' },
  ];
  const { checkout, printed } = figuresFor(items, '');

  assert.deepEqual(checkout.lines.map(line => line.gstPercent), [5, 12]);
  assert.deepEqual([checkout.discount, checkout.tax, checkout.total], [0, 29, 329]);
  assert.deepEqual(printed, {
    subtotal: 300, discount: 0, tax: 29, cgst: 14.5, sgst: 14.5, total: 329,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 2, price: 50, gstPercent: 5, line: 100, lineTax: 5 },
      { name: 'Ghee', sku: '-', hsn: '0405', qty: 1, price: 200, gstPercent: 12, line: 200, lineTax: 24 },
    ],
  });
});

test('#1002 applies SAVE10 before GST on the invoice', () => {
  const items = [
    { name: 'Tea', sku: 'TEA', price: 300, qty: 2, hsn: '0902', gstRate: 18 },
  ];
  const { checkout, printed } = figuresFor(items, 'SAVE10');

  assert.deepEqual([checkout.discount, checkout.tax, checkout.total], [60, 97.2, 637.2]);
  assert.deepEqual(printed, {
    subtotal: 600, discount: 60, tax: 97.2, cgst: 48.6, sgst: 48.6, total: 637.2,
    rows: [
      { name: 'Tea', sku: 'TEA', hsn: '0902', qty: 2, price: 300, gstPercent: 18, line: 600, lineTax: 97.2 },
    ],
  });
});

test('#1004 honors the SAVE10 discount cap on the invoice', () => {
  const items = [
    { name: 'Coffee', price: 560, qty: 4, hsn: '0901' },
  ];
  const { checkout, printed } = figuresFor(items, 'SAVE10');

  assert.deepEqual([checkout.subtotal, checkout.discount, checkout.tax, checkout.total], [2240, 150, 376.2, 2466.2]);
  assert.deepEqual(printed, {
    subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2,
    rows: [
      { name: 'Coffee', sku: '-', hsn: '0901', qty: 4, price: 560, gstPercent: 18, line: 2240, lineTax: 376.2 },
    ],
  });
});

test('CURRENT BEHAVIOUR: #1008 matches checkout with only 18% items and no coupon', () => {
  const items = [
    { name: 'Tea', price: 75, qty: 2, hsn: '0902' },
    { name: 'Coffee', price: 200, qty: 1, hsn: '0901' },
  ];
  const { checkout, printed } = figuresFor(items, '');

  assert.deepEqual([checkout.discount, checkout.tax, checkout.total], [0, 63, 413]);
  assert.deepEqual(printed, {
    subtotal: 350, discount: 0, tax: 63, cgst: 31.5, sgst: 31.5, total: 413,
    rows: [
      { name: 'Tea', sku: '-', hsn: '0902', qty: 2, price: 75, gstPercent: 18, line: 150, lineTax: 27 },
      { name: 'Coffee', sku: '-', hsn: '0901', qty: 1, price: 200, gstPercent: 18, line: 200, lineTax: 36 },
    ],
  });
});

test('invoice matches checkout for mixed GST slabs and a capped SAVE10 discount', () => {
  const items = [
    { name: 'Rice', price: 500, qty: 2, hsn: '1006' },
    { name: 'Ghee', price: 620, qty: 2, hsn: '0405' },
  ];
  const { checkout, printed } = figuresFor(items, 'SAVE10');

  assert.equal(printed.subtotal, checkout.subtotal);
  assert.equal(printed.discount, 150);
  assert.equal(printed.discount, checkout.discount);
  assert.deepEqual(printed.rows.map(row => row.gstPercent), [5, 12]);
  assert.deepEqual(printed.rows.map(row => row.lineTax), checkout.lines.map(line => line.tax));
  assert.equal(printed.tax, checkout.tax);
  assert.equal(printed.cgst, checkout.cgst);
  assert.equal(printed.sgst, checkout.sgst);
  assert.equal(printed.total, checkout.total);
});
