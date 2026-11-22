# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and body-parser for JSON requests.
- Static HTML, CSS, and browser JavaScript in `public/`, served by `server.js`.
- File-backed storage in `data/db.json`. Printable invoices are server-rendered HTML.

## Module map

- `routes/customers.js` — lists Khata customers and recent settlements, and records repayments.
- `routes/orders.js` — lists, retrieves, places, and cancels orders.
- `routes/products.js` — lists catalog products and active coupons.
- `routes/reports.js` — serves dashboard and GST reconciliation reports, previews cart pricing, and exports data.
- `lib/coupons.js` — normalizes and validates coupon codes and calculates discounts.
- `lib/dates.js` — formats dates, normalizes date strings for filters, and derives fiscal years.
- `lib/inventory.js` — finds products, checks sellable quantities, deducts stock, releases holds, and summarizes inventory.
- `lib/invoice.js` — recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` — calculates Khata balances, charges orders, reverses debits, and records settlements.
- `lib/orders.js` — adds, retrieves, filters, and cancels order records.
- `lib/pricing.js` — calculates subtotals, allocates discounts, and computes line GST and checkout totals.
- `lib/reports.js` — aggregates dashboard figures and compares invoice figures with saved order totals and GST.
- `lib/store.js` — reads and writes the JSON database and keeps the most recent 100 audit entries.
- `lib/tax.js` — resolves GST rates from item overrides or HSN keys with a default fallback, and splits GST into CGST and SGST.

## Commands

- Start the app from the repo root with `node server.js`. The default port is 3000 and `PORT` overrides it.
- Run tests from the repo root with `node --test`. No test files are present, and the package test script is a placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the modules the ticket is about.
3. Use in-memory data in tests. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout applies HSN-based GST to discounted lines. The invoice recalculates from undiscounted lines using a saved item rate when truthy or the default rate, then applies its own coupon calculation.

Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
