# FalconLink — Marketplace + Payments Plan

Do bade chunks: **(A) Marketplace expansion** (Fiverr/Upwork-style gigs + custom requests) aur **(B) Payments + wallet** (Stripe + personal UPI QR + agent payouts). Plus chhota footer email change.

---

## 1. Database changes (migration)

### New tables

- **`agent_gigs`** — Fiverr-style listings agents khud create karenge
  - `agent_id`, `title`, `slug`, `description`, `category`, `cover_image_url`, `tags[]`, `status` (`draft|pending|approved|rejected|paused`), `rejection_reason`, timestamps
  - Sirf `approved` gigs public dikhenge; admin approve karega

- **`gig_packages`** — har gig ke 1-3 tier (Basic/Standard/Premium)
  - `gig_id`, `tier`, `title`, `description`, `price`, `delivery_days`, `revisions`

- **`service_requests`** — customer-posted custom demands (Upwork style)
  - `customer_id`, `title`, `description`, `category`, `budget_min`, `budget_max`, `pincode`, `deadline`, `status` (`open|assigned|completed|cancelled`)

- **`request_proposals`** — agents bid on requests
  - `request_id`, `agent_id`, `quote_price`, `delivery_days`, `message`, `status` (`pending|accepted|rejected`)

- **`payments`** — har booking ka payment record
  - `booking_id`, `amount`, `commission` (15%), `agent_amount` (85%), `method` (`stripe|upi_manual`), `status` (`pending|paid|failed|refunded`), `stripe_session_id`, `upi_utr`, `upi_screenshot_url`, `verified_by` (admin id), `verified_at`

- **`agent_wallets`** — running balance per agent
  - `agent_id` (unique), `available_balance`, `pending_balance`, `lifetime_earnings`

- **`wallet_transactions`** — credit/debit ledger
  - `agent_id`, `type` (`credit_booking|debit_withdrawal|adjustment`), `amount`, `booking_id`, `withdrawal_id`, `note`

- **`withdrawal_requests`** — agent payout requests
  - `agent_id`, `amount`, `upi_id`, `bank_account`, `ifsc`, `status` (`pending|approved|paid|rejected`), `admin_note`, `paid_at`

- **`platform_settings`** — single-row config
  - `commission_pct` (default 15), `upi_id`, `upi_qr_url`, `upi_payee_name`, `min_withdrawal`

### Bookings table changes
- Add `gig_id`, `package_tier`, `request_id` (nullable — booking can come from service catalog OR gig OR accepted proposal)
- Add `payment_status` (`unpaid|paid|refunded`)

### Storage buckets
- `gig-covers` (public read) — gig cover images
- `payment-proofs` (private, owner+admin) — UPI screenshots
- `id-proofs` (already exists pattern, ensure private)

### RLS (key rules)
- `agent_gigs`: agent CRUD own; public read approved only; admin all
- `gig_packages`: via gig ownership; public read for approved gigs
- `service_requests`: customer CRUD own; agents read open; admin all
- `request_proposals`: agent CRUD own; request owner read; admin all
- `payments`: customer read own (via booking); agent read own; admin all+update
- `agent_wallets` / `wallet_transactions`: agent read own; admin all
- `withdrawal_requests`: agent insert+read own; admin update
- `platform_settings`: public read of UPI fields; admin write

### Triggers / functions
- On `payments.status -> paid`: auto-credit `agent_wallets.pending_balance` with `agent_amount`, insert wallet_transaction
- On `bookings.status -> completed` + payment paid: move pending → available
- On withdrawal `paid`: debit available, insert wallet_transaction
- Slug generator for `agent_gigs`

---

## 2. Payments flow

### Stripe (Lovable's built-in seamless integration)
- Enable via `enable_stripe_payments` (Lovable-managed, no API key chahiye)
- Tax: **Option 3 — no tax automation** (govt services + India me MOR ineligible)
- Per-booking one-time payment

### Personal UPI QR (manual)
- Admin `/admin/settings` me UPI ID + QR image + payee name set kare → `platform_settings`
- Checkout par customer ko QR + UPI ID + amount dikhe
- Customer UTR number daale + screenshot upload kare
- Status `pending` → admin verify karke `paid` mark kare → wallet auto-credit

### Checkout page (`/checkout/$bookingId`)
- 2 tabs: **Stripe** (auto) | **UPI QR** (manual)
- Stripe success → `/api/public/webhooks/stripe` verify → mark paid
- UPI submit → status `pending`, admin notification

---

## 3. New routes

```
/services                     → 2 TABS: "Government Services" | "Freelance Gigs"
/gigs/$slug                   → Gig detail (packages, agent profile, reviews, Order button)
/requests                     → Browse open customer requests (agents)
/requests/new                 → Customer posts a request
/requests/$id                 → Request detail + proposals (owner + bidding agents)
/checkout/$bookingId          → Stripe / UPI tabs
/checkout/success             → Confirmation
/_authenticated/agent/gigs              → Agent: my gigs list
/_authenticated/agent/gigs/new          → Create/edit gig wizard
/_authenticated/agent/wallet            → Balance, transactions, withdraw button
/_authenticated/agent/proposals         → My bids on requests
/_authenticated/admin (existing)        → Add tabs: Gigs approval, Payments verify, Withdrawals, Settings (UPI/commission)
/api/public/webhooks/stripe             → Stripe webhook
```

### Server functions (createServerFn)
- `createGig`, `submitGigForApproval`, `approveGig`, `rejectGig`
- `createServiceRequest`, `submitProposal`, `acceptProposal` (creates booking)
- `createCheckoutSession` (Stripe), `submitUpiPayment`, `verifyUpiPayment` (admin)
- `requestWithdrawal`, `markWithdrawalPaid` (admin)

---

## 4. Agent gig template (Fiverr-style)

Wizard steps:
1. **Overview** — title, category, tags, search keywords
2. **Pricing** — 1-3 tiers (Basic/Standard/Premium): price, delivery days, revisions, what's included
3. **Description** — rich text, FAQs
4. **Cover image** — upload to `gig-covers` bucket
5. **Submit for review** — admin approve karega, fir public

Verified agents only can publish (existing `agents.verified` check).

---

## 5. Customer service request flow (Upwork-style)

1. Customer `/requests/new` par form bhare: title, desc, category, budget range, pincode, deadline
2. Verified agents `/requests` par browse karke proposals submit karein
3. Customer proposals dekhe, ek accept kare → automatic `booking` create + checkout redirect
4. Baad ka flow normal booking jaisa

---

## 6. Services page restructure

`/services` par 2 tabs (shadcn Tabs):
- **Government Services** — existing catalog (PAN, Aadhaar, etc.)
- **Freelance Gigs** — `agent_gigs` where status=approved, with category filter + search

Cards me **Book / Order** button → `/services/$slug` ya `/gigs/$slug`.

---

## 7. Commission + wallet logic

- Booking amount = ₹X
- Commission = 15% → platform
- Agent earnings = 85% → wallet `pending_balance`
- Booking complete + 0-day hold → move to `available_balance`
- Min withdrawal: ₹500 (configurable)
- Withdraw form: UPI ID ya bank+IFSC → admin manually pay → mark paid → wallet debit

Agent wallet page dikhayega: Available, Pending, Lifetime, Transactions list, "Withdraw" button.

---

## 8. Admin additions

New tabs in `/admin`:
- **Gigs** — pending approval list, approve/reject with reason
- **Payments** — pending UPI verifications (UTR + screenshot view + Mark Paid)
- **Withdrawals** — pending requests (agent details + amount + Mark Paid)
- **Settings** — UPI ID, QR upload, payee name, commission %, min withdrawal

---

## 9. Footer email change

`src/components/layout/Footer.tsx` me email update → **business.aarishsaifi@gmail.com**

---

## 10. Build order

1. Migration (all tables, RLS, triggers, buckets, seed `platform_settings`)
2. Footer email change (1-line)
3. Enable Stripe payments (Lovable seamless)
4. Admin settings page (UPI/commission config)
5. Payments table + checkout page (Stripe + UPI tabs) + Stripe webhook
6. Wallet system (server fns, agent wallet page, withdrawal flow, admin withdrawals tab)
7. Agent gigs (wizard, my-gigs page, admin approval tab, gig detail public page)
8. Customer service requests (post + browse + proposals + accept flow)
9. Services page tabs restructure (Government | Gigs)
10. Polish: notifications on payment/approval/withdrawal events, empty states

---

## Technical notes

- All payment + wallet mutations via `createServerFn` with `requireSupabaseAuth`; admin checks via `has_role(uid,'admin')`
- Stripe webhook at `/api/public/webhooks/stripe` with signature verification (uses `STRIPE_WEBHOOK_SECRET` auto-set by Lovable)
- UPI screenshot upload via Supabase Storage signed URLs
- Wallet ledger pattern: never mutate balances directly — always insert `wallet_transactions` and recompute via trigger to avoid drift
- Gigs use slug for SEO; each gig page gets unique `head()` meta

## Out of scope (V2)

- Stripe Connect auto-split (using manual wallet now)
- In-app chat between customer and agent
- Gig analytics/impressions
- Dispute resolution UI (admin can manually refund for now)
