# Reconciliation Dashboard

A React-based financial reconciliation tool that compares **Platform Transactions** against **Bank Settlements**, automatically categorizes every discrepancy, and presents results in a clean, interactive dashboard.

---

## What It Does

When a payment platform (e.g. Razorpay, Stripe) processes a transaction, the money eventually lands in your bank account — but not always cleanly. Dates shift, amounts round differently, duplicates slip through, and some transactions never settle at all.

This tool uploads both CSVs, runs a reconciliation algorithm, and puts every transaction into one of **8 clearly labelled categories** so you instantly know what needs attention.

---

## The 8 Case Types

| Icon | Category | What It Means |
|------|----------|---------------|
| ✅ | **Normal Match** | Same ID, same amount, settlement in the same calendar month. Clean. |
| 📅 | **Next Month Settlement** | Same ID and amount, but the bank settled it in the following month. **Not an error** — just a timing difference. |
| ❌ | **Missing in Bank** | The transaction exists on the platform but was never found in the bank statement. Needs investigation. |
| 💸 | **Amount Mismatch** | Same transaction ID but the amounts differ by more than ₹0.01. Potential fee deduction or data error. |
| 💰 | **Rounding Issue** | Amounts differ by ≤ 0.01. Caused by floating-point precision — safe to ignore. |
| 🔁 | **Duplicate Entry** | The same transaction ID appears more than once in the bank file. Possible double-settlement. |
| 🔄 | **Missing in Platform** | A positive bank entry exists with no matching platform transaction. Unexpected credit. |
| 💳 | **Refund / Anomaly** | A negative-amount bank entry with no corresponding platform transaction. Likely a reversal or chargeback. |

---

## How It Works — The Flow

```
Upload CSVs → Parse → Build Bank Map → Loop Platform Transactions → Categorize → Display
```

### Step-by-step (core logic in `reconcile.js`)

1. **Parse both CSVs** into arrays of objects using `parseCSV.js`.
2. **Build a bank map** — index every bank entry by `transaction_id` for O(1) lookups.
3. **Loop through platform transactions**:
   - Not in bank map → **Missing in Bank**
   - Appears more than once in bank → **Duplicate**
   - Amount matches (diff ≤ 0.001):
     - Dates cross a month boundary → **Next Month Settlement**
     - Same month → **Match**
   - Amount diff ≤ 0.01 → **Rounding Issue**
   - Amount diff > 0.01 → **Mismatch**
4. **Loop through bank entries** not seen in platform:
   - Negative amount → **Refund / Anomaly**
   - Positive amount → **Missing in Platform**

---

## Project Structure

```
aiassessment/
├── src/
│   ├── components/
│   │   ├── Upload.jsx          # Two-file drop zone UI
│   │   ├── Results.jsx         # Summary cards + accordion tables
│   │   └── ReportDownload.jsx  # JSON report download helper
│   ├── utils/
│   │   ├── reconcile.js        # Core reconciliation algorithm (8 cases)
│   │   └── parseCSV.js         # CSV text → array of objects
│   ├── csv_files/              # Sample CSVs for testing (see below)
│   ├── App.jsx                 # Root layout + step indicator
│   ├── main.jsx                # React entry point
│   └── index.css               # All styles (no external UI library)
└── index.html
```

---

## Running Locally

```bash
cd aiassessment
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## Try It — Sample CSV Data

> **Copy the data below into two separate `.csv` files and upload them to see all 8 reconciliation cases in action.**

---

### File 1 — `platform_transactions.csv`

Save this as `platform_transactions.csv`:

```
transaction_id,user_id,amount,transaction_date
T1,U1,100.00,2026-03-01
T2,U2,200.00,2026-03-02
T3,U3,150.00,2026-03-05
T4,U1,300.00,2026-03-10
T5,U2,250.00,2026-03-15
T6,U3,400.00,2026-03-20
T7,U4,500.00,2026-03-30
T8,U5,120.00,2026-03-31
T9,U1,75.00,2026-03-25
T10,U2,60.00,2026-03-28
T11,U3,90.005,2026-03-18
T12,U4,220.00,2026-03-22
```

**Upload this as the "Platform Transactions" file.**

---

### File 2 — `bank_settlements.csv`

Save this as `bank_settlements.csv`:

```
settlement_id,transaction_id,amount,settlement_date
S1,T1,100.00,2026-03-02
S2,T2,200.00,2026-03-03
S3,T3,150.00,2026-03-06
S4,T4,300.00,2026-03-11
S5,T5,250.00,2026-03-16
S6,T6,400.00,2026-03-21
S7,T7,500.00,2026-04-02
S8,T9,75.00,2026-03-26
S9,T10,55.00,2026-03-29
S10,T11,90.00,2026-03-19
S11,T12,220.00,2026-03-23
S12,T12,220.00,2026-03-23
S13,T999,-300.00,2026-03-27
```

**Upload this as the "Bank Statement" file.**

---

### What Each Transaction Demonstrates

| Transaction | Platform | Bank | Expected Category |
|-------------|----------|------|-------------------|
| T1–T6 | $100–$400 | $100–$400 | ✅ Normal Match |
| T7 | $500 on Mar 30 | $500 on **Apr 2** | 📅 Next Month Settlement |
| T8 | $120 on Mar 31 | *(not in bank)* | ❌ Missing in Bank |
| T9 | $75 | $75 | ✅ Normal Match |
| T10 | $60 | $55 | 💸 Amount Mismatch |
| T11 | $90.005 | $90.00 | 💰 Rounding Issue |
| T12 | $220 | $220 × 2 entries | 🔁 Duplicate Entry |
| T999 | *(not in platform)* | −$300 | 💳 Refund / Anomaly |

---

## Tech Stack

- **React 19** + **Vite 8**
- **No external UI library** — pure CSS with custom design
- **No backend** — runs entirely in the browser